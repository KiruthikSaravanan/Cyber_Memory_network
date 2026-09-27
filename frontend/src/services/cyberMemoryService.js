import api from './api.js'

export async function getCyberMemories() {
  const response = await api.get('/cyber-memory')
  return response.data
}

export async function getCyberMemory(id) {
  const response = await api.get(`/cyber-memory/${id}`)
  return response.data
}

export async function createMemoryFromIncident(incidentId) {
  const response = await api.post(`/cyber-memory/from-incident/${incidentId}`)
  return response.data
}

export async function getIncidentCyberMemory(incidentId) {
  const response = await api.get(`/incidents/${incidentId}/cyber-memory`)
  return response.data
}

export async function updateCyberMemory(id, data) {
  const response = await api.put(`/cyber-memory/${id}`, data)
  return response.data
}

export async function deleteCyberMemory(id) {
  await api.delete(`/cyber-memory/${id}`)
}

export async function searchCyberMemory(keyword) {
  const response = await api.get('/cyber-memory/search', { params: { keyword } })
  return response.data
}

export async function searchCyberMemoryByAttackType(attackType) {
  const response = await api.get(`/cyber-memory/search/attack-type/${encodeURIComponent(attackType)}`)
  return response.data
}

export function getCyberMemoryErrorMessage(error, action) {
  if (!error.response) {
    if (action === 'create') return 'Unable to create Cyber Memory. Check that the backend is running.'
    if (action === 'update') return 'Unable to update Cyber Memory. Check that the backend is running.'
    if (action === 'delete') return 'Unable to delete Cyber Memory. Check that the backend is running.'
    if (action === 'details') return 'Unable to load Cyber Memory details. Check that the backend is running.'
    if (action === 'keyword') return 'Unable to search Cyber Memory. Check that the backend is running.'
    if (action === 'attack-type') return 'Unable to search by attack type. Check that the backend is running.'
    if (action === 'incident') return 'Unable to find Cyber Memory for this incident. Check that the backend is running.'
    return 'Unable to load Cyber Memories. Check that the backend is running.'
  }

  const status = error.response.status
  const detail = error.response.data?.detail

  if (action === 'incident' && status === 404) {
    if (detail === 'Incident not found') return 'The specified incident could not be found.'
    if (detail === 'Cyber Memory not found for this incident') return 'No Cyber Memory found for this incident.'
  }
  if (status === 404) {
    if (detail === 'Incident not found') return 'The specified incident could not be found.'
    if (detail === 'Cyber Memory not found for this incident') return 'No Cyber Memory found for this incident.'
    if (detail === 'Cyber Memory not found') return 'This Cyber Memory could not be found. It may have already been removed.'
  }
  if (status === 409 && detail === 'Cyber Memory already exists for this incident') {
    return 'A Cyber Memory already exists for this incident.'
  }
  if (status === 422 && detail === 'Cyber Memory can only be created from a Closed incident') {
    return 'Cyber Memory can only be created from a Closed incident.'
  }
  if (status === 422) return 'The Cyber Memory request is invalid. Check the entered values and try again.'
  if (status >= 500) {
    if (action === 'create') return 'The server could not create Cyber Memory. Please try again later.'
    if (action === 'update') return 'The server could not update Cyber Memory. Please try again later.'
    if (action === 'delete') return 'The server could not delete Cyber Memory. Please try again later.'
    if (action === 'details') return 'Unable to load Cyber Memory details right now.'
    if (action === 'keyword') return 'Unable to search Cyber Memory right now.'
    if (action === 'attack-type') return 'Unable to search by attack type right now.'
    if (action === 'incident') return 'Unable to find Cyber Memory for this incident right now.'
    return 'Unable to load Cyber Memories right now.'
  }

  if (typeof detail === 'string' && detail.trim()) return detail
  if (action === 'create') return 'Unable to create Cyber Memory.'
  if (action === 'update') return 'Unable to update Cyber Memory.'
  if (action === 'delete') return 'Unable to delete Cyber Memory.'
  if (action === 'details') return 'Unable to load Cyber Memory details.'
  if (action === 'keyword') return 'Unable to search Cyber Memory.'
  if (action === 'attack-type') return 'Unable to search by attack type.'
  if (action === 'incident') return 'Unable to find Cyber Memory for this incident.'
  return 'Unable to load Cyber Memories.'
}
