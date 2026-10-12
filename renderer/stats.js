// 统计模块
const Stats = {
  sessions: [],

  init() {
    this.load();
    this.render();
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('pomodoro_stats'));
      if (saved) this.sessions = saved;
    } catch (_) {
      this.sessions = [];
    }
  },

  save() {
    localStorage.setItem('pomodoro_stats', JSON.stringify(this.sessions));
  },

  // 记录一次番茄
  recordSession(durationMinutes) {
    const session = {
      date: new Date().toISOString(),
      type: 'focus',
      duration: durationMinutes,
    };
    this.sessions.push(session);
    this.save();
    this.render();
  },

  // 获取今日统计
  getToday() {
    const today = new Date().toDateString();
    return this.sessions.filter(s => new Date(s.date).toDateString() === today);
  },

  // 获取本周统计
  getThisWeek() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return this.sessions.filter(s => new Date(s.date) >= startOfWeek);
  },

  // 获取最近7天每日统计
  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const count = this.sessions.filter(s => new Date(s.date).toDateString() === dateStr).length;
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase(),
        count,
      });
    }
    return days;
  },

  // 渲染统计面板
  render() {
    const today = this.getToday().length;
    const week = this.getThisWeek().length;
    const total = this.sessions.length;
    const minutes = this.sessions.reduce((sum, s) => sum + (s.duration || 25), 0);

    const elToday = document.getElementById('statToday');
    const elWeek = document.getElementById('statWeek');
    const elTotal = document.getElementById('statTotal');
    const elMinutes = document.getElementById('statMinutes');

    if (elToday) elToday.textContent = today;
    if (elWeek) elWeek.textContent = week;
    if (elTotal) elTotal.textContent = total;
    if (elMinutes) elMinutes.textContent = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

    this._drawChart();
  },

  // 绘制像素柱状图
  _drawChart() {
    const canvas = document.getElementById('chartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const data = this.getLast7Days();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const maxVal = Math.max(...data.map(d => d.count), 1);
    const barW = 30;
    const gap = 16;
    const startX = (w - (data.length * (barW + gap) - gap)) / 2;
    const maxH = h - 24;

    data.forEach((day, i) => {
      const x = startX + i * (barW + gap);
      const barH = (day.count / maxVal) * maxH || 2;

      // 像素化柱状图 - 用小块堆叠
      const blockSize = 4;
      const blocksHigh = Math.floor(barH / blockSize);

      for (let row = 0; row < blocksHigh; row++) {
        const by = h - 16 - (row + 1) * blockSize;
        for (let bx = 0; bx < barW; bx += blockSize) {
          // 根据高度渐变颜色
          const ratio = row / (maxH / blockSize);
          const r = Math.floor(0 + ratio * 0);
          const g = Math.floor(255 * (1 - ratio * 0.5));
          const b = Math.floor(65 + ratio * (255 - 65));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(Math.floor(x + bx), Math.floor(by), blockSize - 1, blockSize - 1);
        }
      }

      // 标签
      ctx.fillStyle = '#666';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(day.label, x + barW / 2, h - 4);

      // 数值
      if (day.count > 0) {
        ctx.fillStyle = '#00ff41';
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.fillText(day.count, x + barW / 2, h - 20 - barH);
      }
    });
  },
};