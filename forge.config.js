module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/images/icon.ico'
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
        icon: './src/assets/images/icon.ico',
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './src/assets/images/icon.ico',
      }, 
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
            {
              html: './src/templates/settings.html',
              js: './src/assets/js/settings.renderer.js',
              name: 'settings_window',
              preload: {
                js: './src/assets/js/settings.preload.js',
              },
            },
            {
              html: './src/templates/serverInfo.html',
              js: './src/assets/js/serverInfo.renderer.js',
              name: 'server_info_window',
              preload: {
                js: './src/assets/js/serverInfo.preload.js',
              },
            },
          ],
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'CS2Browser',
          name: 'Launcher'
        },
        prerelease: false,
        draft: false
      }
    }
  ]
};
