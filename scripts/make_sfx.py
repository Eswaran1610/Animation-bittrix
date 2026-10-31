#!/usr/bin/env python3
"""
make_sfx.py: procedural OBJECT SOUND EFFECTS for the daily motion-video pipeline.

Everything is synthesized from math (no samples, no downloads), so it is licence-free and works
offline. A new --seed (use the job id) gives a new variant set, so every video sounds different
but repeatable. For each file the script MEASURES where the audible "hit" is (transientMs), so the
Remotion cue builder can shift the file and land the hit exactly on the visual frame.

usage:
  python make_sfx.py --out public/sfx --seed 2026-10-31-job1 --variants 4
  python make_sfx.py --out public/sfx --roles pop,whoosh --variants 6
output:
  <out>/<role>_01.wav ...      mono, 48 kHz, 16-bit, peak about -1 dBFS (mix level comes from "gain")
  <out>/sfx.manifest.json      [{file, role, transientMs, durationMs, gain, peakDb}]
  <out>/demo_all.wav           every role once, so a human can audition the set quickly
"""
import argparse, json, os, zlib
import numpy as np
from scipy import signal as sg
from scipy.io import wavfile

SR = 48000


def tt(d): return np.arange(int(SR * d)) / SR
def expd(t, tau): return np.exp(-t / tau)


def swept_noise(rng, d, f0, f1, q=3.0):
    """Band-passed noise whose centre frequency glides f0 -> f1 (geometric)."""
    n = int(SR * d); x = rng.standard_normal(n); y = np.zeros(n); blk = 256; zi = None
    for i in range(0, n, blk):
        f = min(f0 * (f1 / f0) ** (i / n), SR * 0.45)
        bw = f / q; lo = max(f - bw / 2, 40.0); hi = min(f + bw / 2, SR * 0.47)
        sos = sg.butter(2, [lo, hi], "band", fs=SR, output="sos")
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        seg, zi = sg.sosfilt(sos, x[i:i + blk], zi=zi); y[i:i + blk] = seg
    return y


def gauss(t, peak, sigma): return np.exp(-0.5 * ((t - peak) / sigma) ** 2)


def ping(t, f, tau, start=0.0, amp=1.0):
    m = t >= start; out = np.zeros_like(t); tl = t[m] - start
    out[m] = amp * np.sin(2 * np.pi * f * tl) * expd(tl, tau) * np.minimum(tl / 0.0008, 1)
    return out


# ------------------------------------------------------------------ roles
def pop(rng):
    t = tt(0.2); f0, f1 = rng.uniform(700, 1100), rng.uniform(180, 300)
    f = f1 + (f0 - f1) * expd(t, 0.02); body = np.sin(2 * np.pi * np.cumsum(f) / SR) * expd(t, rng.uniform(0.04, 0.06))
    click = rng.standard_normal(len(t)) * expd(t, 0.002)
    return body * np.minimum(t / 0.001, 1) + 0.35 * click

def click(rng):
    t = tt(0.09); n = sg.sosfilt(sg.butter(2, 1500, "high", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return n * expd(t, 0.006) + 0.6 * ping(t, rng.uniform(2200, 3800), 0.012)

def tick(rng):
    t = tt(0.06)
    return ping(t, rng.uniform(3500, 5500), 0.005) + 0.4 * rng.standard_normal(len(t)) * expd(t, 0.0025)

def whoosh(rng):
    d = rng.uniform(0.55, 0.8); t = tt(d); n = swept_noise(rng, d, rng.uniform(250, 400), rng.uniform(3800, 5200), q=2.2)
    return n * gauss(t, d * rng.uniform(0.5, 0.6), d * 0.2)

def slide(rng):
    d = rng.uniform(0.24, 0.32); t = tt(d); n = swept_noise(rng, d, rng.uniform(500, 800), rng.uniform(2200, 3000), q=2.5)
    return n * gauss(t, d * 0.4, d * 0.22)

def riser(rng):
    d = rng.uniform(0.9, 1.2); t = tt(d); n = swept_noise(rng, d, 200, rng.uniform(5000, 7000), q=2.0)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1000 * (t / d) ** 2) / SR) * 0.25
    return (n + tone) * (t / d) ** 2

def impact(rng):
    d = 0.9; t = tt(d); f = 45 + (rng.uniform(100, 130) - 45) * expd(t, 0.06)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * expd(t, rng.uniform(0.22, 0.32))
    thump = sg.sosfilt(sg.butter(2, 400, "low", fs=SR, output="sos"), rng.standard_normal(len(t))) * expd(t, 0.12)
    crack = rng.standard_normal(len(t)) * expd(t, 0.004)
    return (sub + 0.5 * thump + 0.25 * crack) * np.minimum(t / 0.001, 1)

def sparkle(rng):
    t = tt(0.6); out = np.zeros_like(t); base = rng.choice([2093.0, 2349.0, 2637.0])
    for k in range(rng.integers(4, 7)):
        f = base * rng.choice([1, 1.25, 1.5, 2, 2.5]); out += ping(t, f, rng.uniform(0.05, 0.1), start=rng.uniform(0, 0.25), amp=rng.uniform(0.4, 1))
    return out

