const SSDPClient = require('node-ssdp').Client
const Request = require('request-promise')
const parseXML = Promise.promisify(require('xml2js').parseString)
const Promise = require('bluebird')
const _ = require('lodash')

let SSDP = new SSDPClient()
let rokuIP = null
let rokuPort = null

// TODO - Timeout for Roku discovery

module.exports = {
  res: null,
  init (res, command) {
    this.res = res
    SSDP.search('roku:ecp')
    return SSDP.on('response', (headers, status, response) => {
      if (response.address && headers.ST && headers.ST === 'roku:ecp') {
        rokuIP = response.address
        rokuPort = response.port
        SSDP.stop()
        this[command]()
      }
    })
  },
  rokuQuery (resource) {
    return Request({
      url: `http://${rokuIP}:8060/${resource}`
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
    this.rokuQuery('query/apps').then((response) => {
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
  }
}
