const SSDPClient = require('node-ssdp').Client
const Request = require('request-promise')
const Promise = require('bluebird')
const parseXML = Promise.promisify(require('xml2js').parseString)
const _ = require('lodash')
const fs = require('fs')
let SSDP = new SSDPClient()

// TODO - Save the IP to a session so we don't have to rediscover all the time?
// TODO - Tests for all methods

module.exports = {
  req: null,
  res: null,
  rokuIP: null,
  rokuPort: 8060,
  ipFile: './.rokuIP',
  init (req, res, command) {
    this.req = req
    this.res = res

    return this.checkFile().then((ip) => {
      if (ip && ip.toString()) {
        this.rokuIP = ip.toString()
        return this.deviceInfo().then((deviceInfo) => {
          if (deviceInfo && deviceInfo['device-info']) {
            return this[command]()
          } else {
            return this.discover().then(() => {
              return this[command]()
            }).catch((error) => {
              return this.res.status(500).send(`Roku discovery error: ${error}`)
            })
          }
        })
      } else {
        return this.discover().then(() => {
          return this[command]()
        }).catch((error) => {
          return this.res.status(500).send(`Roku discovery error: ${error}`)
        })
      }
    })
  },
  checkFile () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.ipFile, (error, content) => {
        if (error || !content) {
          resolve()
        }

        resolve(content)
      })
    })
  },
  discover () {
    return new Promise((resolve, reject) => {
      SSDP.on('response', (headers, status, response) => {
        if (response.address && headers.ST && headers.ST === 'roku:ecp') {
          this.rokuIP = response.address
          fs.writeFile(this.ipFile, this.rokuIP)
          SSDP.stop()
          resolve()
        }
      })
      SSDP.search('roku:ecp')

      setTimeout(() => {
        if (!this.rokuIP) {
          fs.writeFile(this.ipFile, null)
          SSDP.stop()
          reject(new Error('Roku not discovered within 5 seconds'))
        }
      }, 5000)
    })
  },
  rokuQuery (resource, method, returnRaw) {
    console.log(`Requesting resource: ${resource}`)
    return Request({
      url: `http://${this.rokuIP}:${this.rokuPort}/${resource}`,
      method: method,
      timeout: 100
    }).then((response) => {
      if (returnRaw) {
        return response
      }

      return parseXML(response).then((result) => {
        return result
      }).catch((error) => {
        return this.res.status(500).send(`XML to JS error: ${error}`)
      })
    }).catch((error) => {
      return this.res.status(500).send(`Roku request (${resource}) error: ${error}`)
    })
  },
  listApps () {
    return this.rokuQuery('query/apps').then((response) => {
      if (response.apps && response.apps.app) {
        if (response.apps.app.length === 0) {
          return this.res.status(404).send(`No apps found.`)
        }

        let apps = []
        _.forEach(response.apps.app, (app) => {
          apps.push({
            id: app.$.id,
            title: app._,
            icon: `http://${this.rokuIP}:${this.rokuPort}/query/icon/${app.$.id}`
          })
        })

        return this.res.status(200).json(apps)
      } else {
        return this.res.status(500).send(`Could not parse response`)
      }
    })
  },
  launchApp () {
    let appId = this.req.params.appId.replace(/[^0-9]/g, '')
    if (!appId) {
      return this.res.status(400).send(`Invalid App ID`)
    }

    return this.rokuQuery(`launch/${appId}`, 'POST').then((response) => {
      return this.res.status(200).send(`App (${appId}) successfully launched.`)
    })
  },
  keyPress () {
    let keyStrings = ['Home', 'Rev', 'Fwd', 'Play', 'Select', 'Left', 'Right', 'Down', 'Up', 'Back', 'InstantReplay', 'Info', 'Backspace', 'Search', 'Enter', 'FindRemote']
    let key = this.req.params.key
    if (!key || (key.length !== 1 && _.indexOf(keyStrings, key) === -1)) {
      return this.res.status(400).send(`Invalid key`)
    }

    if (key.length === 1) {
      key = `Lit_${key}`
    }

    return this.rokuQuery(`keypress/${encodeURIComponent(key)}`, 'POST').then((response) => {
      return this.res.status(200).send(`Key (${key}) pressed.`)
    })
  },
  deviceInfo () {
    return this.rokuQuery(`query/device-info`).then((response) => {
      return response
    })
  }
}
