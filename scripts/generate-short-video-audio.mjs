import fs from 'node:fs';
import path from 'node:path';

const outputDirectory = path.resolve('remotion/public/audio');
fs.mkdirSync(outputDirectory, { recursive: true });
const sampleRate = 44100;

const writeWav = (filePath, samples) => {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + samples.length * 2, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, index) => buffer.writeInt16LE(Math.max(-1, Math.min(1, sample)) * 32767, 44 + index * 2));
  fs.writeFileSync(filePath, buffer);
};

const musicDuration = 20;
const notes = [130.81, 155.56, 196, 233.08, 261.63, 196, 174.61, 220];
const music = new Float32Array(sampleRate * musicDuration);
for (let index = 0; index < music.length; index += 1) {
  const time = index / sampleRate;
  const note = notes[Math.floor(time / 0.5) % notes.length];
  const pulse = 0.5 + 0.5 * Math.sin(time * Math.PI * 2 / 2);
  const pad = Math.sin(time * note * Math.PI * 2) * 0.08 + Math.sin(time * note * 2 * Math.PI * 2) * 0.025;
  const beat = Math.sin(time * 110 * Math.PI * 2) * (index % Math.floor(sampleRate * 0.5) < sampleRate * 0.04 ? 0.04 : 0);
  const fade = Math.min(1, time / 0.8, (musicDuration - time) / 0.8);
  music[index] = (pad * pulse + beat) * fade;
}
writeWav(path.join(outputDirectory, 'short-video-bed.wav'), music);

let seed = 431;
const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const whooshDuration = 0.45;
const whoosh = new Float32Array(Math.floor(sampleRate * whooshDuration));
for (let index = 0; index < whoosh.length; index += 1) {
  const time = index / sampleRate;
  const noise = random() * 2 - 1;
  const sweep = Math.sin((180 + 2200 * (time / whooshDuration) ** 1.7) * Math.PI * 2 * time);
  const envelope = Math.sin(Math.PI * time / whooshDuration) ** 0.7;
  whoosh[index] = (noise * 0.16 + sweep * 0.12) * envelope;
}
writeWav(path.join(outputDirectory, 'short-video-whoosh.wav'), whoosh);
console.log('Generated procedural music and whoosh assets.');
