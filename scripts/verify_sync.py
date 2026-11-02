#!/usr/bin/env python3
"""Verify that rendered object-sound hits align with their planned frames."""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import scipy.io.wavfile as wav
import scipy.signal as sg


video, cues_path = sys.argv[1], sys.argv[2]
tol = float(sys.argv[sys.argv.index('--tol-ms') + 1]) if '--tol-ms' in sys.argv else 40.0
cues = json.load(open(cues_path, encoding='utf-8'))

def run(command):
    return subprocess.run(command, capture_output=True, text=True, check=False)

probe = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', video]).stdout)['streams']
video_stream = next(stream for stream in probe if stream['codec_type'] == 'video')
audio_stream = next((stream for stream in probe if stream['codec_type'] == 'audio'), None)
if not audio_stream:
    sys.exit('FAIL: no audio stream')
num, den = map(int, video_stream['r_frame_rate'].split('/'))
fps = num / den
video_duration, audio_duration = float(video_stream['duration']), float(audio_stream['duration'])
fails = []
if abs(video_duration - audio_duration) > 1 / fps:
    fails.append(f'audio/video length differ by {abs(video_duration - audio_duration) * 1000:.0f} ms')

wav_path = '/tmp/animation_pipeline_verify_sync.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '22050', wav_path], check=True)
sample_rate, samples = wav.read(wav_path)
samples = samples.astype(float) / 32768
raw_samples = samples.copy()
high_pass = sg.butter(4, 1500 / (sample_rate / 2), 'high', output='sos')
samples = sg.sosfiltfilt(high_pass, samples)
_, times, spectrum = sg.stft(samples, sample_rate, nperseg=512, noverlap=384)
flux = np.maximum(np.diff(np.abs(spectrum), axis=1), 0).sum(0)
times = times[1:]
floor = np.median(flux) + 1e-9
offsets = []
offset_details = []
source_audio_cache = {}

def source_hit_offset(cue):
    """Find the exact rendered SFX waveform and measure its manifest hit time."""
    source = cue.get('src')
    if not source or cue.get('startFrame') is None or cue.get('transientMs') is None:
        return None
    source_path = (Path(__file__).resolve().parent.parent / 'remotion' / 'public' / source).resolve()
    public_root = (Path(__file__).resolve().parent.parent / 'remotion' / 'public').resolve()
    if public_root not in source_path.parents or not source_path.is_file():
        return None
    key = str(source_path)
    if key not in source_audio_cache:
        decoded = subprocess.run(
            ['ffmpeg', '-v', 'error', '-i', key, '-f', 's16le', '-ac', '1', '-ar', str(sample_rate), 'pipe:1'],
            capture_output=True, check=False,
        )
        if decoded.returncode != 0 or not decoded.stdout:
            return None
        source_audio_cache[key] = np.frombuffer(decoded.stdout, dtype='<i2').astype(float) / 32768
    template = source_audio_cache[key]
    if len(template) < 32:
        return None

    # Compare the source effect with the final mono mix near its scheduled start.
    # Correlation separates a quiet effect from louder narration at the same time.
    filtered_template = sg.sosfiltfilt(high_pass, template)
    expected_start = round(float(cue['startFrame']) / fps * sample_rate)
    search = round((tol / 1000 + 0.025) * sample_rate)
    left = max(0, expected_start - search)
    right = min(len(raw_samples), expected_start + len(template) + search)
    segment = sg.sosfiltfilt(high_pass, raw_samples[left:right])
    if len(segment) < len(filtered_template):
        return None
    correlation = sg.correlate(segment, filtered_template, mode='valid', method='fft')
    window_energy = sg.fftconvolve(segment ** 2, np.ones(len(filtered_template)), mode='valid')
    normalized = np.abs(correlation) / (np.sqrt(np.maximum(window_energy, 1e-12)) * np.linalg.norm(filtered_template) + 1e-12)
    best = int(np.argmax(normalized))
    # Short transients (especially pops mixed under narration) can correlate
    # weakly with unrelated audio. Use source matching only when it is strong;
    # the spectral-flux detector remains the fallback for those cues.
    if normalized[best] < 0.25:
        return None
    actual_start = left + best
    actual_hit = actual_start / sample_rate + float(cue['transientMs']) / 1000
    expected_hit = float(cue['hitFrame']) / fps
    return (actual_hit - expected_hit) * 1000, float(normalized[best])

for cue in cues:
    hit = cue['hitFrame'] / fps
    source_match = source_hit_offset(cue)
    if source_match is not None:
        measured_offset, confidence = source_match
        offsets.append(measured_offset)
        offset_details.append((cue['sourceId'], cue.get('role', 'unknown'), measured_offset, confidence))
        continue
    matches = (times > hit - 0.15) & (times < hit + 0.15)
    match_times = times[matches]
    match_flux = flux[matches]
    # Swells such as whooshes and risers have a broad peak rather than the
    # sharp spectral onset produced by clicks, pops, or ticks. Use a lower but
    # still relative threshold for those roles so real, correctly-timed swells
    # are not rejected as missing hits.
    hit_threshold = floor * (1.5 if cue.get('role') in {'whoosh', 'riser'} else 4)
    peaks_idx, _ = sg.find_peaks(match_flux, height=hit_threshold)
    if len(peaks_idx) > 0:
        closest_idx = peaks_idx[np.argmin(np.abs(match_times[peaks_idx] - hit))]
        peak = match_times[closest_idx]
        peak_flux = match_flux[closest_idx]
    else:
        peak_index = np.argmax(match_flux)
        peak = match_times[peak_index]
        peak_flux = match_flux[peak_index]
    if peak_flux < hit_threshold:
        fails.append(f"{cue['sourceId']} ({cue['role']}): no audible hit near frame {cue['hitFrame']}")
        continue
    offsets.append((peak - hit) * 1000)
    offset_details.append((cue['sourceId'], cue.get('role', 'unknown'), (peak - hit) * 1000, None))

if cues and not offsets:
    fails.append('no planned cues were detected in the audio track')
if offsets:
    offsets = np.array(offsets)
    bad = np.abs(offsets) > tol
    print(f'cues checked {len(offsets)}/{len(cues)} | median offset {np.median(offsets):+.0f} ms | worst {offsets[np.argmax(np.abs(offsets))]:+.0f} ms | outside ±{tol:.0f} ms: {bad.sum()}')
    for source_id, role, offset_ms, confidence in offset_details:
        if abs(offset_ms) > tol:
            match_text = f' (source match {confidence:.2f})' if confidence is not None else ''
            print(f'OUT OF SYNC: {source_id} ({role}) is {offset_ms:+.0f} ms from its planned hit{match_text}')
    if abs(np.median(offsets)) > 20:
        fails.append(f'systematic offset {np.median(offsets):+.0f} ms')
    if bad.any():
        fails.append(f'{bad.mean() * 100:.0f}% of cues outside ±{tol:.0f} ms')

silence = run(['ffmpeg', '-hide_banner', '-i', video, '-af', 'silencedetect=noise=-50dB:d=0.4', '-f', 'null', '-']).stderr
gaps = re.findall(r'silence_duration: ([0-9.]+)', silence)
if gaps:
    fails.append(f'{len(gaps)} dead-air gap(s) over 0.4 s')

print('PASS' if not fails else 'FAIL')
for failure in fails:
    print(' -', failure)
sys.exit(1 if fails else 0)
