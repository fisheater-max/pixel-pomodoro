const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 关闭窗口时隐藏到托盘而不是退出
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // 创建 16x16 像素托盘图标
  const icon = nativeImage.createEmpty();
  // 用简单的像素图标：一个红色小方块
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // 绘制简单的番茄形状像素图标
      const inCircle = Math.pow(x - 8, 2) + Math.pow(y - 7, 2) < 36;
      const inLeaf = x >= 7 && x <= 9 && y >= 0 && y <= 3 && x === 8;
      if (inCircle) {
        buffer[i] = 255;     // R
        buffer[i + 1] = 50;  // G
        buffer[i + 2] = 50;  // B
        buffer[i + 3] = 255; // A
      } else if (inLeaf) {
        buffer[i] = 0;
        buffer[i + 1] = 200;
        buffer[i + 2] = 50;
        buffer[i + 3] = 255;
      } else {
        buffer[i + 3] = 0;
      }
    }
  }
  const trayIcon = nativeImage.createFromBuffer(buffer, { width: size, height: size });

  tray = new Tray(trayIcon);
  tray.setToolTip('Pixel Pomodoro');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: '开始 / 暂停',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-toggle');
        }
      },
    },
    {
      label: '跳过',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-skip');
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// IPC 处理
ipcMain.handle('send-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, 'assets', 'icon.png') }).show();
  }
});

ipcMain.handle('update-tray-title', (_, title) => {
  if (tray) {
    tray.setToolTip(title);
  }
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('window-move', (_, { x, y }) => {
  // 自定义拖动
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});