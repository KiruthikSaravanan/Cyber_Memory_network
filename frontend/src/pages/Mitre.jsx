import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createMitreMapping,
  deleteMitreMapping,
  getIncidentMitre,
  getMitreErrorMessage,
  getMitreTechnique,
  getMitreTechniques,
} from '../services/mitreService.js'

function MitreDetails({ technique, onClose }) {
  const fields = [
    ['Mapping ID', technique.id],
    ['Technique ID', technique.technique_id],
    ['Technique Name', technique.technique_name],
    ['Tactic', technique.tactic],
    ['Description', technique.description],
    ['Incident ID', technique.incident_id],
  ]

  return (
    <section aria-label="MITRE technique details" aria-modal="true" className="incident-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">MITRE ATT&CK DETAILS</span>
          <h2>{technique.technique_id} — {technique.technique_name}</h2>
        </div>
        <button aria-label="Close MITRE details" className="incident-icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <dl className="incident-detail-grid">
        {fields.map(([label, value]) => (
          <div className="incident-detail-item" key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function MappingForm({ isCreating, onCancel, onSubmit }) {
  const [incidentId, setIncidentId] = useState('')
  const [techniqueId, setTechniqueId] = useState('')
  const [validationError, setValidationError] = useState('')

  async function submitForm(event) {
    event.preventDefault()
    const normalizedIncidentId = incidentId.trim()
    const normalizedTechniqueId = techniqueId.trim().toUpperCase()
    if (!normalizedIncidentId || !normalizedTechniqueId) {
      setValidationError('Incident ID and Technique ID are both required.')
      return
    }
    if (!/^\d+$/.test(normalizedIncidentId) || !Number.isSafeInteger(Number(normalizedIncidentId)) || Number(normalizedIncidentId) <= 0) {
      setValidationError('Incident ID must be a positive whole number.')
      return
    }
    await onSubmit({
      incident_id: Number(normalizedIncidentId),
      technique_id: normalizedTechniqueId,
    })
  }

  return (
    <form className="mitre-map-form" onSubmit={submitForm}>
      <div className="mitre-inline-fields">
        <div className="incident-field">
          <label htmlFor="mitre-incident-id">Incident ID <span aria-hidden="true">*</span></label>
          <input
            id="mitre-incident-id"
            min={1}
            onChange={(event) => setIncidentId(event.target.value)}
            required
            step={1}
            type="number"
            value={incidentId}
          />
        </div>
        <div className="incident-field">
          <label htmlFor="mitre-technique-id">Technique ID <span aria-hidden="true">*</span></label>
          <input
            id="mitre-technique-id"
            onChange={(event) => setTechniqueId(event.target.value)}
            placeholder="For example, T1110"
            required
            type="text"
            value={techniqueId}
          />
        </div>
      </div>
      {validationError && <p className="form-message error-message" role="alert">{validationError}</p>}
      <div className="incident-form-actions">
        <button className="incident-secondary-button" disabled={isCreating} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="incident-primary-button" disabled={isCreating} type="submit">
          {isCreating ? 'Creating mapping…' : 'Create Mapping'}
        </button>
      </div>
    </form>
  )
}

function MitrePage() {
  const [techniques, setTechniques] = useState([])
  const [isLoadingTechniques, setIsLoadingTechniques] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingMappings, setIsLoadingMappings] = useState(false)
  const [loadingTechniqueId, setLoadingTechniqueId] = useState(null)
  const [deletingMappingId, setDeletingMappingId] = useState(null)
  const [incidentId, setIncidentId] = useState('')
  const [searchedIncidentId, setSearchedIncidentId] = useState(null)
  const [incidentMappings, setIncidentMappings] = useState(null)
  const [showMapForm, setShowMapForm] = useState(false)
  const [viewingTechnique, setViewingTechnique] = useState(null)
  const [pageError, setPageError] = useState('')
  const [mapError, setMapError] = useState('')
  const [techniquesError, setTechniquesError] = useState('')
  const [mappingsError, setMappingsError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutationInProgress = useRef(false)

  const loadTechniques = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingTechniques(true)
    setTechniquesError('')
    try {
      const data = await getMitreTechniques()
      if (!Array.isArray(data)) throw new Error('Unexpected MITRE response')
      setTechniques(data)
    } catch (error) {
      setTechniquesError(getMitreErrorMessage(error, 'list'))
    } finally {
      setIsLoadingTechniques(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadTechniques()
  }, [loadTechniques])

  async function loadIncidentMappings(id, { retainErrors = false } = {}) {
    setIsLoadingMappings(true)
    if (!retainErrors) setMappingsError('')
    try {
      const data = await getIncidentMitre(id)
      if (!Array.isArray(data)) throw new Error('Unexpected incident MITRE response')
      setIncidentMappings(data)
      setSearchedIncidentId(id)
      setMappingsError('')
      return true
    } catch (error) {
      setIncidentMappings(null)
      setMappingsError(getMitreErrorMessage(error, 'incident'))
      return false
    } finally {
      setIsLoadingMappings(false)
    }
  }

  async function submitMapping(event) {
    event.preventDefault()
    const normalized = incidentId.trim()
    if (!normalized || !/^\d+$/.test(normalized) || !Number.isSafeInteger(Number(normalized)) || Number(normalized) <= 0) {
      setMappingsError('Enter a valid positive Incident ID.')
      return
    }
    setMappingsError('')
    await loadIncidentMappings(Number(normalized))
  }

  async function handleCreateMapping(data) {
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setIsCreating(true)
    setMapError('')
    setSuccessMessage('')
    try {
      const mapping = await createMitreMapping(data)
      setShowMapForm(false)
      setIncidentId(String(data.incident_id))
      setSuccessMessage(`${mapping.technique_id} was mapped to incident ${mapping.incident_id}.`)
      await Promise.all([
        loadTechniques(false),
        loadIncidentMappings(data.incident_id, { retainErrors: true }),
      ])
    } catch (error) {
      setMapError(getMitreErrorMessage(error, 'create'))
    } finally {
      mutationInProgress.current = false
      setIsCreating(false)
    }
  }

  async function handleViewTechnique(mappingId) {
    setPageError('')
    setViewingTechnique(null)
    setLoadingTechniqueId(mappingId)
    try {
      setViewingTechnique(await getMitreTechnique(mappingId))
    } catch (error) {
      setPageError(getMitreErrorMessage(error, 'details'))
    } finally {
      setLoadingTechniqueId(null)
    }
  }

  async function handleDeleteMapping(mapping) {
    if (!window.confirm('Are you sure you want to remove this MITRE mapping?')) return
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setDeletingMappingId(mapping.id)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteMitreMapping(mapping.id)
      setSuccessMessage('MITRE mapping deleted successfully.')
      await Promise.all([
        loadTechniques(false),
        searchedIncidentId === mapping.incident_id
          ? loadIncidentMappings(mapping.incident_id, { retainErrors: true })
          : Promise.resolve(true),
      ])
    } catch (error) {
      setPageError(getMitreErrorMessage(error, 'delete'))
    } finally {
      mutationInProgress.current = false
      setDeletingMappingId(null)
    }
  }

  async function refreshTechniques() {
    if (isLoadingTechniques || isRefreshing || isCreating || deletingMappingId !== null) return
    setIsRefreshing(true)
    setSuccessMessage('')
    await Promise.all([
      loadTechniques(false),
      searchedIncidentId === null
        ? Promise.resolve(true)
        : loadIncidentMappings(searchedIncidentId, { retainErrors: true }),
    ])
  }

  return (
    <main className="page-content incidents-page mitre-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY OPERATIONS</span>
          <h1>MITRE ATT&amp;CK</h1>
          <p className="page-description">Map cybersecurity incidents to MITRE ATT&amp;CK techniques for investigation and analysis.</p>
        </div>
        <button
          className="incident-secondary-button"
          disabled={isLoadingTechniques || isRefreshing || isCreating || deletingMappingId !== null}
          onClick={refreshTechniques}
          type="button"
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}

      <section aria-label="MITRE techniques" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">TECHNIQUE MAPPINGS</span>
            <h2>MITRE Techniques</h2>
          </div>
          {!isLoadingTechniques && !techniquesError && <span className="panel-count">{techniques.length} total</span>}
        </div>
        {!techniquesError && (
          <p className="mitre-api-note">
            The existing GET /mitre endpoint returns mappings, not the full technique catalog. The technique IDs supported by the backend are validated when you create a mapping.
          </p>
        )}
        {isLoadingTechniques ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading MITRE techniques…
          </div>
        ) : techniquesError ? (
          <p className="panel-message">{techniquesError}</p>
        ) : techniques.length === 0 ? (
          <p className="panel-message">No MITRE technique mappings found.</p>
        ) : (
          <>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table mitre-table">
                <thead>
                  <tr>
                    <th>Mapping ID</th>
                    <th>Technique ID</th>
                    <th>Technique Name</th>
                    <th>Tactic</th>
                    <th>Description</th>
                    <th>Incident ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {techniques.map((technique) => (
                    <tr key={technique.id}>
                      <td>{technique.id}</td>
                      <td className="mitre-technique-id">{technique.technique_id}</td>
                      <td>{technique.technique_name}</td>
                      <td>{technique.tactic || '—'}</td>
                      <td className="mitre-description-cell">{technique.description || '—'}</td>
                      <td>{technique.incident_id}</td>
                      <td>
                        <button
                          className="incident-action-button"
                          disabled={loadingTechniqueId !== null}
                          onClick={() => handleViewTechnique(technique.id)}
                          type="button"
                        >
                          {loadingTechniqueId === technique.id ? 'Loading…' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="mitre-sections-grid">
        <section aria-labelledby="map-technique-title" className="dashboard-panel mitre-action-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">INCIDENT ANALYSIS</span>
              <h2 id="map-technique-title">Map Technique to Incident</h2>
            </div>
            <button
              className="incident-primary-button"
              disabled={isCreating || deletingMappingId !== null}
              onClick={() => {
                setPageError('')
                setMapError('')
                setSuccessMessage('')
                setShowMapForm(true)
              }}
              type="button"
            >
              Map Technique
            </button>
          </div>
          <p className="mitre-panel-description">Provide an existing incident ID and a technique ID supported by the backend.</p>
        </section>

        <section aria-labelledby="incident-mappings-title" className="dashboard-panel mitre-action-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">MAPPED TECHNIQUES</span>
              <h2 id="incident-mappings-title">Incident MITRE Mappings</h2>
            </div>
          </div>
          <form className="mitre-search-form" onSubmit={submitMapping}>
            <div className="incident-field">
              <label htmlFor="search-incident-id">Incident ID</label>
              <input
                id="search-incident-id"
                min={1}
                onChange={(event) => setIncidentId(event.target.value)}
                placeholder="Enter an incident ID"
                required
                step={1}
                type="number"
                value={incidentId}
              />
            </div>
            <button
              className="incident-primary-button"
              disabled={isLoadingMappings || isCreating || deletingMappingId !== null}
              type="submit"
            >
              {isLoadingMappings ? 'Loading mappings…' : 'View Mappings'}
            </button>
          </form>
          {mappingsError && <p className="mitre-inline-error" role="alert">{mappingsError}</p>}
          {isLoadingMappings ? (
            <div className="dashboard-loading" role="status">
              <span aria-hidden="true" className="loading-spinner" />
              Loading mappings…
            </div>
          ) : incidentMappings !== null && incidentMappings.length === 0 ? (
            <p className="panel-message">No MITRE techniques mapped to this incident.</p>
          ) : incidentMappings && incidentMappings.length > 0 ? (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table mitre-table mappings-table">
                <thead>
                  <tr>
                    <th>Mapping ID</th>
                    <th>Technique ID</th>
                    <th>Technique Name</th>
                    <th>Tactic</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentMappings.map((mapping) => (
                    <tr key={mapping.id}>
                      <td>{mapping.id}</td>
                      <td className="mitre-technique-id">{mapping.technique_id}</td>
                      <td>{mapping.technique_name}</td>
                      <td>{mapping.tactic || '—'}</td>
                      <td className="mitre-description-cell">{mapping.description || '—'}</td>
                      <td>
                        <button
                          className="incident-action-button incident-delete-button"
                          disabled={deletingMappingId !== null || isCreating}
                          onClick={() => handleDeleteMapping(mapping)}
                          type="button"
                        >
                          {deletingMappingId === mapping.id ? 'Deleting mapping…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      {showMapForm && (
        <div className="incident-modal-backdrop">
          <section aria-labelledby="mitre-map-form-title" aria-modal="true" className="incident-dialog mitre-form-dialog" role="dialog">
            <div className="incident-dialog-heading">
              <div>
                <span className="panel-kicker">NEW ASSOCIATION</span>
                <h2 id="mitre-map-form-title">Map Technique to Incident</h2>
              </div>
              <button aria-label="Close mapping form" className="incident-icon-button" disabled={isCreating} onClick={() => setShowMapForm(false)} type="button">
                ×
              </button>
            </div>
            {mapError && <div className="dashboard-error" role="alert">{mapError}</div>}
            <MappingForm
              isCreating={isCreating}
              onCancel={() => setShowMapForm(false)}
              onSubmit={handleCreateMapping}
            />
          </section>
        </div>
      )}

      {loadingTechniqueId !== null && (
        <div className="incident-modal-backdrop">
          <section aria-label="Loading MITRE technique details" aria-modal="true" className="incident-dialog" role="dialog">
            <div className="dashboard-loading" role="status">
              <span aria-hidden="true" className="loading-spinner" />
              Loading technique details…
            </div>
          </section>
        </div>
      )}

      {viewingTechnique && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingTechnique(null)
        }}>
          <MitreDetails technique={viewingTechnique} onClose={() => setViewingTechnique(null)} />
        </div>
      )}
    </main>
  )
}

export default MitrePage
