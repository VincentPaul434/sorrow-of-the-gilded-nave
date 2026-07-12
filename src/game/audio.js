const SILENCE = 0.0001;
const AMBIENCE_LEVEL = 0.22;

const PAD_CHORDS = [
  [110, 130.81, 164.81],
  [87.31, 110, 130.81],
  [73.42, 87.31, 110],
  [82.41, 116.54, 164.81],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);

export class NaveAudio {
  constructor(scene) {
    this.scene = scene;
    this.context = null;
    this.ready = false;
    this.ambientSources = [];
    this.graphNodes = [];
    this.padIndex = 0;
    this.lastImpactAt = -1;
    this.bossSources = [];
    this.bossNodes = [];
  }

  start() {
    const context = this.scene.sound?.context;
    const destination = this.scene.sound?.destination;
    if (!context || !destination || context.state === "closed") return false;

    if (this.ready && this.context === context) {
      this.resume();
      return true;
    }

    try {
      this.context = context;
      this.createBuffers();
      this.createMix(destination);
      this.ready = true;
      this.startAmbience();
      this.resume();
      return true;
    } catch (_error) {
      this.stop();
      return false;
    }
  }

  resume() {
    if (!this.context || this.context.state === "running" || this.context.state === "closed") return;
    this.context.resume().catch(() => {});
  }

  stop() {
    if (!this.context) return;
    const now = this.context.currentTime;

    this.padTimer?.remove(false);
    this.bellTimer?.remove(false);
    this.bossPulseTimer?.remove(false);

    if (this.masterBus) {
      this.masterBus.gain.cancelScheduledValues(now);
      this.masterBus.gain.setValueAtTime(Math.max(SILENCE, this.masterBus.gain.value), now);
      this.masterBus.gain.exponentialRampToValueAtTime(SILENCE, now + 0.04);
    }

    [...this.ambientSources, ...this.bossSources].forEach((source) => {
      try {
        source.stop(now + 0.05);
      } catch (_error) {
        // The source may already have ended.
      }
    });

    const nodes = [...this.graphNodes, ...this.bossNodes];
    globalThis.setTimeout(() => {
      nodes.filter(Boolean).forEach((node) => {
        try {
          node.disconnect();
        } catch (_error) {
          // Disconnection is idempotent for this cleanup path.
        }
      });
    }, 80);

    this.ready = false;
    this.context = null;
    this.ambientSources = [];
    this.graphNodes = [];
    this.bossSources = [];
    this.bossNodes = [];
    this.padTimer = null;
    this.bellTimer = null;
    this.bossPulseTimer = null;
    this.bossActive = false;
  }

  createBuffers() {
    const sampleRate = this.context.sampleRate;
    const noiseLength = Math.floor(sampleRate * 4);
    this.noiseBuffer = this.context.createBuffer(1, noiseLength, sampleRate);
    const noise = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i += 1) noise[i] = Math.random() * 2 - 1;

