import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createResponseAction,
  deleteResponseAction,
  getIncidentResponseActions,
  getResponseAction,
  getResponseActionErrorMessage,
  getResponseActions,
  updateResponseAction,
} from '../services/responseActionService.js'

const STATUSES = ['Pending', 'In Progress', 'Completed']

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function StatusBadge({ value }) {
  const normalized = (value || 'Unknown').toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-${normalized}`}>{value || 'Unknown'}</span>
}

function ActionForm({ initialValue, isSaving, submitLabel, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialValue)
  const [validationError, setValidationError] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (validationError) setValidationError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    const action = form.action.trim()
    if (!action) {
      setValidationError('Action is required.')
      return
    }
    if (action.length > 255) {
      setValidationError('Action must be 255 characters or fewer.')
      return
    }
    if (!STATUSES.includes(form.status)) {
      setValidationError('Choose a valid status.')
      return
    }
    if (!/^\d+$/.test(form.incident_id.trim()) || !Number.isSafeInteger(Number(form.incident_id)) || Number(form.incident_id) <= 0) {
      setValidationError('Incident ID must be a positive whole number.')
      return
    }

    await onSubmit({
      action,
      description: form.description.trim() || null,
      status: form.status,
      incident_id: Number(form.incident_id),
    })
  }

  return (
    <form className="incident-form" onSubmit={submitForm}>
      <div className="incident-form-grid">
        <div className="incident-field incident-field-wide">
          <label htmlFor="response-action">Action <span aria-hidden="true">*</span></label>
          <input
            id="response-action"
            maxLength={255}
            name="action"
            onChange={updateField}
            required
            type="text"
            value={form.action}
          />
        </div>
        <div className="incident-field">
          <label htmlFor="response-action-status">Status <span aria-hidden="true">*</span></label>
          <select
            id="response-action-status"
            name="status"
            onChange={updateField}
            required
            value={form.status}
          >
            {STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="incident-field">
          <label htmlFor="response-action-incident">Incident ID <span aria-hidden="true">*</span></label>
          <input
            id="response-action-incident"
            min={1}
            name="incident_id"
            onChange={updateField}
            required
            step={1}
            type="number"
            value={form.incident_id}
          />
        </div>
        <div className="incident-field incident-field-wide">
          <label htmlFor="response-action-description">Description</label>
          <textarea
            id="response-action-description"
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

function ActionDetails({ responseAction, onClose }) {
  const fields = [
    ['ID', responseAction.id],
    ['Action', responseAction.action],
    ['Description', responseAction.description],
    ['Status', <StatusBadge key="status" value={responseAction.status} />],
    ['Incident ID', responseAction.incident_id],
    ['Created At', formatDate(responseAction.created_at)],
  ]

  return (
    <section aria-label="Response action details" aria-modal="true" className="incident-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">ACTION DETAILS</span>
          <h2>{responseAction.action}</h2>
        </div>
        <button aria-label="Close action details" className="incident-icon-button" onClick={onClose} type="button">
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

function ResponseActionsPage() {
  const [responseActions, setResponseActions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingActionId, setDeletingActionId] = useState(null)
  const [loadingActionId, setLoadingActionId] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [formInitialValue, setFormInitialValue] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [viewingAction, setViewingAction] = useState(null)
  const [incidentIdInput, setIncidentIdInput] = useState('')
  const [incidentActions, setIncidentActions] = useState(null)
  const [isLoadingIncidentActions, setIsLoadingIncidentActions] = useState(false)
  const [incidentActionsError, setIncidentActionsError] = useState('')
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutationInProgress = useRef(false)

  const sortedActions = useMemo(
    () => [...responseActions].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime() || b.id - a.id,
    ),
    [responseActions],
  )

  const loadActions = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setPageError('')
    try {
      const data = await getResponseActions()
      if (!Array.isArray(data)) throw new Error('Unexpected response action response')
      setResponseActions(data)
    } catch (error) {
      setPageError(getResponseActionErrorMessage(error, 'list'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadActions()
  }, [loadActions])

  function openCreate() {
    setPageError('')
    setFormError('')
    setSuccessMessage('')
    setEditingId(null)
    setFormInitialValue({ action: '', description: '', status: 'Pending', incident_id: '' })
    setFormMode('create')
  }

  async function openEdit(actionId) {
    setPageError('')
    setFormError('')
    setSuccessMessage('')
    setIsSaving(true)
    try {
      const responseAction = await getResponseAction(actionId)
      setEditingId(actionId)
      setFormInitialValue({
        action: responseAction.action,
        description: responseAction.description || '',
        status: responseAction.status,
        incident_id: String(responseAction.incident_id),
      })
      setFormMode('edit')
    } catch (error) {
      setPageError(getResponseActionErrorMessage(error, 'details'))
    } finally {
      setIsSaving(false)
    }
  }

  async function openDetails(actionId) {
    setPageError('')
    setSuccessMessage('')
    setLoadingActionId(actionId)
    try {
      setViewingAction(await getResponseAction(actionId))
    } catch (error) {
      setPageError(getResponseActionErrorMessage(error, 'details'))
    } finally {
      setLoadingActionId(null)
    }
  }

  async function loadForIncident(incidentId) {
    setIncidentActionsError('')
    setIsLoadingIncidentActions(true)
    try {
      const data = await getIncidentResponseActions(incidentId)
      if (!Array.isArray(data)) throw new Error('Unexpected incident response action response')
      setIncidentActions(data)
    } catch (error) {
      setIncidentActions(null)
      setIncidentActionsError(getResponseActionErrorMessage(error, 'incident'))
    } finally {
      setIsLoadingIncidentActions(false)
    }
  }

  async function searchIncidentActions(event) {
    event.preventDefault()
    const value = incidentIdInput.trim()
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
      setIncidentActions(null)
      setIncidentActionsError('Enter a valid positive Incident ID.')
      return
    }
    await loadForIncident(Number(value))
  }

  async function saveAction(payload) {
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setIsSaving(true)
    setFormError('')
    setPageError('')
    try {
      if (formMode === 'edit') {
        await updateResponseAction(editingId, payload)
        setSuccessMessage('Response action updated successfully.')
      } else {
        await createResponseAction(payload)
        setSuccessMessage('Response action created successfully.')
      }
      setFormMode(null)
      await loadActions(false)
      if (incidentActions !== null && incidentActionsError === '') {
        const searchedId = Number(incidentIdInput)
        if (Number.isSafeInteger(searchedId) && searchedId > 0) await loadForIncident(searchedId)
      }
    } catch (error) {
      setFormError(getResponseActionErrorMessage(error, formMode === 'edit' ? 'update' : 'create'))
    } finally {
      mutationInProgress.current = false
      setIsSaving(false)
    }
  }

  async function removeAction(responseAction) {
    if (!window.confirm('Are you sure you want to delete this response action?')) return
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setDeletingActionId(responseAction.id)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteResponseAction(responseAction.id)
      setSuccessMessage('Response action deleted successfully.')
      if (viewingAction?.id === responseAction.id) setViewingAction(null)
      await loadActions(false)
      if (incidentActions !== null && Number(incidentIdInput) === responseAction.incident_id) {
        await loadForIncident(responseAction.incident_id)
      }
    } catch (error) {
      setPageError(getResponseActionErrorMessage(error, 'delete'))
    } finally {
      mutationInProgress.current = false
      setDeletingActionId(null)
    }
  }

  async function refreshActions() {
    if (isLoading || isRefreshing || isSaving || deletingActionId !== null) return
    setIsRefreshing(true)
    setSuccessMessage('')
    await loadActions(false)
    if (incidentActions !== null && Number(incidentIdInput) > 0) {
      await loadForIncident(Number(incidentIdInput))
    }
  }

  return (
    <main className="page-content incidents-page response-actions-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY OPERATIONS</span>
          <h1>Response Actions</h1>
          <p className="page-description">Record and track the actions taken during security incident response.</p>
        </div>
        <div className="incident-heading-actions">
          <button
            className="incident-secondary-button"
            disabled={isLoading || isRefreshing || isSaving || deletingActionId !== null}
            onClick={refreshActions}
            type="button"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="incident-primary-button" disabled={isSaving || deletingActionId !== null} onClick={openCreate} type="button">
            + Create Response Action
          </button>
        </div>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}

      <section aria-label="Response actions" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">RESPONSE TRACKING</span>
            <h2>Response Actions</h2>
          </div>
          {!isLoading && <span className="panel-count">{responseActions.length} total</span>}
        </div>
        {isLoading ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading response actions…
          </div>
        ) : pageError && responseActions.length === 0 ? (
          <p className="panel-message">Response action records are unavailable.</p>
        ) : sortedActions.length === 0 ? (
          <p className="panel-message">No response actions found.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table response-action-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Incident ID</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedActions.map((responseAction) => (
                  <tr key={responseAction.id}>
                    <td>{responseAction.id}</td>
                    <td className="primary-cell">{responseAction.action}</td>
                    <td className="response-description-cell">{responseAction.description || '—'}</td>
                    <td><StatusBadge value={responseAction.status} /></td>
                    <td>{responseAction.incident_id}</td>
                    <td className="date-cell">{formatDate(responseAction.created_at)}</td>
                    <td>
                      <div className="incident-row-actions">
                        <button className="incident-action-button" disabled={loadingActionId !== null || isSaving || deletingActionId !== null} onClick={() => openDetails(responseAction.id)} type="button">
                          {loadingActionId === responseAction.id ? 'Loading…' : 'View'}
                        </button>
                        <button className="incident-action-button" disabled={loadingActionId !== null || isSaving || deletingActionId !== null} onClick={() => openEdit(responseAction.id)} type="button">
                          {isSaving && formMode === null ? 'Loading…' : 'Edit'}
                        </button>
                        <button className="incident-action-button incident-delete-button" disabled={loadingActionId !== null || isSaving || deletingActionId !== null} onClick={() => removeAction(responseAction)} type="button">
                          {deletingActionId === responseAction.id ? 'Deleting…' : 'Delete'}
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

      <section aria-label="Incident response actions" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">INCIDENT ACTIVITY</span>
            <h2>Incident Response Actions</h2>
          </div>
        </div>
        <form className="mitre-search-form" onSubmit={searchIncidentActions}>
          <div className="incident-field">
            <label htmlFor="response-actions-incident-id">Incident ID</label>
            <input
              id="response-actions-incident-id"
              min={1}
              onChange={(event) => setIncidentIdInput(event.target.value)}
              placeholder="Enter an incident ID"
              required
              step={1}
              type="number"
              value={incidentIdInput}
            />
          </div>
          <button className="incident-primary-button" disabled={isLoadingIncidentActions} type="submit">
            {isLoadingIncidentActions ? 'Loading actions…' : 'View Actions'}
          </button>
        </form>
        {incidentActionsError && <p className="mitre-inline-error" role="alert">{incidentActionsError}</p>}
        {isLoadingIncidentActions ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading incident response actions…
          </div>
        ) : incidentActions !== null && incidentActions.length === 0 ? (
          <p className="panel-message">No response actions found for this incident.</p>
        ) : incidentActions && incidentActions.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table incident-response-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {incidentActions.map((responseAction) => (
                  <tr key={responseAction.id}>
                    <td className="primary-cell">{responseAction.action}</td>
                    <td className="response-description-cell">{responseAction.description || '—'}</td>
                    <td><StatusBadge value={responseAction.status} /></td>
                    <td className="date-cell">{formatDate(responseAction.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {formMode && formInitialValue && (
        <div className="incident-modal-backdrop">
          <section aria-labelledby="response-action-form-title" aria-modal="true" className="incident-dialog incident-form-dialog" role="dialog">
            <div className="incident-dialog-heading">
              <div>
                <span className="panel-kicker">{formMode === 'edit' ? 'UPDATE ACTION' : 'NEW ACTION'}</span>
                <h2 id="response-action-form-title">{formMode === 'edit' ? 'Edit Response Action' : 'Create Response Action'}</h2>
              </div>
              <button aria-label="Close response action form" className="incident-icon-button" disabled={isSaving} onClick={() => setFormMode(null)} type="button">
                ×
              </button>
            </div>
            {formError && <div className="dashboard-error" role="alert">{formError}</div>}
            <ActionForm
              initialValue={formInitialValue}
              isSaving={isSaving}
              submitLabel={formMode === 'edit' ? 'Update Action' : 'Create Action'}
              onCancel={() => setFormMode(null)}
              onSubmit={saveAction}
            />
          </section>
        </div>
      )}

      {loadingActionId !== null && (
        <div className="incident-modal-backdrop">
          <section aria-label="Loading action details" aria-modal="true" className="incident-dialog" role="dialog">
            <div className="dashboard-loading" role="status">
              <span aria-hidden="true" className="loading-spinner" />
              Loading action details…
            </div>
          </section>
        </div>
      )}

      {viewingAction && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingAction(null)
        }}>
          <ActionDetails responseAction={viewingAction} onClose={() => setViewingAction(null)} />
        </div>
      )}
    </main>
  )
}

export default ResponseActionsPage
