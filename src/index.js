'use strict';
require('./sentry');
const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const spotify = require('./domain/spotify-player');
const authorizer = require('./domain/authorizer');
const updater = require('./domain/updater');
const windowFactory = require('./helpers/window-factory');
const localStorage = require('./data-source/local-storage');
const { APP_NAME, MAIN_WINDOW_WIDTH, FEEDBACK_LINK } = require('./helpers/constants');

let window;
let tray;

function launchApp() {
  tray = new Tray(path.join(__dirname, 'img/TrayTemplate.png'));
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = windowFactory.get('main');
  setWindowConfigs(window);

  window.loadFile(path.join(__dirname, 'presentation/html/index.html'));
  window.webContents.send('loading', {});
  setWindowListeners(window);

  authorizer.execute(window);
  spotify.execute(window, tray);
  updater.execute(window);
  setInterval(() => updater.execute(window), 86400000);
}

function setTrayConfigs(tray) {
  tray.setIgnoreDoubleClickEvents(true);
}

function setTrayListeners(tray) {
  tray.on('right-click', () => manageTrayRightClick(tray));
  tray.on('click', (event, bounds) => {
    const windowWidth = window.getSize()[0];
    const trayWidth = bounds.width;
    const x = Math.round(bounds.x - windowWidth/2 + trayWidth/2);
    const y = bounds.y;
    window.setPosition(x, y);
    window.isVisible() ? hideAllWindows() : showAllWindows();
  });
}

function hideAllWindows() {
  BrowserWindow.getAllWindows().forEach(window => window.hide());
}

function showAllWindows() {
  BrowserWindow.getAllWindows().forEach(win => {
    win.show();
    if(win.id !== window.id) win.center();
  });
}

function setWindowConfigs(window) {
  window.setVisibleOnAllWorkspaces(true);
}

function setWindowListeners(window) {
  window.on('closed', () => window = null);
  window.on('blur', () => window.hide());
}

function manageTrayRightClick(tray) {
  const openAtLogin = app.getLoginItemSettings().openAtLogin; 
  const activateNotifications = localStorage.get('activateNotifications');
  const songMenubar = localStorage.get('songMenubar');
  window.hide();

  const trayMenuTemplate = [
    {
      label: APP_NAME,
      enabled: false
    },
    {
      label: 'Open at Login',
      type: 'checkbox',
      checked: openAtLogin,
      click: () => app.setLoginItemSettings({ openAtLogin: !openAtLogin })
    },
    {
      label: 'Give feedback!',
      click: () => shell.openExternal(FEEDBACK_LINK)
    },
    {
      type: 'separator'
    },
    {
      label: 'Activate Notifications',  
      type: 'checkbox',
      checked: activateNotifications,
      click: () => localStorage.save('activateNotifications', !localStorage.get('activateNotifications'))
    },
    {
      label: 'Show song in menu bar',  
      type: 'checkbox',
      checked: songMenubar,
      click: function() {
        localStorage.save('songMenubar', !songMenubar);
        if(songMenubar) tray.setTitle('');
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: function() {
        window.setClosable(true);
        app.quit();
      }
    }
  ];
  const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);

  tray.popUpContextMenu(trayMenu);
}

ipcMain.on('fixHeight', (event, height) => window.setSize(MAIN_WINDOW_WIDTH, height, true));

if(app.dock) app.dock.hide();

app.on('ready', launchApp);