    const impulseLength = Math.floor(sampleRate * 2.8);
    this.impulseBuffer = this.context.createBuffer(2, impulseLength, sampleRate);
    const taps = [[0.031, 0.55], [0.047, 0.38], [0.073, 0.27], [0.109, 0.16]];
    for (let channel = 0; channel < 2; channel += 1) {
      const data = this.impulseBuffer.getChannelData(channel);
      for (let i = 0; i < impulseLength; i += 1) {
        const time = i / sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-2.5 * time) * 0.25;
      }
      taps.forEach(([time, strength]) => {
        const index = Math.floor(time * sampleRate);
        if (index < data.length) data[index] += strength * (channel === 0 ? 1 : 0.92);
      });
    }
  }

  createMix(destination) {
    const context = this.context;
    this.masterBus = context.createGain();
    this.masterBus.gain.value = 0.72;

    this.compressor = context.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.18;

    this.ambienceBus = context.createGain();
    this.ambienceBus.gain.value = AMBIENCE_LEVEL;
    this.sfxBus = context.createGain();
    this.sfxBus.gain.value = 0.64;
    this.legacyBus = context.createGain();
    this.legacyBus.gain.value = 0.16;

    this.reverbInput = context.createGain();
    this.preDelay = context.createDelay(0.1);
    this.preDelay.delayTime.value = 0.026;
    this.convolver = context.createConvolver();
    this.convolver.buffer = this.impulseBuffer;
    this.wetHighpass = context.createBiquadFilter();
    this.wetHighpass.type = "highpass";
    this.wetHighpass.frequency.value = 120;
    this.wetLowpass = context.createBiquadFilter();
    this.wetLowpass.type = "lowpass";
    this.wetLowpass.frequency.value = 4200;
    this.wetBus = context.createGain();
    this.wetBus.gain.value = 0.19;

    this.ambienceBus.connect(this.masterBus);
    this.sfxBus.connect(this.masterBus);
    this.legacyBus.connect(this.sfxBus);
    this.reverbInput.connect(this.preDelay);
    this.preDelay.connect(this.convolver);
    this.convolver.connect(this.wetHighpass);
    this.wetHighpass.connect(this.wetLowpass);
    this.wetLowpass.connect(this.wetBus);
    this.wetBus.connect(this.masterBus);
    this.masterBus.connect(this.compressor);
    this.compressor.connect(destination);

    this.graphNodes.push(
      this.masterBus,
      this.compressor,
      this.ambienceBus,
      this.sfxBus,
      this.legacyBus,
      this.reverbInput,
      this.preDelay,
      this.convolver,
      this.wetHighpass,
      this.wetLowpass,
      this.wetBus,
    );
  }

  startAmbience() {
    const context = this.context;
    const now = context.currentTime;
    const droneFilter = context.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 410;
    droneFilter.Q.value = 0.5;
    const droneOutput = this.connectOutput(droneFilter, this.ambienceBus, 0.32, 0);

    [
      { frequency: 55, detune: -3, gain: 0.07, type: "sine" },
      { frequency: 55, detune: 3, gain: 0.07, type: "sine" },
      { frequency: 82.41, detune: -2, gain: 0.035, type: "triangle" },
      { frequency: 110, detune: 2, gain: 0.02, type: "sine" },
    ].forEach((voice) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.value = voice.frequency;
      oscillator.detune.value = voice.detune;
      gain.gain.setValueAtTime(SILENCE, now);
      gain.gain.exponentialRampToValueAtTime(voice.gain, now + 2.4);
      oscillator.connect(gain).connect(droneFilter);
      oscillator.start(now);
      this.ambientSources.push(oscillator);
      this.graphNodes.push(gain);
    });

    const filterLfo = context.createOscillator();
    const filterDepth = context.createGain();
    filterLfo.frequency.value = 0.029;
    filterDepth.gain.value = 100;
    filterLfo.connect(filterDepth).connect(droneFilter.frequency);
    filterLfo.start(now);
    this.ambientSources.push(filterLfo);

    const ambienceLfo = context.createOscillator();
    const ambienceDepth = context.createGain();
    ambienceLfo.frequency.value = 0.021;
    ambienceDepth.gain.value = 0.012;
    ambienceLfo.connect(ambienceDepth).connect(this.ambienceBus.gain);
    ambienceLfo.start(now);
    this.ambientSources.push(ambienceLfo);

    const air = context.createBufferSource();
    const airHighpass = context.createBiquadFilter();
    const airLowpass = context.createBiquadFilter();
    const airGain = context.createGain();
    air.buffer = this.noiseBuffer;
    air.loop = true;
    airHighpass.type = "highpass";
    airHighpass.frequency.value = 70;
    airLowpass.type = "lowpass";
    airLowpass.frequency.value = 900;
    airGain.gain.setValueAtTime(SILENCE, now);
    airGain.gain.exponentialRampToValueAtTime(0.018, now + 3);
    air.connect(airHighpass).connect(airLowpass).connect(airGain);

    let airOutput = airGain;
    let airPanner = null;
    if (context.createStereoPanner) {
      airPanner = context.createStereoPanner();
      airGain.connect(airPanner);
      airOutput = airPanner;
    }
    airOutput.connect(this.ambienceBus);
    const airSend = context.createGain();
    airSend.gain.value = 0.22;
    airOutput.connect(airSend).connect(this.reverbInput);
    air.start(now);
    this.ambientSources.push(air);

    const airGainLfo = context.createOscillator();
    const airGainDepth = context.createGain();
    airGainLfo.frequency.value = 0.061;
    airGainDepth.gain.value = 0.006;
    airGainLfo.connect(airGainDepth).connect(airGain.gain);
    airGainLfo.start(now);
    this.ambientSources.push(airGainLfo);

    if (airPanner) {
      const panLfo = context.createOscillator();
      const panDepth = context.createGain();
      panLfo.frequency.value = 0.017;
      panDepth.gain.value = 0.22;
      panLfo.connect(panDepth).connect(airPanner.pan);
      panLfo.start(now);
      this.ambientSources.push(panLfo);
      this.graphNodes.push(panDepth);
    }

    this.graphNodes.push(
      droneFilter,
      ...droneOutput,
      filterDepth,
      ambienceDepth,
      airHighpass,
      airLowpass,
      airGain,
      airPanner,
      airSend,
      airGainDepth,
    );

    this.playPad(PAD_CHORDS[0]);
    this.padIndex = 1;
    this.padTimer = this.scene.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => {
        if (!this.ready) return;
        this.playPad(PAD_CHORDS[this.padIndex]);
        this.padIndex = (this.padIndex + 1) % PAD_CHORDS.length;
      },
    });
    this.scheduleBell(true);
  }

  playPad(chord) {
    if (!this.canPlay()) return;
    const context = this.context;
    const start = context.currentTime + 0.04;
    const duration = 14;
    const padFilter = context.createBiquadFilter();
    const padEnvelope = context.createGain();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 850;
    padFilter.Q.value = 0.45;
    padEnvelope.gain.setValueAtTime(SILENCE, start);
    padEnvelope.gain.exponentialRampToValueAtTime(1, start + 3);
    padEnvelope.gain.setValueAtTime(1, start + 9);
    padEnvelope.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
    padFilter.connect(padEnvelope);
    const outputNodes = this.connectOutput(padEnvelope, this.ambienceBus, 0.45, randomBetween(-0.12, 0.12));

    const sources = [];
    const nodes = [padFilter, padEnvelope, ...outputNodes];
    const levels = [0.026, 0.018, 0.012];
    chord.forEach((frequency, noteIndex) => {
      [
        { type: "sine", detune: -4, mix: 0.75 },
        { type: "triangle", detune: 4, mix: 0.25 },
      ].forEach((layer) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = layer.type;
        oscillator.frequency.value = frequency;
        oscillator.detune.value = layer.detune;
        gain.gain.value = levels[noteIndex] * layer.mix;
        oscillator.connect(gain).connect(padFilter);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.04);
        sources.push(oscillator);
        nodes.push(gain);
      });
    });
    this.cleanupGroup(sources, nodes);
  }

  scheduleBell(first = false) {
    const delay = first ? randomBetween(7000, 12000) : randomBetween(18000, 32000);
    this.bellTimer = this.scene.time.delayedCall(delay, () => {
      if (!this.ready) return;
      this.playDistantBell();
      this.scheduleBell(false);
    });
  }

  playDistantBell() {
    if (!this.canPlay()) return;
    const fundamental = [220, 261.63, 329.63][Math.floor(Math.random() * 3)];
    const pan = randomBetween(-0.4, 0.4);
    [
      [1, 0.055, 5.5],
      [2.01, 0.025, 4.2],
      [2.67, 0.014, 2.8],
      [4.12, 0.008, 1.8],
    ].forEach(([ratio, gain, duration]) => {
      this.oscBurst({
        type: "sine",
        frequencyPoints: [[0, fundamental * ratio], [duration, fundamental * ratio * 0.992]],
        duration,
        peak: gain,
        peakAt: 0.012,
        pan,
        wet: 0.7,
        bus: this.ambienceBus,
      });
    });
  }

  slash(direction = 1, serial = 0) {
    if (!this.canPlay()) return;
    const now = this.context.currentTime;
    const pan = direction * 0.12;
    const pitch = randomBetween(0.97, 1.03);
    const edgeStart = (serial % 2 === 0 ? 1450 : 1620) * pitch;

    this.noiseBurst({
      start: now,
      duration: 0.11,
      peak: 0.065,
      peakAt: 0.008,
      pan,
      wet: 0.04,
      filters: [{ type: "lowpass", frequencyPoints: [[0, 720], [0.11, 430]], q: 0.5 }],
    });
    this.noiseBurst({
      start: now + 0.06,
      duration: 0.29,
      peak: 0.31,
      peakAt: 0.14,
      pan,
      wet: 0.1,
      filters: [
        { type: "highpass", frequencyPoints: [[0, 180]], q: 0.4 },
        { type: "bandpass", frequencyPoints: [[0, 380], [0.14, 3400], [0.29, 1300]], q: 0.7 },
      ],
    });
    this.oscBurst({
      start: now + 0.12,
      type: "triangle",
      frequencyPoints: [[0, edgeStart], [0.18, 760 * pitch]],
      duration: 0.18,
      peak: 0.04,
      peakAt: 0.045,
      pan,
      wet: 0.16,
      filters: [{ type: "lowpass", frequencyPoints: [[0, 3200]], q: 0.45 }],
    });
    this.oscBurst({
      start: now + 0.13,
      type: "sine",
      frequencyPoints: [[0, 128 * pitch], [0.14, 70 * pitch]],
      duration: 0.14,
      peak: 0.075,
      peakAt: 0.015,
      pan,
      wet: 0.03,
    });
  }

  guardRaise(direction = 1) {
    if (!this.canPlay()) return;
    const now = this.context.currentTime;
    const pan = direction * 0.08;
    this.noiseBurst({
      start: now,
      duration: 0.09,
      peak: 0.07,
      peakAt: 0.012,
      pan,
      wet: 0.08,
      filters: [{ type: "bandpass", frequencyPoints: [[0, 1100], [0.09, 2400]], q: 1.8 }],
    });
    this.oscBurst({
      start: now,
      type: "triangle",
      frequencyPoints: [[0, 420], [0.09, 560]],
      duration: 0.09,
      peak: 0.026,
      peakAt: 0.008,
      pan,
      wet: 0.08,
    });
  }

  parrySuccess(kind = "melee") {
    if (!this.canPlay()) return;
    const now = this.context.currentTime;
    const fundamental = kind === "projectile" ? 820 : 680;
    this.noiseBurst({
      start: now,
      duration: 0.025,
      peak: 0.24,
      peakAt: 0.004,
      wet: 0.22,
      filters: [
        { type: "highpass", frequencyPoints: [[0, 2800]], q: 0.4 },
        { type: "lowpass", frequencyPoints: [[0, 10000]], q: 0.4 },
      ],
    });
    [
      [1, 0.14, 0.42],
      [1.48, 0.08, 0.3],
      [2.12, 0.045, 0.22],
      [2.91, 0.025, 0.14],
    ].forEach(([ratio, gain, duration]) => {
      this.oscBurst({
        start: now,
        type: "sine",
        frequencyPoints: [[0, fundamental * ratio], [duration, fundamental * ratio * 0.985]],
        duration,
        peak: gain,
        peakAt: 0.004,
        wet: 0.38,
      });
    });
    this.oscBurst({
      start: now,
      type: "sine",
      frequencyPoints: [[0, 148], [0.11, 96]],
      duration: 0.11,
      peak: 0.08,
      peakAt: 0.006,
      wet: 0.08,
    });
    this.duckAmbience(0.12, 0.26);
  }

  weaponHit(kind = "mourner") {
    if (!this.canPlay()) return;
    const now = this.context.currentTime;
    const stackScale = this.lastImpactAt >= 0 && now - this.lastImpactAt < 0.045 ? 0.55 : 1;
    this.lastImpactAt = now;
    const armored = kind === "boss";
    const metallic = kind === "censer";

    this.noiseBurst({
      start: now,
      duration: 0.025,
      peak: 0.22 * stackScale,
      peakAt: 0.003,
      wet: armored ? 0.2 : 0.08,
      filters: [
        { type: "highpass", frequencyPoints: [[0, 2000]], q: 0.4 },
        { type: "lowpass", frequencyPoints: [[0, 8000]], q: 0.4 },
      ],
    });
    this.noiseBurst({
      start: now,
      duration: 0.13,
      peak: 0.24 * stackScale,
      peakAt: 0.005,
      wet: 0.08,
      filters: [{ type: "bandpass", frequencyPoints: [[0, armored ? 210 : 260], [0.13, 150]], q: 0.8 }],
    });
    this.oscBurst({
      start: now,
      type: "sine",
      frequencyPoints: [[0, armored ? 82 : 105], [0.17, armored ? 43 : 55]],
      duration: 0.17,
      peak: (armored ? 0.18 : 0.14) * stackScale,
      peakAt: 0.004,
      wet: 0.05,
    });

    const partials = metallic
      ? [[570, 0.06, 0.24], [832, 0.035, 0.18], [1214, 0.02, 0.12]]
      : armored
        ? [[430, 0.055, 0.24], [690, 0.035, 0.16], [1160, 0.018, 0.1]]
        : [[480, 0.025, 0.1]];
    partials.forEach(([frequency, gain, duration]) => {
      this.oscBurst({
        start: now,
        type: "triangle",
        frequencyPoints: [[0, frequency], [duration, frequency * 0.96]],
        duration,
        peak: gain * stackScale,
        peakAt: 0.004,
        wet: armored || metallic ? 0.2 : 0.08,
      });
    });
  }

  enemyWindup(kind, worldX) {
    if (!this.canPlay()) return;
    const { pan, level } = this.spatial(worldX);
    const low = kind === "boss" ? 72 : 92;
    const now = this.context.currentTime;
    this.noiseBurst({
      start: now,
      duration: 0.18,
      peak: 0.1 * level,
      peakAt: 0.018,
      pan,
      wet: 0.14,
      filters: [{ type: "bandpass", frequencyPoints: [[0, 260], [0.18, 620]], q: 1 }],
    });
    this.oscBurst({
      start: now,
      type: "triangle",
      frequencyPoints: [[0, low], [0.15, low * 1.28]],
      duration: 0.15,
      peak: 0.045 * level,
      peakAt: 0.012,
      pan,
      wet: 0.1,
    });
  }

  projectileLaunch(kind, worldX, shotIndex = 0) {
    if (!this.canPlay()) return;
    const { pan, level } = this.spatial(worldX);
    const bossScale = kind === "boss" ? 0.75 : 1;
    const shotPitch = shotIndex > 0 ? 1.18 : 1;
    const now = this.context.currentTime;
    this.noiseBurst({
      start: now,
      duration: 0.18,
      peak: 0.12 * level * (kind === "boss" ? 1.2 : 1),
      peakAt: 0.012,
      pan,
      wet: 0.16,
      filters: [{ type: "bandpass", frequencyPoints: [[0, 260], [0.18, 1300]], q: 1.2 }],
    });
    this.oscBurst({
      start: now,
      type: "sawtooth",
      frequencyPoints: [[0, 140 * bossScale * shotPitch], [0.18, 82 * bossScale * shotPitch]],
      duration: 0.18,
      peak: 0.06 * level,
      peakAt: 0.008,
      pan,
      wet: 0.12,
      filters: [{ type: "lowpass", frequencyPoints: [[0, 900], [0.18, 520]], q: 0.6 }],
    });
  }

  playerHurt(amount = 1) {
    if (!this.canPlay()) return;
    const scale = amount > 1 ? 1.15 : 1;
    const now = this.context.currentTime;
    this.noiseBurst({
      start: now,
      duration: 0.18,
      peak: 0.24 * scale,
      peakAt: 0.005,
      wet: 0.06,
      filters: [{ type: "bandpass", frequencyPoints: [[0, 190], [0.18, 115]], q: 0.7 }],
    });
    this.noiseBurst({
      start: now,
      duration: 0.025,
      peak: 0.1,
      peakAt: 0.003,
      wet: 0.04,
      filters: [{ type: "highpass", frequencyPoints: [[0, 2000]], q: 0.4 }],
    });
    this.oscBurst({
      start: now,
      type: "triangle",
      frequencyPoints: [[0, 92], [0.2, 42]],
      duration: 0.2,
      peak: 0.14 * scale,
      peakAt: 0.005,
      wet: 0.04,
    });
    this.duckAmbience(0.17, 0.18);
  }

  setBossActive(active) {
    if (!this.canPlay()) return;
    if (active === this.bossActive) return;
    this.bossActive = active;
    const context = this.context;
    const now = context.currentTime;

    if (active) {
      this.bossMix = context.createGain();
      this.bossMix.gain.setValueAtTime(SILENCE, now);
      this.bossMix.gain.exponentialRampToValueAtTime(1, now + 1.5);
      const outputNodes = this.connectOutput(this.bossMix, this.ambienceBus, 0.38, 0);
      this.bossNodes = [this.bossMix, ...outputNodes];
      [[58.27, 0.06], [116.54, 0.025]].forEach(([frequency, level]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.value = level;
        oscillator.connect(gain).connect(this.bossMix);
        oscillator.start(now);
        this.bossSources.push(oscillator);
        this.bossNodes.push(gain);
      });
      this.bossPulseTimer = this.scene.time.addEvent({
        delay: 1070,
        loop: true,
        callback: () => this.playBossPulse(),
      });
      this.playBossPulse();
      return;
    }

    this.bossPulseTimer?.remove(false);
    this.bossPulseTimer = null;
    if (this.bossMix) {
      this.bossMix.gain.cancelScheduledValues(now);
      this.bossMix.gain.setValueAtTime(Math.max(SILENCE, this.bossMix.gain.value), now);
      this.bossMix.gain.exponentialRampToValueAtTime(SILENCE, now + 1.2);
    }
    this.bossSources.forEach((source) => {
      try {
        source.stop(now + 1.25);
      } catch (_error) {
        // The layer may already be stopping.
      }
    });
    this.bossSources = [];
    const staleBossNodes = [...this.bossNodes];
    globalThis.setTimeout(() => {
      staleBossNodes.filter(Boolean).forEach((node) => {
        try {
          node.disconnect();
        } catch (_error) {
          // Already disconnected.
        }
      });
    }, 1300);
    this.bossNodes = [];
  }

  playBossPulse() {
    if (!this.canPlay() || !this.bossActive) return;
    this.oscBurst({
      type: "sine",
      frequencyPoints: [[0, 55], [0.32, 42]],
      duration: 0.32,
      peak: 0.08,
      peakAt: 0.012,
      wet: 0.2,
      bus: this.ambienceBus,
    });
  }

  tone(frequency, duration = 0.08, volume = 0.2, type = "sine") {
    if (!this.canPlay()) return;
    this.oscBurst({
      type,
      frequencyPoints: [[0, frequency], [duration, Math.max(35, frequency * 0.7)]],
      duration,
      peak: volume,
      peakAt: Math.min(0.008, duration * 0.2),
      wet: 0.08,
      bus: this.legacyBus,
    });
  }

  duckAmbience(level, duration) {
    if (!this.ambienceBus) return;
    const now = this.context.currentTime;
    const gain = this.ambienceBus.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(SILENCE, gain.value), now);
    gain.linearRampToValueAtTime(level, now + 0.008);
    gain.exponentialRampToValueAtTime(AMBIENCE_LEVEL, now + duration);
  }

  spatial(worldX) {
    const camera = this.scene.cameras.main;
    const centerX = camera.scrollX + camera.width / 2;
    const delta = worldX - centerX;
    return {
      pan: clamp(delta / 640, -0.75, 0.75),
      level: clamp(1 - Math.abs(delta) / 1400, 0.25, 1),
    };
  }

  canPlay() {
    if (!this.ready || !this.context || this.context.state === "closed") return false;
    this.resume();
    return true;
  }

  connectOutput(node, bus, wet = 0, pan = 0) {
    const nodes = [];
    let output = node;
    if (this.context.createStereoPanner) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = clamp(pan, -1, 1);
      node.connect(panner);
      output = panner;
      nodes.push(panner);
    }
    output.connect(bus);
    if (wet > 0) {
      const send = this.context.createGain();
      send.gain.value = wet;
      output.connect(send).connect(this.reverbInput);
      nodes.push(send);
    }
    return nodes;
  }

  createFilters(configs, start) {
    return configs.map((config) => {
      const filter = this.context.createBiquadFilter();
      filter.type = config.type;
      filter.Q.value = config.q ?? 0.7;
      this.scheduleFrequency(filter.frequency, config.frequencyPoints, start);
      return filter;
    });
  }

  scheduleFrequency(param, points, start) {
    const safePoints = points?.length ? points : [[0, 440]];
    param.setValueAtTime(Math.max(10, safePoints[0][1]), start + safePoints[0][0]);
    for (let i = 1; i < safePoints.length; i += 1) {
      param.exponentialRampToValueAtTime(Math.max(10, safePoints[i][1]), start + safePoints[i][0]);
    }
  }

  noiseBurst({
    start = this.context.currentTime,
    duration,
    peak,
    peakAt = 0.006,
    pan = 0,
    wet = 0,
    bus = this.sfxBus,
    filters = [],
  }) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filterNodes = this.createFilters(filters, start);
    source.buffer = this.noiseBuffer;
    let node = source;
    filterNodes.forEach((filter) => {
      node.connect(filter);
      node = filter;
    });
    node.connect(gain);
    gain.gain.setValueAtTime(SILENCE, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, peak), start + peakAt);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
    const outputNodes = this.connectOutput(gain, bus, wet, pan);
    const maxOffset = Math.max(0, this.noiseBuffer.duration - duration - 0.05);
    source.start(start, randomBetween(0, maxOffset), duration + 0.02);
    this.cleanupSource(source, [...filterNodes, gain, ...outputNodes]);
  }

  oscBurst({
    start = this.context.currentTime,
    type = "sine",
    frequencyPoints,
    duration,
    peak,
    peakAt = 0.006,
    pan = 0,
    wet = 0,
    bus = this.sfxBus,
    filters = [],
  }) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filterNodes = this.createFilters(filters, start);
    oscillator.type = type;
    this.scheduleFrequency(oscillator.frequency, frequencyPoints, start);
    let node = oscillator;
    filterNodes.forEach((filter) => {
      node.connect(filter);
      node = filter;
    });
    node.connect(gain);
    gain.gain.setValueAtTime(SILENCE, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, peak), start + peakAt);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
    const outputNodes = this.connectOutput(gain, bus, wet, pan);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    this.cleanupSource(oscillator, [...filterNodes, gain, ...outputNodes]);
  }

  cleanupSource(source, nodes) {
    source.onended = () => {
      try {
        source.disconnect();
      } catch (_error) {
        // Already disconnected.
      }
      nodes.filter(Boolean).forEach((node) => {
        try {
          node.disconnect();
        } catch (_error) {
          // Already disconnected.
        }
      });
    };
  }

  cleanupGroup(sources, nodes) {
    let remaining = sources.length;
    sources.forEach((source) => {
      source.onended = () => {
        try {
          source.disconnect();
        } catch (_error) {
          // Already disconnected.
        }
        remaining -= 1;
        if (remaining > 0) return;
        nodes.filter(Boolean).forEach((node) => {
          try {
            node.disconnect();
          } catch (_error) {
            // Already disconnected.
          }
        });
      };
    });
  }
}
