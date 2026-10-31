#!/usr/bin/env python3
"""Verify that rendered object-sound hits align with their planned frames."""
import json
import re
import subprocess
import sys

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
high_pass = sg.butter(4, 1500 / (sample_rate / 2), 'high', output='sos')
samples = sg.sosfiltfilt(high_pass, samples)
_, times, spectrum = sg.stft(samples, sample_rate, nperseg=512, noverlap=384)
flux = np.maximum(np.diff(np.abs(spectrum), axis=1), 0).sum(0)
times = times[1:]
floor = np.median(flux) + 1e-9
offsets = []
for cue in cues:
    hit = cue['hitFrame'] / fps
    matches = (times > hit - 0.15) & (times < hit + 0.15)
    match_times = times[matches]
    match_flux = flux[matches]
    peaks_idx, _ = sg.find_peaks(match_flux, height=4 * floor)
    if len(peaks_idx) > 0:
        closest_idx = peaks_idx[np.argmin(np.abs(match_times[peaks_idx] - hit))]
        peak = match_times[closest_idx]
        peak_flux = match_flux[closest_idx]
    else:
        peak_index = np.argmax(match_flux)
        peak = match_times[peak_index]
        peak_flux = match_flux[peak_index]
    if peak_flux < 4 * floor:
        fails.append(f"{cue['sourceId']} ({cue['role']}): no audible hit near frame {cue['hitFrame']}")
        continue
    offsets.append((peak - hit) * 1000)

if cues and not offsets:
    fails.append('no planned cues were detected in the audio track')
if offsets:
    offsets = np.array(offsets)
    bad = np.abs(offsets) > tol
    print(f'cues checked {len(offsets)}/{len(cues)} | median offset {np.median(offsets):+.0f} ms | worst {offsets[np.argmax(np.abs(offsets))]:+.0f} ms | outside ±{tol:.0f} ms: {bad.sum()}')
    if abs(np.median(offsets)) > 20:
        fails.append(f'systematic offset {np.median(offsets):+.0f} ms')
    if bad.mean() > 0.1:
        fails.append(f'{bad.mean() * 100:.0f}% of cues outside ±{tol:.0f} ms')

silence = run(['ffmpeg', '-hide_banner', '-i', video, '-af', 'silencedetect=noise=-50dB:d=0.4', '-f', 'null', '-']).stderr
gaps = re.findall(r'silence_duration: ([0-9.]+)', silence)
if gaps:
    fails.append(f'{len(gaps)} dead-air gap(s) over 0.4 s')

print('PASS' if not fails else 'FAIL')
for failure in fails:
    print(' -', failure)
sys.exit(1 if fails else 0)
