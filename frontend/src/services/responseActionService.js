import api from './api.js'

export async function getResponseActions() {
  const response = await api.get('/response-actions')
  return response.data
}

export async function getResponseAction(id) {
  const response = await api.get(`/response-actions/${id}`)
  return response.data
}

export async function createResponseAction(data) {
  const response = await api.post('/response-actions', data)
  return response.data
}

export async function updateResponseAction(id, data) {
  const response = await api.put(`/response-actions/${id}`, data)
  return response.data
}

export async function deleteResponseAction(id) {
  await api.delete(`/response-actions/${id}`)
}

export async function getIncidentResponseActions(incidentId) {
  const response = await api.get(`/incidents/${incidentId}/response-actions`)
  return response.data
}

export function getResponseActionErrorMessage(error, action) {
  if (!error.response) {
    if (action === 'create') return 'Unable to create response action. Check that the backend is running.'
    if (action === 'update') return 'Unable to update response action. Check that the backend is running.'
    if (action === 'delete') return 'Unable to delete response action. Check that the backend is running.'
    if (action === 'details') return 'Unable to load action details. Check that the backend is running.'
    if (action === 'incident') return 'Unable to load incident response actions. Check that the backend is running.'
    return 'Unable to load response actions. Check that the backend is running.'
  }

  const detail = error.response.data?.detail
  if (error.response.status === 404) {
    if (detail === 'Incident not found' || action === 'incident') {
      return 'The specified incident could not be found.'
    }
    return 'This response action could not be found. It may have already been removed.'
  }

  if (error.response.status === 422) {
    return 'The response action details are invalid. Check the action, status, and incident ID.'
  }

  if (error.response.status >= 500) {
    if (action === 'create') return 'The server could not create the response action. Please try again later.'
    if (action === 'update') return 'The server could not update the response action. Please try again later.'
    if (action === 'delete') return 'The server could not delete the response action. Please try again later.'
    if (action === 'details') return 'Unable to load action details right now.'
    if (action === 'incident') return 'Unable to load incident response actions right now.'
    return 'Unable to load response actions right now.'
  }

  if (typeof detail === 'string' && detail.trim()) return detail
  if (action === 'create') return 'Unable to create response action.'
  if (action === 'update') return 'Unable to update response action.'
  if (action === 'delete') return 'Unable to delete response action.'
  if (action === 'details') return 'Unable to load action details.'
  if (action === 'incident') return 'Unable to load incident response actions.'
  return 'Unable to load response actions.'
}
