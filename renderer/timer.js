// 计时器核心逻辑
const Timer = {
  // 状态
  state: 'idle', // idle | running | paused
  sessionType: 'focus', // focus | shortBreak | longBreak
  sessionCount: 1,
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  intervalId: null,

  // 默认设置
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
  },

  // 初始化
  init() {
    this.loadSettings();
    this.reset();
    this.drawProgress();
  },

  loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('pomodoro_settings'));
      if (saved) Object.assign(this.settings, saved);
    } catch (_) {}
  },

  saveSettings() {
    localStorage.setItem('pomodoro_settings', JSON.stringify(this.settings));
  },

  // 重置为当前阶段
  reset() {
    this.stop();
    this.state = 'idle';
    this.remainingSeconds = this.getDuration();
    this.totalSeconds = this.remainingSeconds;
    this.updateDisplay();
    this.drawProgress();
  },

  // 获取当前阶段时长
  getDuration() {
    if (this.sessionType === 'focus') return this.settings.focusDuration * 60;
    if (this.sessionType === 'shortBreak') return this.settings.shortBreakDuration * 60;
    return this.settings.longBreakDuration * 60;
  },

  // 开始计时
  start() {
    if (this.state === 'running') return;
    if (this.state === 'paused') {
      Sound.start();
    }
    this.state = 'running';
    this._updateButtons();
    document.getElementById('timerText').classList.remove('paused');

    this.intervalId = setInterval(() => this._tick(), 1000);
  },

  // 暂停
  pause() {
    if (this.state !== 'running') return;
    Sound.pause();
    this.state = 'paused';
    this._stopInterval();
    this._updateButtons();
    document.getElementById('timerText').classList.add('paused');
  },

  // 切换 开始/暂停
  toggle() {
    if (this.state === 'running') this.pause();
    else this.start();
  },

  // 停止计时器
  stop() {
    this._stopInterval();
  },

  _stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // 跳过当前阶段
  skip() {
    Sound.skip();
    this._transition();
  },

  // 每秒滴答
  _tick() {
    this.remainingSeconds--;
    this.updateDisplay();
    this.drawProgress();

    if (this.remainingSeconds <= 0) {
      this._onComplete();
    }
  },

  // 计时结束
  _onComplete() {
    this._stopInterval();
    Sound.timerEnd();

    // 系统通知
    const label = this.sessionType === 'focus' ? 'Focus time is up!' : 'Break is over!';
    if (window.pomodoroAPI) {
      window.pomodoroAPI.sendNotification('Pixel Pomodoro', label);
    }

    // 记录统计
    if (this.sessionType === 'focus') {
      Stats.recordSession(this.settings.focusDuration);
      // 为当前进行中的任务累计番茄数
      if (typeof Tasks !== 'undefined' && Tasks.activeTaskId) {
        Tasks.incrementPomodoro(Tasks.activeTaskId);
      }
    }

    // 短暂延迟后切换
    setTimeout(() => this._transition(), 1500);
  },

  // 切换到下一阶段
  _transition() {
    this._stopInterval();

    if (this.sessionType === 'focus') {
      this.sessionCount++;
      if (this.sessionCount > this.settings.longBreakInterval) {
        this.sessionType = 'longBreak';
        this.sessionCount = 1;
      } else {
        this.sessionType = 'shortBreak';
      }
    } else {
      this.sessionType = 'focus';
    }

    this.state = 'idle';
    this.remainingSeconds = this.getDuration();
    this.totalSeconds = this.remainingSeconds;
    this.updateDisplay();
    this.drawProgress();
    this._updateButtons();
    this._updateSessionLabel();
    this._updateSessionCounter();
    document.getElementById('timerText').classList.remove('paused');
  },

  // 更新 UI 显示
  updateDisplay() {
    const m = Math.floor(this.remainingSeconds / 60);
    const s = this.remainingSeconds % 60;
    document.getElementById('timerText').textContent =
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // 更新托盘
    if (window.pomodoroAPI) {
      const label = this.sessionType === 'focus' ? 'FOCUS' : 'BREAK';
      window.pomodoroAPI.updateTrayTitle(`Pixel Pomodoro - ${label} ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
  },

  // 绘制像素圆环进度条
  drawProgress() {
    const canvas = document.getElementById('progressCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 80;
    const lineWidth = 12;

    ctx.clearRect(0, 0, w, h);

    const progress = this.remainingSeconds / this.totalSeconds;
    const color = this.sessionType === 'focus' ? '#00ff41' : '#00ffff';

    // 背景圆环（像素化）
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 像素化进度圆环 - 用阶梯状小段模拟像素效果
    const segments = 60;
    const activeSegments = Math.floor(progress * segments);

    for (let i = 0; i < segments; i++) {
      const startAngle = (i / segments) * Math.PI * 2 - Math.PI / 2;
      const endAngle = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2;
      const midAngle = (startAngle + endAngle) / 2;

      // 像素偏移效果
      const px = Math.round(Math.cos(midAngle) * 2) / 2;
      const py = Math.round(Math.sin(midAngle) * 2) / 2;

      ctx.strokeStyle = i < activeSegments ? color : '#1a1a2e';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(cx + px, cy + py, radius, startAngle, endAngle);
      ctx.stroke();
    }

    // 中央圆点（像素风）
    ctx.fillStyle = color;
    const dotSize = 6;
    ctx.fillRect(cx - dotSize / 2, cy - dotSize / 2, dotSize, dotSize);
  },

  // 更新按钮状态
  _updateButtons() {
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');

    if (this.state === 'running') {
      btnStart.style.display = 'none';
      btnPause.style.display = '';
    } else {
      btnStart.style.display = '';
      btnPause.style.display = 'none';
    }
  },

  // 更新阶段标签
  _updateSessionLabel() {
    const label = document.getElementById('sessionLabel');
    if (this.sessionType === 'focus') {
      label.textContent = 'FOCUS';
      label.className = 'session-label';
    } else if (this.sessionType === 'shortBreak') {
      label.textContent = 'SHORT BREAK';
      label.className = 'session-label break';
    } else {
      label.textContent = 'LONG BREAK';
      label.className = 'session-label break';
    }
  },

  _updateSessionCounter() {
    const counter = document.getElementById('sessionCounter');
    if (this.sessionType === 'focus') {
      counter.textContent = `ROUND ${this.sessionCount} / ${this.settings.longBreakInterval}`;
    } else {
      counter.textContent = '';
    }
  },
};