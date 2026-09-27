import api from './api.js'

export async function getLogs() {
  const response = await api.get('/logs')
  return response.data
}

export async function getLog(id) {
  const response = await api.get(`/logs/${id}`)
  return response.data
}

export async function ingestLogs() {
  const response = await api.post('/logs/ingest')
  return response.data
}

export function getLogErrorMessage(error, action) {
  if (!error.response) {
    if (action === 'load details') return 'Unable to load log details.'
    if (action === 'ingest') return 'Unable to ingest security logs.'
    return 'Unable to load security logs.'
  }

  if (error.response.status === 404 && action === 'load details') {
    return 'This security log could not be found. Refresh the list and try again.'
  }

  const detail = error.response.data?.detail
  if (Array.isArray(detail) && detail.length > 0) {
    if (action === 'ingest') {
      return 'Some sample security logs could not be validated. Review the sample log data and try again.'
    }
    return 'The security logs could not be validated. Please refresh and try again.'
  }

  if (action === 'load details') return 'Unable to load log details.'
  if (action === 'ingest') return 'Unable to ingest security logs.'
  return 'Unable to load security logs.'
}
