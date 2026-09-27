import api from './api.js'

export async function getIncidents() {
  const response = await api.get('/incidents')
  return response.data
}

export async function getIncident(id) {
  const response = await api.get(`/incidents/${id}`)
  return response.data
}

export async function createIncident(data) {
  const response = await api.post('/incidents', data)
  return response.data
}

export async function updateIncident(id, data) {
  const response = await api.put(`/incidents/${id}`, data)
  return response.data
}

export async function deleteIncident(id) {
  await api.delete(`/incidents/${id}`)
}

const FIELD_LABELS = {
  title: 'Title',
  severity: 'Severity',
  status: 'Status',
  detection_time: 'Detection time',
  description: 'Description',
  attack_type: 'Attack type',
  assigned_analyst: 'Assigned analyst',
  investigation_notes: 'Investigation notes',
  final_solution: 'Final solution',
  lessons_learned: 'Lessons learned',
}

export function getIncidentErrorMessage(error, action) {
  if (!error.response) {
    return 'Unable to connect to the server. Check that the backend is running and try again.'
  }

  if (error.response.status === 404) {
    return 'This incident could not be found. It may have already been removed.'
  }

  if (error.response.status === 422 && Array.isArray(error.response.data?.detail)) {
    const messages = error.response.data.detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.at(-1) : null
        const label = FIELD_LABELS[field] || 'Incident details'
        if (field === 'severity' || field === 'status') {
          return `${label} is invalid. Choose one of the available options.`
        }
        if (field === 'title') {
          return 'Title is required and must be 255 characters or fewer.'
        }
        if (field === 'detection_time') {
          return 'Enter a valid detection date and time.'
        }
        return `${label} is invalid. Please review this field.`
      })
      .filter((message, index, allMessages) => allMessages.indexOf(message) === index)
    return messages.length > 0 ? messages.join(' ') : 'Please check the incident details and try again.'
  }

  if (error.response.status >= 500) {
    return `The server could not ${action} the incident. Please try again later.`
  }

  return `Unable to ${action} the incident. Please review the information and try again.`
}
