import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createIOC,
  deleteIOC,
  getIOC,
  getIOCErrorMessage,
  getIOCs,
  updateIOC,
} from '../services/iocService.js'

const IOC_TYPES = ['IP', 'Domain', 'Hash', 'URL']
const THREAT_LEVELS = ['Low', 'Medium', 'High', 'Critical']

function emptyForm() {
  return {
    type: 'IP',
    value: '',
    threat_level: 'Medium',
    description: '',
    incident_id: '',
  }
}

function ThreatBadge({ value }) {
  const normalized = (value || 'Unknown').toLowerCase()
  return <span className={`severity-badge severity-${normalized}`}>{value || 'Unknown'}</span>
}

function IOCForm({ initialValue, isSaving, submitLabel, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialValue)
  const [validationError, setValidationError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (validationError) setValidationError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    const value = form.value.trim()
    if (!IOC_TYPES.includes(form.type)) {
      setValidationError('Choose a valid IOC type.')
      return
    }
    if (!value) {
      setValidationError('IOC value is required.')
      return
    }
    if (value.length > 512) {
      setValidationError('IOC value must be 512 characters or fewer.')
      return
    }
    if (!THREAT_LEVELS.includes(form.threat_level)) {
      setValidationError('Choose a valid threat level.')
      return
    }

    let incidentId = null
    if (form.incident_id.trim()) {
      if (!/^\d+$/.test(form.incident_id.trim())) {
        setValidationError('Incident ID must be a positive whole number.')
        return
      }
      incidentId = Number(form.incident_id)
      if (!Number.isSafeInteger(incidentId) || incidentId <= 0) {
        setValidationError('Incident ID must be a positive whole number.')
        return
      }
    }

    await onSubmit({
      type: form.type,
      value,
      threat_level: form.threat_level,
      description: form.description.trim() || null,
      incident_id: incidentId,
    })
  }

  return (
    <form className="incident-form" onSubmit={submitForm}>
      <div className="incident-form-grid">
        <div className="incident-field">
          <label htmlFor="ioc-type">Type <span aria-hidden="true">*</span></label>
          <select id="ioc-type" name="type" onChange={updateField} required value={form.type}>
            {IOC_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>
        <div className="incident-field">
          <label htmlFor="ioc-value">Value <span aria-hidden="true">*</span></label>
          <input
            id="ioc-value"
            maxLength={512}
            name="value"
            onChange={updateField}
            required
            type="text"
            value={form.value}
          />
        </div>
        <div className="incident-field">
          <label htmlFor="ioc-threat-level">Threat Level <span aria-hidden="true">*</span></label>
          <select
            id="ioc-threat-level"
            name="threat_level"
            onChange={updateField}
            required
            value={form.threat_level}
          >
            {THREAT_LEVELS.map((level) => <option key={level}>{level}</option>)}
          </select>
        </div>
        <div className="incident-field">
          <label htmlFor="ioc-incident-id">Incident ID (optional)</label>
          <input
            id="ioc-incident-id"
            min={1}
            name="incident_id"
            onChange={updateField}
            step={1}
            type="number"
            value={form.incident_id}
          />
        </div>
        <div className="incident-field incident-field-wide">
          <label htmlFor="ioc-description">Description</label>
          <textarea
            id="ioc-description"
            name="description"
            onChange={updateField}
            rows={3}
            value={form.description}
          />
        </div>
      </div>
      {validationError && <p className="form-message error-message" role="alert">{validationError}</p>}
      <div className="incident-form-actions">
        <button className="incident-secondary-button" disabled={isSaving} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="incident-primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function IOCDetails({ ioc, onClose }) {
  const fields = [
    ['ID', ioc.id],
    ['Type', ioc.type],
    ['Value', ioc.value],
    ['Threat Level', <ThreatBadge key="threat-level" value={ioc.threat_level} />],
    ['Description', ioc.description],
    ['Incident ID', ioc.incident_id],
    ['Created At', ioc.created_at ? new Date(ioc.created_at).toLocaleString() : 'Not provided by API'],
  ]

  return (
    <section aria-label="IOC details" aria-modal="true" className="incident-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">IOC DETAILS</span>
          <h2>{ioc.value}</h2>
        </div>
        <button aria-label="Close IOC details" className="incident-icon-button" onClick={onClose} type="button">
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

function IOCsPage() {
  const [iocs, setIOCs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [busyDeleteId, setBusyDeleteId] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [formInitialValue, setFormInitialValue] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [viewingIOC, setViewingIOC] = useState(null)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutationInProgress = useRef(false)

  const sortedIOCs = useMemo(
    () => [...iocs].sort((a, b) => b.id - a.id),
    [iocs],
  )

  const loadList = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setPageError('')
    try {
      const data = await getIOCs()
      if (!Array.isArray(data)) throw new Error('Unexpected IOC response')
      setIOCs(data)
    } catch (error) {
      setPageError(getIOCErrorMessage(error, 'load'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  function openCreate() {
    setPageError('')
    setFormError('')
    setSuccessMessage('')
    setEditingId(null)
    setFormInitialValue(emptyForm())
    setFormMode('create')
  }

  async function openEdit(iocId) {
    setPageError('')
    setFormError('')
    setSuccessMessage('')
    setIsSaving(true)
    try {
      const ioc = await getIOC(iocId)
      setEditingId(iocId)
      setFormInitialValue({
        type: ioc.type,
        value: ioc.value,
        threat_level: ioc.threat_level,
        description: ioc.description || '',
        incident_id: ioc.incident_id == null ? '' : String(ioc.incident_id),
      })
      setFormMode('edit')
    } catch (error) {
      setPageError(getIOCErrorMessage(error, 'load'))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetails(iocId) {
    setPageError('')
    setSuccessMessage('')
    try {
      setViewingIOC(await getIOC(iocId))
    } catch (error) {
      setPageError(getIOCErrorMessage(error, 'load'))
    }
  }

  async function saveIOC(payload) {
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setIsSaving(true)
    setFormError('')
    try {
      if (formMode === 'edit') {
        await updateIOC(editingId, payload)
        setSuccessMessage('IOC updated successfully.')
      } else {
        await createIOC(payload)
        setSuccessMessage('IOC created successfully.')
      }
      setFormMode(null)
      await loadList(false)
    } catch (error) {
      setFormError(getIOCErrorMessage(error, formMode === 'edit' ? 'update' : 'create'))
    } finally {
      mutationInProgress.current = false
      setIsSaving(false)
    }
  }

  async function removeIOC(ioc) {
    if (!window.confirm('Are you sure you want to delete this IOC?')) return
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setBusyDeleteId(ioc.id)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteIOC(ioc.id)
      setSuccessMessage('IOC deleted successfully.')
      if (viewingIOC?.id === ioc.id) setViewingIOC(null)
      await loadList(false)
    } catch (error) {
      setPageError(getIOCErrorMessage(error, 'delete'))
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
          <h1>IOC Management</h1>
          <p className="page-description">Review and manage indicators of compromise.</p>
        </div>
        <div className="incident-heading-actions">
          <button className="incident-secondary-button" disabled={isLoading || isRefreshing} onClick={refreshList} type="button">
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="incident-primary-button" onClick={openCreate} type="button">
            + Create IOC
          </button>
        </div>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}
      {formError && !formMode && <div className="dashboard-error" role="alert">{formError}</div>}

      <section aria-label="IOC list" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">THREAT INDICATORS</span>
            <h2>Indicators of Compromise</h2>
          </div>
          {!isLoading && <span className="panel-count">{iocs.length} total</span>}
        </div>
        {isLoading ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading IOCs…
          </div>
        ) : pageError && iocs.length === 0 ? (
          <p className="panel-message">IOC records are unavailable.</p>
        ) : sortedIOCs.length === 0 ? (
          <p className="panel-message">No IOCs found.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table ioc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Threat Level</th>
                  <th>Description</th>
                  <th>Incident ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedIOCs.map((ioc) => (
                  <tr key={ioc.id}>
                    <td>{ioc.id}</td>
                    <td>{ioc.type}</td>
                    <td className="primary-cell ioc-value-cell">{ioc.value}</td>
                    <td><ThreatBadge value={ioc.threat_level} /></td>
                    <td className="ioc-description-cell">{ioc.description || '—'}</td>
                    <td>{ioc.incident_id ?? '—'}</td>
                    <td>
                      <div className="incident-row-actions">
                        <button className="incident-action-button" disabled={isSaving || busyDeleteId !== null} onClick={() => openDetails(ioc.id)} type="button">
                          View
                        </button>
                        <button className="incident-action-button" disabled={isSaving || busyDeleteId !== null} onClick={() => openEdit(ioc.id)} type="button">
                          Edit
                        </button>
                        <button className="incident-action-button incident-delete-button" disabled={busyDeleteId !== null || isSaving} onClick={() => removeIOC(ioc)} type="button">
                          {busyDeleteId === ioc.id ? 'Deleting…' : 'Delete'}
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

      {formMode && formInitialValue && (
        <div className="incident-modal-backdrop">
          <section aria-labelledby="ioc-form-title" aria-modal="true" className="incident-dialog incident-form-dialog" role="dialog">
            <div className="incident-dialog-heading">
              <div>
                <span className="panel-kicker">{formMode === 'edit' ? 'UPDATE INDICATOR' : 'NEW INDICATOR'}</span>
                <h2 id="ioc-form-title">{formMode === 'edit' ? 'Edit IOC' : 'Create IOC'}</h2>
              </div>
              <button aria-label="Close IOC form" className="incident-icon-button" disabled={isSaving} onClick={() => setFormMode(null)} type="button">
                ×
              </button>
            </div>
            {formError && <div className="dashboard-error" role="alert">{formError}</div>}
            <IOCForm
              initialValue={formInitialValue}
              isSaving={isSaving}
              submitLabel={formMode === 'edit' ? 'Update IOC' : 'Create IOC'}
              onCancel={() => setFormMode(null)}
              onSubmit={saveIOC}
            />
          </section>
        </div>
      )}

      {viewingIOC && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingIOC(null)
        }}>
          <IOCDetails ioc={viewingIOC} onClose={() => setViewingIOC(null)} />
        </div>
      )}
    </main>
  )
}

export default IOCsPage
