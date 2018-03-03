const express = require('express')
const roku = require('./lib/roku')

let app = express()

app.use(function (req, res, next) {
  // TODO - Move these values to an env file
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/launch/:appId', (req, res) => {
  return roku.init(req, res, 'launchApp')
})
app.get('/', (req, res) => {
  return roku.init(req, res, 'listApps')
})

app.listen(1975)
