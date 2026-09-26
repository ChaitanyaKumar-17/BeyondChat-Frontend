export const generateWaveform = (seed, bars = 32) => {
  let s = typeof seed === 'number' ? seed : 12345;
  const heights = [];
  for (let i = 0; i < bars; i++) {
    s = (s * 16807 + 7) % 2147483647;
    const base = ((s % 100) / 100) * 14 + 4; // 4-18px range
    // Add voice-like envelope: louder in middle, quieter at edges
    const envelope = 1 - Math.abs((i / bars) * 2 - 1) * 0.4;
    heights.push(Math.round(base * envelope));
  }
  return heights;
};




export const playNotificationTone = (tone = 'ping') => {
  try {
    const SR = 44100; // sample rate
    const tones = {
      ping:   { freqs: [1046, 1568], dur: 0.22, decay: 0.14, vol: 0.85 },
      chime:  { freqs: [ 784, 1174,  523], dur: 0.40, decay: 0.32, vol: 0.80 },
      pop:    { freqs: [ 440],             dur: 0.14, decay: 0.08, vol: 0.90 },
      bubble: { freqs: [1318, 1760],       dur: 0.28, decay: 0.20, vol: 0.78 },
    };
    const cfg = tones[tone] || tones.ping;
    const numSamples = Math.ceil(SR * cfg.dur);

    // Allocate WAV buffer: 44-byte header + 16-bit mono PCM
    const buf = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buf);
    const ws = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

    ws(0,  'RIFF');  view.setUint32(4,  36 + numSamples * 2, true);
    ws(8,  'WAVE');  ws(12, 'fmt ');
    view.setUint32(16, 16, true);          // chunk size
    view.setUint16(20, 1,  true);          // PCM
    view.setUint16(22, 1,  true);          // mono
    view.setUint32(24, SR, true);          // sample rate
    view.setUint32(28, SR * 2, true);      // byte rate
    view.setUint16(32, 2,  true);          // block align
    view.setUint16(34, 16, true);          // bits per sample
    ws(36, 'data');  view.setUint32(40, numSamples * 2, true);

    // Synthesise samples: sum of sine waves × exponential decay envelope
    for (let i = 0; i < numSamples; i++) {
      const t = i / SR;
      const env = Math.exp(-t / cfg.decay);
      let s = 0;
      cfg.freqs.forEach((f, idx) => {
        s += Math.sin(2 * Math.PI * f * t) * (idx === 0 ? 1 : 0.35);
      });
      s = (s / (cfg.freqs.length > 1 ? 1.35 : 1)) * env * cfg.vol;
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true);
    }

    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    const audio = new Audio(url);
    audio.volume = 1.0;
    audio.play()
      .then(() => audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true }))
      .catch(() => URL.revokeObjectURL(url));
  } catch (_) {}
};


// ???? DND window check ?????????????????????????????????????????????????????????
