const SSDPClient = require('node-ssdp').Client
const Request = require('request-promise')
const Promise = require('bluebird')
const parseXML = Promise.promisify(require('xml2js').parseString)
const _ = require('lodash')
let SSDP = new SSDPClient()

// TODO - Save the IP to a session so we don't have to rediscover all the time?

module.exports = {
  req: null,
  res: null,
  rokuIP: null,
  init (req, res, command) {
    this.req = req
    this.res = res

    return this.discover().then(() => {
      return this[command]()
    }).catch((error) => {
      return this.res.status(500).send(`Roku discovery error: ${error}`)
    })
  },
  discover () {
    return new Promise((resolve, reject) => {
      SSDP.on('response', (headers, status, response) => {
        if (response.address && headers.ST && headers.ST === 'roku:ecp') {
          this.rokuIP = response.address
          SSDP.stop()
          resolve()
        }
      })
      SSDP.search('roku:ecp')

      setTimeout(() => {
        if (!this.rokuIP) {
          reject(new Error('Roku not discovered within 5 seconds'))
        }
      }, 5000)
    })
  },
  rokuQuery (resource, method) {
    return Request({
      url: `http://${this.rokuIP}:8060/${resource}`,
      method: method
    }).then((response) => {
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
            title: app._
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
  }
}
