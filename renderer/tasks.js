// 任务管理模块
const Tasks = {
  list: [],
  activeTaskId: null,

  init() {
    this.load();
    this.render();
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('pomodoro_tasks'));
      if (saved) this.list = saved;
    } catch (_) {
      this.list = [];
    }
  },

  save() {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(this.list));
  },

  // 添加任务
  add(title) {
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      completed: false,
      pomodoros: 1,        // 预估番茄数
      pomodorosDone: 0,    // 已完成番茄数
      createdAt: new Date().toISOString(),
    };
    this.list.unshift(task);
    this.save();
    this.render();
    Sound.click();

    // 自动设为当前任务
    if (!this.activeTaskId) {
      this.setActive(task.id);
    }
  },

  // 删除任务
  remove(id) {
    this.list = this.list.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      this.activeTaskId = null;
    }
    this.save();
    this.render();
  },

  // 切换完成状态
  toggleComplete(id) {
    const task = this.list.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    if (task.completed) {
      Sound.taskComplete();
    }
    this.save();
    this.render();
  },

  // 设置当前活动任务
  setActive(id) {
    this.activeTaskId = id;
    this.render();
  },

  // 增加已完成番茄数
  incrementPomodoro(id) {
    const task = this.list.find(t => t.id === id);
    if (!task) return;
    task.pomodorosDone++;
    if (task.pomodorosDone >= task.pomodoros) {
      task.completed = true;
    }
    this.save();
    this.render();
  },

  // 渲染任务列表
  render() {
    const container = document.getElementById('taskList');
    if (!container) return;

    if (this.list.length === 0) {
      container.innerHTML = '<div class="task-empty">NO TASKS YET<br>PRESS + TO ADD</div>';
      return;
    }

    container.innerHTML = this.list.map(task => {
      const isActive = this.activeTaskId === task.id;
      const completedClass = task.completed ? 'completed' : '';
      const activeClass = isActive ? 'active-task' : '';
      const doneClass = task.completed ? 'done' : '';
      const checkMark = task.completed ? '✓' : '';

      return `
        <div class="task-item ${completedClass} ${activeClass}" data-id="${task.id}">
          <button class="task-checkbox" data-action="toggle" data-id="${task.id}">${checkMark}</button>
          <span class="task-title ${doneClass}" data-action="activate" data-id="${task.id}">${this._escape(task.title)}</span>
          <span class="task-pomos">${task.pomodorosDone}/${task.pomodoros}</span>
          <button class="task-delete" data-action="delete" data-id="${task.id}">✕</button>
        </div>
      `;
    }).join('');
  },

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};