// 应用入口 - 整合所有模块
(function () {
  'use strict';

  // === 初始化 ===
  function init() {
    Sound.init();
    Timer.init();
    Tasks.init();
    Stats.init();
    bindEvents();
    Timer._updateSessionLabel();
    Timer._updateSessionCounter();
    Timer._updateButtons();
    loadSettingsIntoInputs();
  }

  // 将已保存的设置回填到设置面板输入框
  function loadSettingsIntoInputs() {
    const s = Timer.settings;
    document.getElementById('setFocus').value = s.focusDuration;
    document.getElementById('setShortBreak').value = s.shortBreakDuration;
    document.getElementById('setLongBreak').value = s.longBreakDuration;
    document.getElementById('setLongInterval').value = s.longBreakInterval;
  }

  // === 事件绑定 ===
  function bindEvents() {
    // 计时器控制
    document.getElementById('btnStart').addEventListener('click', () => {
      Timer.start();
    });

    document.getElementById('btnPause').addEventListener('click', () => {
      Timer.pause();
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      Timer.reset();
      Timer._updateSessionLabel();
      Timer._updateSessionCounter();
    });

    document.getElementById('btnSkip').addEventListener('click', () => {
      Timer.skip();
    });

    // 窗口控制
    document.getElementById('btnMinimize').addEventListener('click', () => {
      if (window.pomodoroAPI) window.pomodoroAPI.minimizeWindow();
    });

    document.getElementById('btnClose').addEventListener('click', () => {
      if (window.pomodoroAPI) window.pomodoroAPI.closeWindow();
    });

    // 标签切换
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = 'panel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
        document.getElementById(panelId).classList.add('active');

        // 切换到统计时刷新
        if (tab.dataset.tab === 'stats') {
          Stats.render();
        }
      });
    });

    // 任务操作 - 事件委托
    document.getElementById('taskList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'toggle') {
        Tasks.toggleComplete(id);
      } else if (action === 'delete') {
        Tasks.remove(id);
      } else if (action === 'activate') {
        Tasks.setActive(id);
      }
    });

    // 添加任务
    const taskInput = document.getElementById('taskInput');
    document.getElementById('btnAddTask').addEventListener('click', () => {
      const title = taskInput.value.trim();
      if (title) {
        Tasks.add(title);
        taskInput.value = '';
      }
    });

    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const title = taskInput.value.trim();
        if (title) {
          Tasks.add(title);
          taskInput.value = '';
        }
      }
    });

    // 保存设置
    document.getElementById('btnSaveSettings').addEventListener('click', () => {
      const focus = parseInt(document.getElementById('setFocus').value) || 25;
      const shortBreak = parseInt(document.getElementById('setShortBreak').value) || 5;
      const longBreak = parseInt(document.getElementById('setLongBreak').value) || 15;
      const longInterval = parseInt(document.getElementById('setLongInterval').value) || 4;

      Timer.settings.focusDuration = Math.max(1, Math.min(60, focus));
      Timer.settings.shortBreakDuration = Math.max(1, Math.min(30, shortBreak));
      Timer.settings.longBreakDuration = Math.max(1, Math.min(60, longBreak));
      Timer.settings.longBreakInterval = Math.max(1, Math.min(10, longInterval));
      Timer.saveSettings();
      Timer.reset();
      Timer._updateSessionLabel();
      Timer._updateSessionCounter();

      // 更新设置输入框
      document.getElementById('setFocus').value = Timer.settings.focusDuration;
      document.getElementById('setShortBreak').value = Timer.settings.shortBreakDuration;
      document.getElementById('setLongBreak').value = Timer.settings.longBreakDuration;
      document.getElementById('setLongInterval').value = Timer.settings.longBreakInterval;

      // 短暂闪烁保存按钮
      const btn = document.getElementById('btnSaveSettings');
      btn.textContent = 'SAVED!';
      btn.style.color = '#00ff41';
      btn.style.borderColor = '#00ff41';
      setTimeout(() => {
        btn.textContent = 'SAVE SETTINGS';
        btn.style.color = '';
        btn.style.borderColor = '';
      }, 1000);
    });

    // 托盘事件
    if (window.pomodoroAPI) {
      window.pomodoroAPI.onTrayToggle(() => {
        Timer.toggle();
      });
      window.pomodoroAPI.onTraySkip(() => {
        Timer.skip();
      });
    }

    // 快捷键
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return; // 不在输入框中响应
      if (e.code === 'Space') {
        e.preventDefault();
        Timer.toggle();
      } else if (e.code === 'KeyS' && e.ctrlKey) {
        e.preventDefault();
        Timer.skip();
      } else if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        Timer.reset();
        Timer._updateSessionLabel();
        Timer._updateSessionCounter();
      }
    });

    // 标题栏拖动
    let dragging = false;
    let dragStartX, dragStartY;

    document.getElementById('titleBar').addEventListener('mousedown', (e) => {
      if (e.target.closest('.title-btn')) return;
      dragging = true;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.screenX - dragStartX;
      const dy = e.screenY - dragStartY;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
      window.moveBy(dx, dy);
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  }

  // === 启动 ===
  document.addEventListener('DOMContentLoaded', init);
})();