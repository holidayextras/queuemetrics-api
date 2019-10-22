const app = require('../server.js')
const { database, meta } = require('node-toolbox')
const request = require('request')
const util = require('util')

const qmApiHostUrl = meta.isDevelopment ? 'http://localhost:8765' : '???' // Needs to be a real URL when deployment is figured out

app.get('/api/aliases/fetch', async (req, res) => {
  if (!req.query || !req.query.targetCode) return res.status(400).send({ error: 'MISSING_PARAMS' })
  let result = null
  try {
    result = await database.query(`SELECT \`id_coda\`, \`nome_coda\`, \`composizione_coda\` FROM \`code_possibili\` WHERE \`nome_coda\` LIKE ?`, [`${req.query.targetCode}`])
  } catch (e) {
    console.log('Failed to fetch alias data from the database', e)
    return res.status(500).send({ error: 'DATABASE_FAILED' })
  }
  return res.status(200).send({ result })
})

app.post('/api/aliases/update', async (req, res) => {
  if (!req.body || !req.body.targetCode || !req.body.aliases) return res.status(400).send({ error: 'MISSING_PARAMS' })
  let aliases = req.body.aliases
  if (typeof req.body.aliases === 'string') aliases = req.body.aliases.split(/[|,]/)
  let currData
  try {
    const fetchResponse = await util.promisify(request.get)(`${qmApiHostUrl}/api/aliases/fetch?targetCode=${req.body.targetCode}`)
    currData = JSON.parse(fetchResponse.body)
  } catch (e) {
    console.log('Failed to fetch the current data for the target nome_coda', e)
    return res.status(400).send({ error: 'QM_API_QUERY_FAILED' })
  } finally {
    if (currData && currData.error) return res.status(400).send({ error: 'QM_API_QUERY_FAILED' })
  }
  const target = (currData.result && currData.result[0]) || { nome_coda: req.body.targetCode }

  let combinedData
  if (target.composizione_coda) combinedData = [].concat(target.composizione_coda.split('|'), aliases)
  else combinedData = aliases
  const dedupedString = [...new Set(combinedData)].join('|')
  let sql = { query: '', values: [] }
  if (target.id_coda) {
    sql.query = `UPDATE \`code_possibili\` SET \`composizione_coda\` = ? WHERE id_coda = ?`
    sql.values = [dedupedString, target.id_coda]
  } else {
    sql.query = require('../sql/baseInsert.js'),
    sql.values = [
      target.nome_coda,
      dedupedString,
      ' ',
      ' ',
      ' ',
      ' ',
      ' ',
      'inbound',
      1,
      '',
      0,
      0,
      '',
      0,
      0,
      '',
      0,
      (new Date().toISOString()).replace('T', ' ').slice(0, -1),
      (new Date().toISOString()).replace('T', ' ').slice(0, -1)
    ]
  }

  try {
    await database.query(sql.query, sql.values)
  } catch (e) {
    console.log('Failed to insert/update composizione_coda(s)', target, aliases)
    return res.status(400).send({ error: 'DATABASE_FAILED' })
  }

  return res.status(200).send()
})