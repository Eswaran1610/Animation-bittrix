#!/usr/bin/env python3
"""
Synthesizes speech using edge-tts and captures native word-boundary timestamps.
Outputs the MP3 audio file and an exact word-level alignment JSON.
"""

import argparse
import asyncio
import json
import os
import sys

try:
    import edge_tts
except ImportError:
    sys.stderr.write("edge_tts package is required. Install with: pip install edge-tts\n")
    sys.exit(1)


async def synthesize_with_alignment(
    text: str,
    output_audio: str,
    output_alignment: str,
    voice: str = "en-US-JennyNeural",
    speed_multiplier: float = 1.0,
):
    rate_percent = round((speed_multiplier - 1.0) * 100)
    rate_str = f"{'+' if rate_percent >= 0 else ''}{rate_percent}%"

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate_str,
        boundary="WordBoundary",
    )

    words = []
    os.makedirs(os.path.dirname(os.path.abspath(output_audio)), exist_ok=True)
    if output_alignment:
        os.makedirs(os.path.dirname(os.path.abspath(output_alignment)), exist_ok=True)

    with open(output_audio, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset and duration are in 100-nanosecond ticks (1e-7 seconds)
                start_sec = round(chunk["offset"] / 10_000_000, 3)
                dur_sec = round(chunk["duration"] / 10_000_000, 3)
                end_sec = round(start_sec + dur_sec, 3)
                clean_word = chunk["text"].strip()
                if clean_word:
                    words.append({
                        "word": clean_word,
                        "startSec": start_sec,
                        "endSec": end_sec,
                        "startMs": round(start_sec * 1000),
                        "endMs": round(end_sec * 1000),
                    })

    if output_alignment:
        payload = {
            "text": text,
            "voice": voice,
            "speedMultiplier": speed_multiplier,
            "words": words,
        }
        with open(output_alignment, "w", encoding="utf-8") as align_file:
            json.dump(payload, align_file, indent=2, ensure_ascii=False)

    print(json.dumps({"wordCount": len(words), "audioPath": output_audio, "alignmentPath": output_alignment}))


def main():
    parser = argparse.ArgumentParser(description="Edge-TTS speech & word alignment generator")
    parser.add_argument("--text", required=True, help="Narration text")
    parser.add_argument("--audio", required=True, help="Destination audio MP3 path")
    parser.add_argument("--alignment", required=True, help="Destination alignment JSON path")
    parser.add_argument("--voice", default="en-US-JennyNeural", help="TTS voice")
    parser.add_argument("--speed", type=float, default=1.0, help="Speed multiplier")

    args = parser.parse_args()
    asyncio.run(
        synthesize_with_alignment(
            text=args.text,
            output_audio=args.audio,
            output_alignment=args.alignment,
            voice=args.voice,
            speed_multiplier=args.speed,
        )
    )


if __name__ == "__main__":
    main()
