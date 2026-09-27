import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createIncident,
  deleteIncident,
  getIncident,
  getIncidentErrorMessage,
  getIncidents,
  updateIncident,
} from '../services/incidentService.js'

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed']
const FORM_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'description', label: 'Description', multiline: true },
  { name: 'severity', label: 'Severity', required: true, options: SEVERITIES },
  { name: 'status', label: 'Status', required: true, options: STATUSES },
  { name: 'attack_type', label: 'Attack Type' },
  { name: 'source', label: 'Source' },
  { name: 'detection_time', label: 'Detection Time', type: 'datetime-local' },
  { name: 'assigned_analyst', label: 'Assigned Analyst' },
  { name: 'investigation_notes', label: 'Investigation Notes', multiline: true },
  { name: 'final_solution', label: 'Final Solution', multiline: true },
  { name: 'lessons_learned', label: 'Lessons Learned', multiline: true },
]
const EMPTY_FORM = {
  title: '',
  description: '',
  severity: 'Medium',
  status: 'Open',
  attack_type: '',
  source: '',
  detection_time: '',
  assigned_analyst: '',
  investigation_notes: '',
  final_solution: '',
  lessons_learned: '',
}

function dateValue(value) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function normalizeIncident(incident) {
  return {
    title: incident.title || '',
    description: incident.description || '',
    severity: incident.severity || 'Medium',
    status: incident.status || 'Open',
    attack_type: incident.attack_type || '',
    source: incident.source || '',
    detection_time: localDateTime(incident.detection_time),
    assigned_analyst: incident.assigned_analyst || '',
    investigation_notes: incident.investigation_notes || '',
    final_solution: incident.final_solution || '',
    lessons_learned: incident.lessons_learned || '',
  }
}

function SeverityBadge({ value }) {
  const normalized = (value || 'Unknown').toLowerCase()
  return <span className={`severity-badge severity-${normalized}`}>{value || 'Unknown'}</span>
}

