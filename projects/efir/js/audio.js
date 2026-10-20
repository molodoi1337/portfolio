/* ЭФИР — звуковая сцена. Трек синтезируется в браузере:
   бочка, хлопок, хэт, бас и пэд стоят на месте, а арпеджио через HRTF-панорамирование
   летает по орбите вокруг головы. Анализатор отдаёт уровень баса в WebGL-сцену. */
(function () {
  'use strict';

  const BPM = 88, SPB = 60 / BPM / 4;
  const CHORDS = [[57, 60, 64], [53, 57, 60, 64], [48, 52, 55, 60], [55, 59, 62]]; // Am, Fmaj7, C, G
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  let ctx, master, analyser, data, reverb, panner, arpBus, noise, timer;
  let on = false, nextTime = 0, step = 0;
  const hits = []; // [время, сила] — для пульса сцены

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    // iPhone с беззвучным режимом глушит Web Audio, если не попросить «режим проигрывания»
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* старый Safari */ }
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 5; comp.attack.value = 0.005; comp.release.value = 0.2;
    const makeup = ctx.createGain();
    makeup.gain.value = 1.4;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.55;
    data = new Uint8Array(analyser.frequencyBinCount);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20;
    limiter.attack.value = 0.001; limiter.release.value = 0.1;
    master.connect(comp); comp.connect(makeup); makeup.connect(limiter); limiter.connect(analyser); analyser.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    reverb.connect(wet); wet.connect(master);

    panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2;
    arpBus = ctx.createGain();
    arpBus.connect(panner); panner.connect(master); panner.connect(reverb);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function impulse(sec) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return b;
  }

  function envGain(t, peak, attack, decay, dest) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(dest);
    return g;
  }

  function kick(t) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(170, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.1);
    o.connect(envGain(t, 0.9, 0.003, 0.34, master));
    o.start(t); o.stop(t + 0.45);
    // щелчок атаки — его слышно даже на динамиках ноутбука, где низа почти нет
    const c = ctx.createOscillator();
    c.type = 'triangle';
    c.frequency.setValueAtTime(1600, t);
    c.frequency.exponentialRampToValueAtTime(180, t + 0.03);
    c.connect(envGain(t, 0.35, 0.001, 0.04, master));
    c.start(t); c.stop(t + 0.08);
  }

  function noiseHit(t, type, freq, peak, decay, pan, toReverb) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq;
    const g = envGain(t, peak, 0.002, decay, master);
    if (toReverb) g.connect(reverb);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      s.connect(f); f.connect(p); p.connect(g);
    } else {
      s.connect(f); f.connect(g);
    }
    s.start(t); s.stop(t + decay + 0.05);
  }

  function bass(t, midi, dur) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = mtof(midi);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(380, t + dur);
    o.connect(f); f.connect(envGain(t, 0.26, 0.01, dur, master));
    o.start(t); o.stop(t + dur + 0.05);
  }

  function pad(t, notes, dur) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 0.7;
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(1100, t + dur * 0.6);
    f.frequency.linearRampToValueAtTime(600, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(1, t + 0.9);
    g.gain.setValueAtTime(1, t + dur - 0.2);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.8);
    f.connect(g); g.connect(master); g.connect(reverb);
    notes.forEach((n) => [-7, 7].forEach((cents) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(n);
      o.detune.value = cents;
      const v = ctx.createGain();
      v.gain.value = 0.05;
      o.connect(v); v.connect(f);
      o.start(t); o.stop(t + dur + 0.9);
    }));
  }

  function pluck(t, midi) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(700, t + 0.35);
    f.connect(envGain(t, 0.6, 0.004, 0.42, arpBus));
    [['triangle', 0], ['sine', 12]].forEach(([type, shift]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = mtof(midi + shift);
      o.connect(f);
      o.start(t); o.stop(t + 0.5);
    });
  }

  function playStep(s, t) {
    const st = s & 15, bar = (s >> 4) & 3, ch = CHORDS[bar];
    if (st === 0 || st === 8 || (st === 10 && bar === 3)) { kick(t); hits.push([t, 1]); }
    if (st === 4 || st === 12) { noiseHit(t, 'bandpass', 1600, 0.22, 0.18, 0, true); hits.push([t, 0.45]); }
    if (st % 4 === 2) noiseHit(t, 'highpass', 7000, 0.07, 0.05, st === 6 || st === 14 ? 0.35 : -0.35, false);
    if (st === 0) { pad(t, ch, SPB * 16); bass(t, ch[0] - 12, SPB * 6); }
    if (st === 10) bass(t, ch[0] - 12, SPB * 4);
    if (st % 2 === 0) pluck(t, ch[ARP[st / 2] % ch.length] + 12);
  }

  function setPos(param, v, now) {
    if (param) param.setTargetAtTime(v, now, 0.05);
  }

  function tick() {
    const now = ctx.currentTime;
    while (nextTime < now + 0.12) {
      playStep(step, nextTime);
      nextTime += SPB;
      step = (step + 1) % 64;
    }
    // арпеджио облетает голову примерно за 7 секунд
    const a = now * 0.85, x = Math.sin(a) * 2.2, y = Math.sin(a * 0.5) * 0.4, z = -Math.cos(a) * 2.2;
    if (panner.positionX) {
      setPos(panner.positionX, x, now); setPos(panner.positionY, y, now); setPos(panner.positionZ, z, now);
    } else {
      panner.setPosition(x, y, z);
    }
  }

  async function toggle(force) {
    if (!ctx && !init()) return false;
    const want = typeof force === 'boolean' ? force : !on;
    if (want === on) return on;
    on = want;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    if (on) {
      try { await ctx.resume(); } catch (e) { /* проверим состояние ниже */ }
      if (ctx.state !== 'running') {
        on = false;
        document.dispatchEvent(new CustomEvent('efir-audio', { detail: { on, blocked: true } }));
        return false;
      }
      nextTime = ctx.currentTime + 0.06; step = 0; hits.length = 0;
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
      clearInterval(timer);
      timer = setInterval(tick, 25);
      tick();
    } else {
      master.gain.setTargetAtTime(0, now, 0.15);
      clearInterval(timer);
      setTimeout(() => { if (!on) ctx.suspend(); }, 800);
    }
    document.dispatchEvent(new CustomEvent('efir-audio', { detail: { on } }));
    return on;
  }

  // пульс: точные удары бочки и хлопка + немного общей громкости из анализатора
  function level() {
    if (!on || !analyser) return null;
    const now = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
    while (hits.length > 1 && hits[1][0] <= now) hits.shift();
    let hit = 0;
    if (hits.length && hits[0][0] <= now) hit = hits[0][1] * Math.exp(-(now - hits[0][0]) * 7);
    analyser.getByteFrequencyData(data);
    let s = 0;
    for (let i = 0; i < 48; i++) s += data[i];
    return Math.min(1, hit * 0.85 + (s / (48 * 255)) * 0.25);
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden && on) toggle(false); });

  // громкость на выходе в dBFS — для отладки микса
  function meter() {
    if (!analyser) return null;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0, peak = 0;
    for (const v of buf) { sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    return { rms: 10 * Math.log10(sum / buf.length + 1e-12), peak: 20 * Math.log10(peak + 1e-12), state: ctx.state };
  }

  window.EfirAudio = { toggle, level, meter, isOn: () => on };
})();
