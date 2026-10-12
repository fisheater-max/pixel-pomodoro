// 8-bit 音效引擎 - 使用 Web Audio API 生成复古游戏音效
const Sound = {
  ctx: null,

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  // 确保 AudioContext 被激活
  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  // 方波 - 经典 8-bit 音色
  _square(freq, duration, volume = 0.15) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  },

  // 计时结束音效 - 上升音阶 + 庆祝
  timerEnd() {
    this.ensureContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this._square(freq, 0.2, 0.12), i * 100);
    });
    // 最后的胜利音
    setTimeout(() => {
      this._square(1047, 0.15, 0.12);
      setTimeout(() => this._square(1319, 0.3, 0.12), 150);
    }, 450);
  },

  // 开始音效 - 短促提示
  start() {
    this.ensureContext();
    this._square(880, 0.08, 0.08);
  },

  // 暂停音效 - 下降音
  pause() {
    this.ensureContext();
    this._square(440, 0.08, 0.08);
    setTimeout(() => this._square(330, 0.1, 0.08), 80);
  },

  // 点击音效
  click() {
    this.ensureContext();
    this._square(660, 0.04, 0.05);
  },

  // 完成任务音效
  taskComplete() {
    this.ensureContext();
    this._square(784, 0.08, 0.08);
    setTimeout(() => this._square(988, 0.12, 0.08), 80);
  },

  // 跳过音效
  skip() {
    this.ensureContext();
    this._square(330, 0.06, 0.06);
    setTimeout(() => this._square(262, 0.08, 0.06), 60);
  },
};