def chime(rng):
    t = tt(1.0); f = rng.choice([523.25, 587.33, 659.25, 783.99, 880.0])
    return sum(a * ping(t, f * r, tau) for r, a, tau in ((1, 1, 0.5), (2.76, 0.5, 0.3), (5.4, 0.25, 0.15)))

def draw(rng):
    d = rng.uniform(0.35, 0.5); t = tt(d); n = swept_noise(rng, d, rng.uniform(1200, 1800), rng.uniform(4500, 5800), q=6.0)
    return n * np.sin(np.pi * t / d) ** 2

def count(rng):
    t = tt(0.6); out = np.zeros_like(t); f = rng.uniform(1700, 2000)
    for k in range(6): out += ping(t, f * (1 + 0.1 * k), 0.012, start=k * 0.09) + 0.3 * rng.standard_normal(len(t)) * expd(np.maximum(t - k * 0.09, 0), 0.002) * (t >= k * 0.09)
    return out

def ding(rng):
    t = tt(0.5); f = rng.choice([880.0, 988.0, 1047.0])
    return ping(t, f, 0.12) + 0.6 * ping(t, f * 1.5, 0.1, start=0.07)


# role: (function, how the hit is found, mix gain used by the cue builder)
ROLES = {
    "pop": (pop, "onset", 0.9), "click": (click, "onset", 0.6), "tick": (tick, "onset", 0.45),
    "whoosh": (whoosh, "peak", 0.7), "slide": (slide, "peak", 0.5), "riser": (riser, "peak", 0.55),
    "impact": (impact, "onset", 0.9), "sparkle": (sparkle, "onset", 0.5), "chime": (chime, "onset", 0.55),
    "draw": (draw, "peak", 0.4), "count": (count, "onset", 0.45), "ding": (ding, "onset", 0.55),
}


# ------------------------------------------------------------------ post-processing and measurement
def finish(x, peak_db=-1.0):
    x = x - np.mean(x)
    x = x * np.minimum(np.arange(len(x)) / (SR * 0.0005), 1)            # 0.5 ms fade-in (keeps attacks sharp)
    k = int(SR * 0.012); x[-k:] *= np.linspace(1, 0, k)                   # 12 ms fade-out, no end click
    return x / (np.max(np.abs(x)) + 1e-12) * 10 ** (peak_db / 20)


def hit_time_ms(x, mode):
    # Align measurement with verify_sync.py high-pass spectral flux analysis
    try:
        high_pass = sg.butter(4, 1500 / (SR / 2), "high", output="sos")
        filtered = sg.sosfiltfilt(high_pass, x)
        _, times, spectrum = sg.stft(filtered, SR, nperseg=512, noverlap=384)
        flux = np.maximum(np.diff(np.abs(spectrum), axis=1), 0).sum(0)
        times = times[1:]
        if len(flux) > 0 and np.max(flux) > 0:
            return float(times[np.argmax(flux)] * 1000)
    except Exception:
        pass
    env = sg.sosfiltfilt(sg.butter(2, 60, "low", fs=SR, output="sos"), np.abs(x))
    if mode == "peak": return float(np.argmax(env) / SR * 1000)
    return float(np.argmax(env >= 0.3 * env.max()) / SR * 1000)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/sfx"); ap.add_argument("--seed", default="default")
    ap.add_argument("--variants", type=int, default=4); ap.add_argument("--roles", default="all")
    ap.add_argument("--prefix", default="sfx", help="path prefix written into the manifest (staticFile-relative)")
    a = ap.parse_args()
    roles = list(ROLES) if a.roles == "all" else [r.strip() for r in a.roles.split(",")]
    bad = [r for r in roles if r not in ROLES]
    if bad: raise SystemExit(f"unknown role(s): {bad}. available: {list(ROLES)}")
    os.makedirs(a.out, exist_ok=True); base = zlib.crc32(a.seed.encode()); manifest = []; demo = []

    for ri, role in enumerate(roles):
        fn, mode, gain = ROLES[role]
        for v in range(1, a.variants + 1):
            rng = np.random.default_rng([base, ri, v]); x = finish(np.asarray(fn(rng), float))
            assert np.isfinite(x).all() and len(x) > 0 and np.max(np.abs(x)) <= 0.9
            name = f"{role}_{v:02d}.wav"; wavfile.write(os.path.join(a.out, name), SR, (x * 32767).astype(np.int16))
            manifest.append({"file": f"{a.prefix}/{name}", "role": role, "transientMs": round(hit_time_ms(x, mode), 1),
                             "durationMs": round(len(x) / SR * 1000), "gain": gain, "peakDb": round(20 * np.log10(np.max(np.abs(x))), 1)})
            if v == 1: demo += [x * gain, np.zeros(int(SR * 0.6))]

    json.dump({"seed": a.seed, "sampleRate": SR, "items": manifest}, open(os.path.join(a.out, "sfx.manifest.json"), "w"), indent=1)
    wavfile.write(os.path.join(a.out, "demo_all.wav"), SR, (np.concatenate(demo) * 32767).astype(np.int16))
    print(f"seed={a.seed!r}: {len(manifest)} files in {a.out}")
    for m in manifest:
        if m["file"].endswith("_01.wav"): print(f"  {m['role']:8s} hit at {m['transientMs']:6.1f} ms | length {m['durationMs']:5d} ms | gain {m['gain']}")


if __name__ == "__main__":
    main()
