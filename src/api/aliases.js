const app = require('../server.js')
const { database } = require('node-toolbox')
const request = require('request')
const util = require('util')

app.get('/api/aliases/fetch', async (req, res) => {
  if (!req.query || !req.query.aliases) return res.status(400).send({ error: 'MISSING_PARAMS' })
  let aliases = req.query.aliases
  if (typeof aliases === 'string') aliases = aliases.split(/[|,]/)
  let result = null
  try {
    // result = await database.query(`SELECT \`id_coda\`, \`nome_coda\`, \`composizione_coda\` FROM \`code_possibili\` WHERE \`composizione_coda\` LIKE ?`, [value])
    result = await database.query(`SELECT \`id_coda\`, \`nome_coda\`, \`composizione_coda\` FROM \`code_possibili\` WHERE \`nome_coda\` in (${aliases.map(() => '?')})`, aliases)

  } catch (e) {
    console.log('Failed to fetch aliases from the database', e)
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
    const fetchResponse = await util.promisify(request.get)(`http://localhost:${process.env.SERVER_PORT || 8765}/api/aliases/fetch?aliases=${aliases.join('|')}`)
    currData = JSON.parse(fetchResponse.body)
  } catch (e) {
    console.log('Failed to fetch the current data for each nome_coda', e)
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

  if (cid.endsWith(':')) cid = cid.slice(0, -1)
  else return res.status(200).send({ error: 'CID_INVALID', cid })

  const sqlToExecute = aliases.map(currAlias => {
    const newVal = `${req.body.queue}.${req.body.did}_${cid}`
    let updateTarget = {
      nome_coda: currAlias,
      composizione_coda: ''
    }
    const targetIndex = currData.findIndex(d => d.nome_coda === currAlias)
    if (targetIndex !== -1) updateTarget = currData[currData.findIndex(d => d.nome_coda === currAlias)]
    let combined = []
    if (updateTarget.composizione_coda) combined = [].concat(updateTarget.composizione_coda.split('|'), [newVal])
    else combined = [newVal]
    const dedupedFinal = [...new Set(combined)].join('|')

    // We know this has been pulled from the currData
    if (updateTarget.id_coda) return {
      query: `UPDATE \`code_possibili\` SET \`composizione_coda\` = ? WHERE id_coda = ?`,
      values: [dedupedFinal, updateTarget.id_coda]
    }
    return {
      query: require('../sql/baseInsert.js'),
      values: [
        updateTarget.nome_coda,
        dedupedFinal,
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
  })
  let connection
  let results = []
  try {
    connection = await database.transaction()
    for (let sql of sqlToExecute) {
      results.push(await connection.query(sql.query, sql.values))
    }
    await connection.commit
  } catch (e) {
    if (connection) await connection.rollback()
    return res.status(500).send({ error: 'DATABASE_SAVE_FAILED' })
  }
  return res.status(200).send({ msg: 'ok' })
})