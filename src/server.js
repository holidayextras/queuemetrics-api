const { routing } = require('node-toolbox')

const app = module.exports = routing.getExpressApp()

require('./api/aliases.js')

app.listen(() => {
  console.log(`Queuemtrics API listening on port ${process.env.SERVER_PORT || 8765}`)
})
