'use strict';
require('../sentry');
const fetch = require('electron-fetch').default;

exports.getLatestVersion = function() {
  return fetch('https://api.github.com/repos/teaminkling/mac-spotify-np/releases/latest', {
    method: 'GET',
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  })
    .then(res => res.json())
    .then(res => ({
      version: res.name,
      dmgDownloadUrl: res.assets[0].browser_download_url
    }));
};
