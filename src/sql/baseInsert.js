module.exports = `INSERT INTO \`code_possibili\` (
  \`nome_coda\`,
  \`composizione_coda\`,
  \`agenti_membri\`,
  \`agenti_spilloff_1\`,
  \`agenti_spilloff_2\`,
  \`report_to\`,
  \`visibility_key\`,
  \`q_direction\`,
  \`q_frontpage\`,
  \`chat_group\`,
  \`agaw_lookback_min\`,
  \`agaw_enabled\`,
  \`queue_url\`,
  \`rsa_sla\`,
  \`req_sla\`,
  \`wb_campaigns\`,
  \`wb_recallmaxdays\`,
  \`sys_dt_creazione\`,
  \`sys_dt_modifica\`
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`