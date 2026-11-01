"""
Synthesizes a musical ambient synth bed for Remotion videos.
Inspired by Claude's motion graphics reference implementation.
Generates an Am -> F -> C -> G ambient chord progression with lush analog pad,
warm sub-bass root, and gentle rhythm that sits cleanly under voice narration.
"""
import sys
import wave
import numpy as np

def generate_music_bed(output_path: str, duration_sec: float = 20.0, bpm: float = 120.0):
    SR = 44100
    n = max(SR, int(SR * duration_sec))
    tt = np.arange(n) / SR
    beat = 60.0 / bpm
    
    # Am -> F -> C -> G ambient progression
    chords = [
        (220.0, 261.63, 329.63),      # Am
        (174.61, 220.0, 261.63),      # F
        (261.63, 329.63, 392.0),      # C
        (196.0, 246.94, 293.66)       # G
    ]
    
    pad = np.zeros(n)
    bass = np.zeros(n)
    bar = beat * 8  # 4 seconds per chord
    
    for i in range(int(np.ceil(duration_sec / bar))):
        s = int(i * bar * SR)
        e = min(n, int((i + 1) * bar * SR))
        if s >= n or e <= s:
            continue
        ch = chords[i % len(chords)]
        seg = tt[s:e]
        local = seg - seg[0]
        fade_len = min(0.6, (e - s) / SR / 2)
        w = np.minimum(1.0, local / max(1e-4, fade_len)) * np.minimum(1.0, ((e - s) / SR - local) / max(1e-4, fade_len))
        
        for f in ch:
            pad[s:e] += (
                np.sin(2 * np.pi * f * seg) * 0.45 +
                np.sin(2 * np.pi * f * 1.003 * seg) * 0.35 +
                np.sin(2 * np.pi * (f * 2) * seg) * 0.12
            ) * 0.10 * w
        
        # Sub-bass root
        bass_freq = ch[0] / 2
        bass[s:e] += (
            np.sin(2 * np.pi * bass_freq * seg) +
            np.sin(2 * np.pi * bass_freq * 2 * seg) * 0.25
        ) * 0.20 * w

    # Subtle beat: soft kick on beat + light hat on off-beat
    drums = np.zeros(n)
    kt = np.arange(int(SR * 0.25)) / SR
    kick = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-kt * 18) + 42) / SR) * np.exp(-kt * 10)
    
    ht = np.arange(int(SR * 0.04)) / SR
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 1, len(ht))
    hat = (noise - np.convolve(noise, np.ones(5) / 5, mode='same')) * np.exp(-ht * 80)
    
    for b in range(int(duration_sec / beat)):
        sec = b * beat
        o_k = int(sec * SR)
        if o_k + len(kick) <= n:
            drums[o_k:o_k + len(kick)] += kick * 0.18
        o_h = int((sec + beat * 0.5) * SR)
        if o_h + len(hat) <= n:
            drums[o_h:o_h + len(hat)] += hat * 0.06
            
    mix = pad + bass + drums
    # Smooth master in/out taper
    mix *= np.minimum(1.0, tt / 1.0) * np.minimum(1.0, (duration_sec - tt) / 1.5)
    
    # Normalize to -6 dBFS peak for clean headroom
    peak = np.abs(mix).max()
    if peak > 1e-6:
        mix = mix * (0.50 / peak)
        
    stereo = np.stack([mix, mix], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype('<i2')
    with wave.open(output_path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 synthBed.py <output_path> [duration_sec] [bpm]")
        sys.exit(1)
    out_file = sys.argv[1]
    dur = float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
    tempo = float(sys.argv[3]) if len(sys.argv) > 3 else 120.0
    generate_music_bed(out_file, dur, tempo)
