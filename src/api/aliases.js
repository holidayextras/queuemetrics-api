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
    const fetchResponse = await util.promisify(request.get)(`http://localhost:${process.env.SERVER_PORT || 8765}/api/aliases/fetch?queue=${req.body.queue}&did=${req.body.did}`)
    currData = JSON.parse(fetchResponse.body)
  } catch (e) {
    console.log('Failed to fetch the current data for each nome_coda')
    console.log(e)
    return res.status(400).send({ error: 'QM_API_QUERY_FAILED' })
  } finally {
    if (currData && currData.error) return res.status(400).send({ error: 'QM_API_QUERY_FAILED' })
  }

  let cid = 'DEFAULTCID'
  try {
    const fetchResponse = await util.promisify(request.get)(`http://localhost:8766/api/cid/fetch/fromdid?did=${req.body.did}`)
    cid = JSON.parse(fetchResponse.body).result
  } catch (e) {
    console.log('Failed to fetch the CID from DID', req.body.did, e)
    return res.status(400).send({ error: 'CID_API_QUERY_FAILED' })
  }
  console.log('current CID', cid)
  //remove the colon, then add the query at the end and this should be done?
  return res.status(200).send({ msg: 'ok' })

  const sql = aliases.forEach(currAlias => {
    // 20321.6495_HX900_Enq
    const newVal = `${req.body.queue}.${req.body.did}_${cid}`
    let updateTarget = {
      nome_coda: currAlias,
      composizione_coda: ''
    }
    const targetIndex = currData.findIndex(d => d.nome_coda === currAlias)
    if (targetIndex !== -1) updateTarget = currData[currData.findIndex(d => d.nome_coda === currAlias)]
    const combined = [].concat(updateTarget.composizione_coda.split('|'), [newVal])
    const dedupedFinal = [...new Set(combined)].join('|')
    return {
      query: ``,
      values: []
    }
  })
  return res.status(200).send({ msg: 'ok' })
})
