Packaging instructions for AssetGuard Desktop

Prerequisites:
- Node.js 18+ installed
- For Windows builds: use Windows machine or GitHub Actions for cross-builds
- For macOS builds: build on macOS or use CI

Build steps (local):
1. Build the frontend and compiled assets
   npm run build

2. Ensure server files are present (we include server/ in package.json files)

3. Build electron application:
   npm run electron:build

This will produce installers in `dist-electron/` as per `electron-builder` configuration.

Development mode (run the app with Electron while developing):
- Start backend server (API):
  npm run dev:server:cjs
- Start frontend dev server:
  npm run dev
- Start electron pointing at the dev server:
  npm run electron:dev

Notes:
- The packaged app spawns the bundled `server/index.cjs` from the unpacked asar resources.
- Ensure the MySQL server is available on the target machine, or modify the app to embed a local DB if you want standalone apps.
