class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    if (this.speechSynth) {
      this.loadVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  loadVoices() {
    if (!this.speechSynth) return;
    this.voices = this.speechSynth.getVoices();
  }

  // 1. Supermarket Barcode Scanner Beep (Web Audio API)
  playScannerBeep() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2350, ctx.currentTime); // Standard supermarket scanner tone
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); // 80ms sharp chirp

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Scanner beep audio error:", e);
    }
  }

  // 2. Error / Alert Tone
  playErrorBuzz() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Error audio error:", e);
    }
  }

  // 3. Cash Register Drawer Ding ("Cha-Ching")
  playCashDrawerDing() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Dual resonant bell tones
      [1200, 1600, 2400].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.04));

        gain.gain.setValueAtTime(0.2, now + (idx * 0.04));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.04) + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (idx * 0.04));
        osc.stop(now + (idx * 0.04) + 0.6);
      });
    } catch (e) {
      console.warn("Cash drawer ding error:", e);
    }
  }

  // 4. Soundbox Payment Success Jingle (Modern Fintech Chime)
  playSoundboxJingle() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (index * 0.09));

        gain.gain.setValueAtTime(0.25, now + (index * 0.09));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.09) + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (index * 0.09));
        osc.stop(now + (index * 0.09) + 0.4);
      });
    } catch (e) {
      console.warn("Soundbox jingle error:", e);
    }
  }

  // 5. Thermal Printer Stepper Motor Ratchet
  playPrinterRollSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const totalPulses = 12;
      const stepInterval = 0.06;
      const now = ctx.currentTime;

      for (let i = 0; i < totalPulses; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800 + (Math.random() * 200), now + (i * stepInterval));

        gain.gain.setValueAtTime(0.08, now + (i * stepInterval));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * stepInterval) + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (i * stepInterval));
        osc.stop(now + (i * stepInterval) + 0.035);
      }
    } catch (e) {
      console.warn("Printer roll sound error:", e);
    }
  }

  // 6. AI Voice Synthesis (Web Speech API)
  speak(text, onEnd) {
    if (!this.speechSynth) return;

    try {
      this.speechSynth.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      // Select an Indian English or natural voice if available
      const voices = this.speechSynth.getVoices();
      const preferredVoice = voices.find(v => 
        (v.lang && (v.lang.includes('en-IN') || v.lang.includes('hi-IN'))) ||
        (v.name && (v.name.includes('India') || v.name.includes('Rishi') || v.name.includes('Veena') || v.name.includes('Google हिन्दी')))
      ) || voices.find(v => v.lang && v.lang.startsWith('en')) || voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
      }

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  // Soundbox payment voice announcement
  announcePaymentSuccess(amount, mode = "UPI") {
    const formattedAmount = Math.round(amount).toLocaleString('en-IN');
    const announcement = `Payment of Rupees ${formattedAmount} received successfully on ${mode}. Thank you for shopping with us!`;
    
    // First play the modern soundbox jingle, then announce via voice
    this.playSoundboxJingle();
    setTimeout(() => {
      this.speak(announcement);
    }, 450);
  }
}

export const soundEngine = new SoundEngine();
