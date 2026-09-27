import api from './api.js'

export async function getMitreTechniques() {
  const response = await api.get('/mitre')
  return response.data
}

export async function getMitreTechnique(id) {
  const response = await api.get(`/mitre/${id}`)
  return response.data
}

export async function createMitreMapping(data) {
  const response = await api.post('/mitre', data)
  return response.data
}

export async function getIncidentMitre(incidentId) {
  const response = await api.get(`/incidents/${incidentId}/mitre`)
  return response.data
}

export async function deleteMitreMapping(id) {
  await api.delete(`/mitre/${id}`)
}

export function getMitreErrorMessage(error, action) {
  if (!error.response) {
    if (action === 'create') return 'Unable to connect to the server. The MITRE mapping was not created.'
    if (action === 'delete') return 'Unable to connect to the server. The MITRE mapping was not removed.'
    if (action === 'details') return 'Unable to load MITRE technique details.'
    if (action === 'incident') return 'Unable to load incident mappings.'
    return 'Unable to load MITRE techniques.'
  }

  const detail = error.response.data?.detail
  if (error.response.status === 404) {
    if (detail === 'Incident not found') return 'The specified incident could not be found.'
    if (action === 'incident') return 'The specified incident could not be found.'
    return 'This MITRE mapping could not be found. Refresh and try again.'
  }
  if (error.response.status === 409) {
    return 'This technique is already mapped to that incident.'
  }
  if (error.response.status === 422) {
    return 'The technique ID or incident ID is invalid. Check both values and try again.'
  }
  if (error.response.status >= 500) {
    if (action === 'create') return 'The server could not create the MITRE mapping. Please try again later.'
    if (action === 'delete') return 'The server could not delete the MITRE mapping. Please try again later.'
    if (action === 'incident') return 'Unable to load incident mappings right now.'
    return 'Unable to load MITRE data right now.'
  }

  if (typeof detail === 'string' && detail.trim()) return detail
  if (action === 'create') return 'Unable to create the MITRE mapping.'
  if (action === 'delete') return 'Unable to delete the MITRE mapping.'
  if (action === 'details') return 'Unable to load MITRE technique details.'
  if (action === 'incident') return 'Unable to load incident mappings.'
  return 'Unable to load MITRE techniques.'
}
