const express = require('express')
const roku = require('./lib/roku')

let app = express()

app.get('/', (req, res) => {
  roku.init(res, 'listApps')
})

app.listen(1975)
