import api from './api.js'

export async function getIOCs() {
  const response = await api.get('/iocs')
  return response.data
}

export async function getIOC(id) {
  const response = await api.get(`/iocs/${id}`)
  return response.data
}

export async function createIOC(data) {
  const response = await api.post('/iocs', data)
  return response.data
}

export async function updateIOC(id, data) {
  const response = await api.put(`/iocs/${id}`, data)
  return response.data
}

export async function deleteIOC(id) {
  await api.delete(`/iocs/${id}`)
}

export function getIOCErrorMessage(error, action) {
  if (!error.response) {
    return 'Unable to connect to the server. Check that the backend is running and try again.'
  }

  if (error.response.status === 404) {
    if (error.response.data?.detail === 'Referenced incident not found') {
      return 'The specified incident could not be found. Enter an existing incident ID or leave the field empty.'
    }
    return 'This IOC could not be found. It may have already been removed.'
  }

  if (error.response.status === 422 && Array.isArray(error.response.data?.detail)) {
    const messages = error.response.data.detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.at(-1) : null
        if (field === 'type') return 'Choose a valid IOC type.'
        if (field === 'value') return 'IOC value is required and must be 512 characters or fewer.'
        if (field === 'threat_level') return 'Choose a valid threat level.'
        if (field === 'incident_id') return 'Incident ID must be a positive whole number.'
        return 'IOC details are invalid. Please review the information.'
      })
      .filter((message, index, allMessages) => allMessages.indexOf(message) === index)
    return messages.length > 0 ? messages.join(' ') : 'Please check the IOC details and try again.'
  }

  if (error.response.status >= 500) {
    return `The server could not ${action} the IOC. Please try again later.`
  }

  return `Unable to ${action} the IOC. Please review the information and try again.`
}
