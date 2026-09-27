import api from './api.js'

async function loadCollection(path) {
  try {
    const response = await api.get(path)
    if (!Array.isArray(response.data)) {
      throw new Error('Unexpected collection response')
    }
    return { data: response.data, error: false }
  } catch {
    return { data: null, error: true }
  }
}

export async function loadDashboardData() {
  const [incidents, alerts, iocs] = await Promise.all([
    loadCollection('/incidents'),
    loadCollection('/alerts'),
    loadCollection('/iocs'),
  ])

  return { incidents, alerts, iocs }
}