function StatusBadge({ value }) {
  const normalized = (value || 'Unknown').toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-${normalized}`}>{value || 'Unknown'}</span>
}

function IncidentForm({ initialValue, isSaving, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialValue)
  const [validationError, setValidationError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (validationError) setValidationError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setValidationError('Title is required.')
      return
    }
    if (!SEVERITIES.includes(form.severity)) {
      setValidationError('Choose a valid severity.')
      return
    }
    if (!STATUSES.includes(form.status)) {
      setValidationError('Choose a valid status.')
      return
    }

    let detectionTime = null
    if (form.detection_time) {
      const parsed = new Date(form.detection_time)
      if (Number.isNaN(parsed.getTime())) {
        setValidationError('Enter a valid detection date and time.')
        return
      }
      detectionTime = parsed.toISOString()
    }

    const payload = {
      ...form,
      title,
      description: form.description.trim() || null,
      attack_type: form.attack_type.trim() || null,
      source: form.source.trim() || null,
      detection_time: detectionTime,
      assigned_analyst: form.assigned_analyst.trim() || null,
      investigation_notes: form.investigation_notes.trim() || null,
      final_solution: form.final_solution.trim() || null,
      lessons_learned: form.lessons_learned.trim() || null,
    }
    await onSubmit(payload)
  }

  return (
    <form className="incident-form" onSubmit={submitForm}>
      <div className="incident-form-grid">
        {FORM_FIELDS.map((field) => (
          <div
            className={`incident-field${field.multiline ? ' incident-field-wide' : ''}`}
            key={field.name}
          >
            <label htmlFor={`incident-${field.name}`}>
              {field.label}{field.required && <span aria-hidden="true"> *</span>}
            </label>
            {field.options ? (
              <select
                id={`incident-${field.name}`}
                name={field.name}
                onChange={updateField}
                required={field.required}
                value={form[field.name]}
              >
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : field.multiline ? (
              <textarea
                id={`incident-${field.name}`}
                name={field.name}
                onChange={updateField}
                rows={3}
                value={form[field.name]}
              />
            ) : (
              <input
                id={`incident-${field.name}`}
                maxLength={field.name === 'title' ? 255 : undefined}
                name={field.name}
                onChange={updateField}
                required={field.required}
                type={field.type || 'text'}
                value={form[field.name]}
              />
            )}
          </div>
        ))}
      </div>
      {validationError && <p className="form-message error-message" role="alert">{validationError}</p>}
      <div className="incident-form-actions">
        <button className="incident-secondary-button" disabled={isSaving} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="incident-primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Saving…' : 'Save Incident'}
        </button>
      </div>
    </form>
  )
}

function IncidentDetails({ incident, onClose }) {
  const fields = [
    ['ID', incident.id],
    ['Title', incident.title],
    ['Description', incident.description],
    ['Severity', <SeverityBadge key="severity" value={incident.severity} />],
    ['Status', <StatusBadge key="status" value={incident.status} />],
    ['Attack Type', incident.attack_type],
    ['Source', incident.source],
    ['Detection Time', formatDate(incident.detection_time)],
    ['Assigned Analyst', incident.assigned_analyst],
    ['Investigation Notes', incident.investigation_notes],
    ['Final Solution', incident.final_solution],
    ['Lessons Learned', incident.lessons_learned],
    ['Created At', formatDate(incident.created_at)],
  ]

  return (
    <section aria-label="Incident details" aria-modal="true" className="incident-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">INCIDENT DETAILS</span>
          <h2>{incident.title}</h2>
        </div>
        <button aria-label="Close incident details" className="incident-icon-button" onClick={onClose} type="button">
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

function IncidentsPage() {
  const [incidents, setIncidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [busyDeleteId, setBusyDeleteId] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [formInitialValue, setFormInitialValue] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [viewingIncident, setViewingIncident] = useState(null)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutationInProgress = useRef(false)

  const sortedIncidents = useMemo(
    () => [...incidents].sort(
      (a, b) =>
        dateValue(b.created_at || b.detection_time) - dateValue(a.created_at || a.detection_time) ||
        b.id - a.id,
    ),
    [incidents],
  )

  const loadList = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setPageError('')
    try {
      const data = await getIncidents()
      if (!Array.isArray(data)) throw new Error('Unexpected incidents response')
      setIncidents(data)
    } catch (error) {
      setPageError(getIncidentErrorMessage(error, 'load'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  async function openEdit(incidentId) {
    setSuccessMessage('')
    setFormError('')
    setIsSaving(true)
    try {
      const incident = await getIncident(incidentId)
      setEditingId(incidentId)
      setFormInitialValue(normalizeIncident(incident))
      setFormMode('edit')
    } catch (error) {
      setPageError(getIncidentErrorMessage(error, 'load'))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetails(incidentId) {
    setPageError('')
    setSuccessMessage('')
    try {
      setViewingIncident(await getIncident(incidentId))
    } catch (error) {
      setPageError(getIncidentErrorMessage(error, 'load'))
    }
  }

  function openCreate() {
    setSuccessMessage('')
    setFormError('')
    setEditingId(null)
    setFormInitialValue({ ...EMPTY_FORM })
    setFormMode('create')
  }

  async function saveIncident(payload) {
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setIsSaving(true)
    setFormError('')
    try {
      if (formMode === 'edit') {
        await updateIncident(editingId, payload)
        setSuccessMessage('Incident updated successfully.')
      } else {
        await createIncident(payload)
        setSuccessMessage('Incident created successfully.')
      }
      setFormMode(null)
      await loadList(false)
    } catch (error) {
      setFormError(getIncidentErrorMessage(error, formMode === 'edit' ? 'update' : 'create'))
    } finally {
      mutationInProgress.current = false
      setIsSaving(false)
    }
  }

  async function removeIncident(incident) {
    if (!window.confirm('Are you sure you want to delete this incident?')) return
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setBusyDeleteId(incident.id)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteIncident(incident.id)
      setSuccessMessage('Incident deleted successfully.')
      if (viewingIncident?.id === incident.id) setViewingIncident(null)
      await loadList(false)
    } catch (error) {
      setPageError(getIncidentErrorMessage(error, 'delete'))
    } finally {
      mutationInProgress.current = false
      setBusyDeleteId(null)
    }
  }

  function refreshList() {
    if (isRefreshing || isLoading) return
    setIsRefreshing(true)
    loadList(false)
  }

  return (
    <main className="page-content incidents-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY OPERATIONS</span>
          <h1>Incident Management</h1>
          <p className="page-description">Review, investigate, and manage security incidents.</p>
        </div>
        <div className="incident-heading-actions">
          <button className="incident-secondary-button" disabled={isLoading || isRefreshing} onClick={refreshList} type="button">
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="incident-primary-button" onClick={openCreate} type="button">
            + Create Incident
          </button>
        </div>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}
      {formError && !formMode && <div className="dashboard-error" role="alert">{formError}</div>}

      <section aria-label="Incident list" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">CASE ACTIVITY</span>
            <h2>Incidents</h2>
          </div>
          {!isLoading && <span className="panel-count">{incidents.length} total</span>}
        </div>
        {isLoading ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading incidents…
          </div>
        ) : pageError && incidents.length === 0 ? (
          <p className="panel-message">Incident records are unavailable.</p>
        ) : sortedIncidents.length === 0 ? (
          <p className="panel-message">No incidents found.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table incident-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Attack Type</th>
                  <th>Source</th>
                  <th>Detection Time</th>
                  <th>Assigned Analyst</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.id}</td>
                    <td className="primary-cell">
                      <button className="incident-title-button" onClick={() => openDetails(incident.id)} type="button">
                        {incident.title}
                      </button>
                    </td>
                    <td><SeverityBadge value={incident.severity} /></td>
                    <td><StatusBadge value={incident.status} /></td>
                    <td>{incident.attack_type || '—'}</td>
                    <td>{incident.source || '—'}</td>
                    <td className="date-cell">{formatDate(incident.detection_time)}</td>
                    <td>{incident.assigned_analyst || '—'}</td>
                    <td>
                      <div className="incident-row-actions">
                        <button className="incident-action-button" disabled={isSaving || busyDeleteId !== null} onClick={() => openEdit(incident.id)} type="button">
                          Edit
                        </button>
                        <button className="incident-action-button incident-delete-button" disabled={busyDeleteId !== null || isSaving} onClick={() => removeIncident(incident)} type="button">
                          {busyDeleteId === incident.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formMode && (
        <div className="incident-modal-backdrop">
          <section aria-labelledby="incident-form-title" aria-modal="true" className="incident-dialog incident-form-dialog" role="dialog">
            <div className="incident-dialog-heading">
              <div>
                <span className="panel-kicker">{formMode === 'edit' ? 'UPDATE CASE' : 'NEW CASE'}</span>
                <h2 id="incident-form-title">{formMode === 'edit' ? 'Edit Incident' : 'Create Incident'}</h2>
              </div>
              <button aria-label="Close incident form" className="incident-icon-button" disabled={isSaving} onClick={() => setFormMode(null)} type="button">
                ×
              </button>
            </div>
            {formError && <div className="dashboard-error" role="alert">{formError}</div>}
            <IncidentForm
              initialValue={formInitialValue}
              isSaving={isSaving}
              onCancel={() => setFormMode(null)}
              onSubmit={saveIncident}
            />
          </section>
        </div>
      )}

      {viewingIncident && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingIncident(null)
        }}>
          <IncidentDetails incident={viewingIncident} onClose={() => setViewingIncident(null)} />
        </div>
      )}
    </main>
  )
}

export default IncidentsPage
