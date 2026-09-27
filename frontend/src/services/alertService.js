import api from './api.js'

export async function getAlerts() {
  const response = await api.get('/alerts')
  return response.data
}

export async function getAlert(id) {
  const response = await api.get(`/alerts/${id}`)
  return response.data
}

export async function createAlert(data) {
  const response = await api.post('/alerts', data)
  return response.data
}

export async function updateAlert(id, data) {
  const response = await api.put(`/alerts/${id}`, data)
  return response.data
}

export async function deleteAlert(id) {
  await api.delete(`/alerts/${id}`)
}

const FIELD_LABELS = {
  alert_type: 'Alert type',
  severity: 'Severity',
  timestamp: 'Timestamp',
  status: 'Status',
  incident_id: 'Incident ID',
}

export function getAlertErrorMessage(error, action) {
  if (!error.response) {
    return 'Unable to connect to the server. Check that the backend is running and try again.'
  }

  if (error.response.status === 404) {
    if (error.response.data?.detail === 'Referenced incident not found') {
      return 'The specified incident could not be found. Enter an existing incident ID or leave the field empty.'
    }
    return 'This alert could not be found. It may have already been removed.'
  }

  if (error.response.status === 422 && Array.isArray(error.response.data?.detail)) {
    const messages = error.response.data.detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.at(-1) : null
        const label = FIELD_LABELS[field] || 'Alert details'
        if (field === 'severity' || field === 'status') {
          return `${label} is invalid. Choose one of the available options.`
        }
        if (field === 'timestamp') {
          return 'Enter a valid timestamp.'
        }
        if (field === 'incident_id') {
          return 'Incident ID must be a positive whole number.'
        }
        if (field === 'alert_type') {
          return 'Alert type is required and must be 100 characters or fewer.'
        }
        return `${label} is invalid. Please review this field.`
      })
      .filter((message, index, allMessages) => allMessages.indexOf(message) === index)
    return messages.length > 0 ? messages.join(' ') : 'Please check the alert details and try again.'
  }

  if (error.response.status >= 500) {
    return `The server could not ${action} the alert. Please try again later.`
  }

  return `Unable to ${action} the alert. Please review the information and try again.`
}
