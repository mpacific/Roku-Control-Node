const http = require('http')
const SSDPClient = require('node-ssdp').Client
const Request = require('request-promise')
const XML2JS = require('xml2js')
const Promise = require('bluebird')
const _ = require('lodash')

let parseXML = Promise.promisify(XML2JS.parseString)

let SSDP = new SSDPClient()
let rokuIP = null
let rokuPort = null

// TODO - Timeout for Roku discovery

module.exports = {
  init (res, command) {
    SSDP.search('roku:ecp')
    return SSDP.on('response', (headers, status, response) => {
      if (response.address && headers.ST && headers.ST === 'roku:ecp') {
        rokuIP = response.address
        rokuPort = response.port
        SSDP.stop()
        this[command](res)
      }
    })
  },
  rokuQuery (res, resource) {
    return Request({
      url: `http://${rokuIP}:8060/${resource}`
    }).then((response) => {
      return parseXML(response).then((result) => {
        return result
      }).catch((error) => {
        return res.status(500).send(`XML to JS error: ${error}`)
      })
    }).catch((error) => {
      return res.status(500).send(`Roku request (${resource}) error: ${error}`)
    })
  },
  listApps (res) {
    this.rokuQuery(res, 'query/apps').then((response) => {
      if (response.apps && response.apps.app) {
        if (response.apps.app.length === 0) {
          return res.status(404).send(`No apps found.`)
        }

        let apps = []
        _.forEach(response.apps.app, (app) => {
          apps.push({
            id: app.$.id,
            title: app._
          })
        })

        return res.status(200).json(apps)
      } else {
        return res.status(500).send(`Could not parse response`)
      }
    })
  }
}
