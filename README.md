# Node Roku Control
A simple node app with API endpoints to control a Roku on your local network. Work in progress.

## Install
- Install node modules via `npm install`
- Start up app with `node index.js` (will launch on port 1975)

## Endpoints
- `/` - Lists out all installed apps with their ID, title, and URL to their icon
- `/launch/[APPID]` - Launches an installed app (replace [APPID] with the appropriate App ID)
- `/key/[KEY]` - Sends a single character (for keyboard screens) or preset command to the Roku (replace [KEY] with the character or command)
  - Available presets: `'Home', 'Rev', 'Fwd', 'Play', 'Select', 'Left', 'Right', 'Down', 'Up', 'Back', 'InstantReplay', 'Info', 'Backspace', 'Search', 'Enter', 'FindRemote'`

## TODO
### Core
- Improve this README
- Tests
- Gulp tasks
- Moving certain configurations to a .env file

### Features
- Mark app as active in the app list

## Source Documentation
APIs used as referenced from the [Roku documentation](https://sdkdocs.roku.com/display/sdkdoc/External+Control+API)

## Example UI
A quick & dirty example React app has been created to show the interactions with the server. [You can access it here.](https://github.com/mpacific/Roku-Control-React)
