'use strict';
const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const spotify = require('./js/spotify-player');

const APP_NAME = 'Spotify - now playing';
const WINDOW_WIDTH = 250;
const WINDOW_HEIGHT = 150;

let window;
let tray;

function launchApp() {
  tray = createTray();
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = createBrowserWindow();
  setWindowConfigs(window);

  window.loadFile('src/index.html');
  window.webContents.send('loading', {});
  setWindowListeners(window);

  spotify.execute(window);
}

function createTray() {
  return new Tray(path.join(__dirname, 'img/iconTemplate.png'));
}

function setTrayConfigs(tray) {
  tray.setHighlightMode('never');
  tray.setIgnoreDoubleClickEvents(true);
}

function setTrayListeners(tray) {
  tray.on('right-click', () => manageTrayRightClick(tray));
  tray.on('click', (event, bounds) => {
    const windowWidth = window.getSize()[0];
    const trayWidth = bounds.width;
    const x = bounds.x - windowWidth/2 + trayWidth/2;
    const y = bounds.y;
    window.setPosition(x, y);
    window.isVisible() ? window.hide() : window.show();
  });
}

function createBrowserWindow() {
  const width = WINDOW_WIDTH;
  const height = WINDOW_HEIGHT;

  const browserWindowOptions = {
    width,
    height,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    fullscreenable: false,
    title: APP_NAME,
    show: false,
    frame: false
  };
  
  return new BrowserWindow(browserWindowOptions);
}

function setWindowConfigs(window) {
  window.setVisibleOnAllWorkspaces(true);
}

function setWindowListeners(window) {
  window.on('closed', () => window = null);
  window.on('blur', () => window.hide());
}

function manageTrayRightClick(tray) {
  window.hide();

  const trayMenuTemplate = [
    {
      label: APP_NAME,
      enabled: false
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

ipcMain.on('fixHeight', (event, height) => window.setSize(WINDOW_WIDTH, height));

app.dock.hide();

app.on('ready', launchApp);
