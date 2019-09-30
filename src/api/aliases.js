const app = require('../server.js')
const { database } = require('node-toolbox')
const request = require('request')
const util = require('util')

app.get('/api/aliases/fetch', async (req, res) => {
  if (!req.query || !req.query.queue || !req.query.did) return res.status(400).send({ error: 'MISSING_PARAMS' })
  let result = null
  const value = `%${req.query.queue}.${req.query.did}%`
  try {
    result = await database.query(`SELECT \`nome_coda\`, \`composizione_coda\` FROM \`code_possibili\` WHERE \`composizione_coda\` LIKE ?`, [value])
  } catch (e) {
    console.log('Failed to fetch aliases from the database')
    return res.status(500).send({ error: 'DATABASE_FAILED' })
  }
  return res.status(200).send(result)
})

app.post('/api/aliases/update', async (req, res) => {
  if (!req.body || !req.body.queue || !req.body.did || !req.body.aliases) return res.status(400).send({ error: 'MISSING_PARAMS' })
  let aliases = req.body.aliases
  if (typeof aliases === 'string') aliases = aliases.split(/[|,]/)
  let currData
  try {
    await util.promsisify(request.get)(`/api/aliases/fetch?queue=${req.body.queue}&did=${req.body.did}`)
  } catch (e) {
    console.log('Failed to fetch the current data for each nome_coda')
    return res.status(400).send({ error: 'QM_API_QUERY_FAILED' })
  }

  // FETCH CID FROM OTHER API
  const cid = 'DEMO'

  const sql = aliases.forEach(currAlias => {
    // 20321.6495_HX900_Enq
    const newVal = `${req.body.queue}.${req.body.did}_${cid}`
    const updateTarget = currData[currData.findIndex(d => d[0] === currAlias)]
    const combined = [].concat(updateTarget.split('|'), [newVal])
    return {
      query: ``,
      values: []
    }
  })
})
