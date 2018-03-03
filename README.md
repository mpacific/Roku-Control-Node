# Node Roku Control
A simple node app with API endpoints to control a Roku on your local network. Work in progress.

## Install
- Install node modules via `npm install`
- Start up app with `node index.js` (will launch on Port 1975)

## Endpoints
- `/` - Lists out all installed apps with their ID, title, and URL to their icon
- `/launch/[APPID]` - Launches an app (if installed)

## TODO
### Core
- Improve this README
- Tests
- Gulp tasks
- Moving certain configurations to a .env file
- Intelligently caching the discovered IP to a session/config so it doesn't need to rediscover on every query. 

### Features
- Mark app as active in the app list
- Ability to search on the Roku
- Ability to send key presses (directional, as well as text for input forms)
- Device info

## Source Documentation
APIs used as referenced from the [Roku documentation](https://sdkdocs.roku.com/display/sdkdoc/External+Control+API)
