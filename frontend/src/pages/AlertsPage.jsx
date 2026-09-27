import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createAlert,
  deleteAlert,
  getAlert,
  getAlertErrorMessage,
  getAlerts,
  updateAlert,
} from '../services/alertService.js'

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed']
const FORM_FIELDS = [
  { name: 'alert_type', label: 'Alert Type', required: true },
  { name: 'severity', label: 'Severity', required: true, options: SEVERITIES },
  { name: 'timestamp', label: 'Timestamp', type: 'datetime-local', required: true },
  { name: 'source', label: 'Source' },
  { name: 'description', label: 'Description', multiline: true },
  { name: 'status', label: 'Status', required: true, options: STATUSES },
  { name: 'incident_id', label: 'Incident ID (optional)', type: 'number' },
]

function currentLocalDateTime() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
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

function normalizeAlert(alert) {
  return {
    alert_type: alert.alert_type || '',
    severity: alert.severity || 'Medium',
    timestamp: localDateTime(alert.timestamp),
    source: alert.source || '',
    description: alert.description || '',
    status: alert.status || 'Open',
    incident_id: alert.incident_id == null ? '' : String(alert.incident_id),
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

function AlertForm({ initialValue, isSaving, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialValue)
  const [validationError, setValidationError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (validationError) setValidationError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    const alertType = form.alert_type.trim()
    if (!alertType) {
      setValidationError('Alert type is required.')
      return
    }
    if (alertType.length > 100) {
      setValidationError('Alert type must be 100 characters or fewer.')
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
    const timestamp = new Date(form.timestamp)
    if (!form.timestamp || Number.isNaN(timestamp.getTime())) {
      setValidationError('Enter a valid timestamp.')
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
      alert_type: alertType,
      severity: form.severity,
      timestamp: timestamp.toISOString(),
      source: form.source.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
      incident_id: incidentId,
    })
  }

  return (
    <form className="incident-form" onSubmit={submitForm}>
      <div className="incident-form-grid">
        {FORM_FIELDS.map((field) => (
          <div
            className={`incident-field${field.multiline ? ' incident-field-wide' : ''}`}
            key={field.name}
          >
            <label htmlFor={`alert-${field.name}`}>
              {field.label}{field.required && <span aria-hidden="true"> *</span>}
            </label>
            {field.options ? (
              <select
                id={`alert-${field.name}`}
                name={field.name}
                onChange={updateField}
                required={field.required}
                value={form[field.name]}
              >
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : field.multiline ? (
              <textarea
                id={`alert-${field.name}`}
                name={field.name}
                onChange={updateField}
                rows={3}
                value={form[field.name]}
              />
            ) : (
              <input
                id={`alert-${field.name}`}
                maxLength={field.name === 'alert_type' ? 100 : undefined}
                min={field.name === 'incident_id' ? 1 : undefined}
                name={field.name}
                onChange={updateField}
                required={field.required}
                step={field.name === 'incident_id' ? 1 : undefined}
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
          {isSaving ? 'Saving…' : 'Save Alert'}
        </button>
      </div>
    </form>
  )
}

function AlertDetails({ alert, onClose }) {
  const fields = [
    ['ID', alert.id],
    ['Alert Type', alert.alert_type],
    ['Severity', <SeverityBadge key="severity" value={alert.severity} />],
    ['Timestamp', formatDate(alert.timestamp)],
    ['Source', alert.source],
    ['Description', alert.description],
    ['Status', <StatusBadge key="status" value={alert.status} />],
    ['Incident ID', alert.incident_id],
  ]

  return (
    <section aria-label="Alert details" aria-modal="true" className="incident-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">ALERT DETAILS</span>
          <h2>{alert.alert_type}</h2>
        </div>
        <button aria-label="Close alert details" className="incident-icon-button" onClick={onClose} type="button">
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

function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [busyDeleteId, setBusyDeleteId] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [formInitialValue, setFormInitialValue] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [viewingAlert, setViewingAlert] = useState(null)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutationInProgress = useRef(false)

  const sortedAlerts = useMemo(
    () => [...alerts].sort(
      (a, b) => dateValue(b.timestamp) - dateValue(a.timestamp) || b.id - a.id,
    ),
    [alerts],
  )

  const loadList = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setPageError('')
    try {
      const data = await getAlerts()
      if (!Array.isArray(data)) throw new Error('Unexpected alerts response')
      setAlerts(data)
    } catch (error) {
      setPageError(getAlertErrorMessage(error, 'load'))
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
    setFormInitialValue({
      alert_type: '',
      severity: 'Medium',
      timestamp: currentLocalDateTime(),
      source: '',
      description: '',
      status: 'Open',
      incident_id: '',
    })
    setFormMode('create')
  }

  async function openEdit(alertId) {
    setPageError('')
    setFormError('')
    setSuccessMessage('')
    setIsSaving(true)
    try {
      const alert = await getAlert(alertId)
      setEditingId(alertId)
      setFormInitialValue(normalizeAlert(alert))
      setFormMode('edit')
    } catch (error) {
      setPageError(getAlertErrorMessage(error, 'load'))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetails(alertId) {
    setPageError('')
    setSuccessMessage('')
    try {
      setViewingAlert(await getAlert(alertId))
    } catch (error) {
      setPageError(getAlertErrorMessage(error, 'load'))
    }
  }

  async function saveAlert(payload) {
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setIsSaving(true)
    setFormError('')
    try {
      if (formMode === 'edit') {
        await updateAlert(editingId, payload)
        setSuccessMessage('Alert updated successfully.')
      } else {
        await createAlert(payload)
        setSuccessMessage('Alert created successfully.')
      }
      setFormMode(null)
      await loadList(false)
    } catch (error) {
      setFormError(getAlertErrorMessage(error, formMode === 'edit' ? 'update' : 'create'))
    } finally {
      mutationInProgress.current = false
      setIsSaving(false)
    }
  }

  async function removeAlert(alert) {
    if (!window.confirm('Are you sure you want to delete this alert?')) return
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setBusyDeleteId(alert.id)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteAlert(alert.id)
      setSuccessMessage('Alert deleted successfully.')
      if (viewingAlert?.id === alert.id) setViewingAlert(null)
      await loadList(false)
    } catch (error) {
      setPageError(getAlertErrorMessage(error, 'delete'))
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
          <h1>Alert Management</h1>
          <p className="page-description">Review and manage detected security alerts.</p>
        </div>
        <div className="incident-heading-actions">
          <button className="incident-secondary-button" disabled={isLoading || isRefreshing} onClick={refreshList} type="button">
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="incident-primary-button" onClick={openCreate} type="button">
            + Create Alert
          </button>
        </div>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}
      {formError && !formMode && <div className="dashboard-error" role="alert">{formError}</div>}

      <section aria-label="Alert list" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">MONITORING</span>
            <h2>Alerts</h2>
          </div>
          {!isLoading && <span className="panel-count">{alerts.length} total</span>}
        </div>
        {isLoading ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading alerts…
          </div>
        ) : pageError && alerts.length === 0 ? (
          <p className="panel-message">Alert records are unavailable.</p>
        ) : sortedAlerts.length === 0 ? (
          <p className="panel-message">No alerts found.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table alert-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Alert Type</th>
                  <th>Severity</th>
                  <th>Timestamp</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Incident ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.id}</td>
                    <td className="primary-cell">
                      <button className="incident-title-button" onClick={() => openDetails(alert.id)} type="button">
                        {alert.alert_type}
                      </button>
                    </td>
                    <td><SeverityBadge value={alert.severity} /></td>
                    <td className="date-cell">{formatDate(alert.timestamp)}</td>
                    <td>{alert.source || '—'}</td>
                    <td className="alert-description-cell">{alert.description || '—'}</td>
                    <td><StatusBadge value={alert.status} /></td>
                    <td>{alert.incident_id ?? '—'}</td>
                    <td>
                      <div className="incident-row-actions">
                        <button className="incident-action-button" disabled={isSaving || busyDeleteId !== null} onClick={() => openEdit(alert.id)} type="button">
                          Edit
                        </button>
                        <button className="incident-action-button incident-delete-button" disabled={busyDeleteId !== null || isSaving} onClick={() => removeAlert(alert)} type="button">
                          {busyDeleteId === alert.id ? 'Deleting…' : 'Delete'}
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
          <section aria-labelledby="alert-form-title" aria-modal="true" className="incident-dialog incident-form-dialog" role="dialog">
            <div className="incident-dialog-heading">
              <div>
                <span className="panel-kicker">{formMode === 'edit' ? 'UPDATE ALERT' : 'NEW ALERT'}</span>
                <h2 id="alert-form-title">{formMode === 'edit' ? 'Edit Alert' : 'Create Alert'}</h2>
              </div>
              <button aria-label="Close alert form" className="incident-icon-button" disabled={isSaving} onClick={() => setFormMode(null)} type="button">
                ×
              </button>
            </div>
            {formError && <div className="dashboard-error" role="alert">{formError}</div>}
            <AlertForm
              initialValue={formInitialValue}
              isSaving={isSaving}
              onCancel={() => setFormMode(null)}
              onSubmit={saveAlert}
            />
          </section>
        </div>
      )}

      {viewingAlert && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingAlert(null)
        }}>
          <AlertDetails alert={viewingAlert} onClose={() => setViewingAlert(null)} />
        </div>
      )}
    </main>
  )
}

export default AlertsPage
