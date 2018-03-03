const express = require('express')
const roku = require('./lib/roku')

let app = express()

app.get('/launch/:appId', (req, res) => {
  return roku.init(req, res, 'launchApp')
})
app.get('/', (req, res) => {
  return roku.init(req, res, 'listApps')
})

app.listen(1975)
