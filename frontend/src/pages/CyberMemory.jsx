import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createMemoryFromIncident,
  deleteCyberMemory,
  getCyberMemories,
  getCyberMemory,
  getCyberMemoryErrorMessage,
  getIncidentCyberMemory,
  searchCyberMemory,
  searchCyberMemoryByAttackType,
  updateCyberMemory,
} from '../services/cyberMemoryService.js'

const EDITABLE_FIELDS = [
  ['attack_type', 'Attack Type'],
  ['summary', 'Summary'],
  ['investigation_findings', 'Investigation Findings'],
  ['final_solution', 'Final Solution'],
  ['lessons_learned', 'Lessons Learned'],
]

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function truncate(value, maxLength = 100) {
  if (!value) return '—'
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}…` : value
}

function MemoryDetails({ memory, onClose }) {
  return (
    <section aria-labelledby="cyber-memory-details-title" aria-modal="true" className="incident-dialog memory-details-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">CYBER MEMORY RECORD</span>
          <h2 id="cyber-memory-details-title">Memory #{memory.id}</h2>
        </div>
        <button aria-label="Close Cyber Memory details" className="incident-icon-button" onClick={onClose} type="button">×</button>
      </div>
      <dl className="memory-metadata">
        <div><dt>Incident ID</dt><dd>{memory.incident_id}</dd></div>
        <div><dt>Attack Type</dt><dd>{memory.attack_type || '—'}</dd></div>
        <div><dt>Created At</dt><dd>{formatDate(memory.created_at)}</dd></div>
      </dl>
      <div className="memory-content-sections">
        {EDITABLE_FIELDS.slice(1).map(([field, label]) => (
          <section className="memory-content-section" key={field}>
            <h3>{label}</h3>
            <p>{memory[field] || 'No information recorded.'}</p>
          </section>
        ))}
      </div>
    </section>
  )
}

function MemoryForm({ initialMemory, isSaving, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => Object.fromEntries(
    EDITABLE_FIELDS.map(([field]) => [field, initialMemory?.[field] || '']),
  ))
  const [validationError, setValidationError] = useState('')

  async function submitForm(event) {
    event.preventDefault()
    if (!form.attack_type.trim()) {
      setValidationError('Attack Type is required.')
      return
    }
    await onSubmit(Object.fromEntries(
      EDITABLE_FIELDS.map(([field]) => [field, form[field].trim()]),
    ))
  }

  return (
    <form className="memory-form" onSubmit={submitForm}>
      {EDITABLE_FIELDS.map(([field, label]) => (
        <div className="incident-field" key={field}>
          <label htmlFor={`memory-${field}`}>
            {label}{field === 'attack_type' ? <span aria-hidden="true"> *</span> : null}
          </label>
          {field === 'attack_type' ? (
            <input
              id={`memory-${field}`}
              onChange={(event) => {
                setForm((current) => ({ ...current, [field]: event.target.value }))
                setValidationError('')
              }}
              required
              type="text"
              value={form[field]}
            />
          ) : (
            <textarea
              id={`memory-${field}`}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
              rows={field === 'summary' ? 3 : 4}
              value={form[field]}
            />
          )}
        </div>
      ))}
      {validationError && <p className="form-message error-message" role="alert">{validationError}</p>}
      <div className="incident-form-actions">
        <button className="incident-secondary-button" disabled={isSaving} onClick={onCancel} type="button">Cancel</button>
        <button className="incident-primary-button" disabled={isSaving} type="submit">
          {isSaving ? 'Updating memory…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function MemoryTable({ memories, onView, onEdit, onDelete, busy }) {
  if (memories.length === 0) return <p className="panel-message">No Cyber Memories found.</p>
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table cyber-memory-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Incident ID</th>
            <th>Attack Type</th>
            <th>Summary</th>
            <th>Final Solution</th>
            <th>Lessons Learned</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {memories.map((memory) => (
            <tr key={memory.id}>
              <td>{memory.id}</td>
              <td>{memory.incident_id}</td>
              <td className="primary-cell">{memory.attack_type || '—'}</td>
              <td className="memory-preview-cell" title={memory.summary || ''}>{truncate(memory.summary)}</td>
              <td className="memory-preview-cell" title={memory.final_solution || ''}>{truncate(memory.final_solution)}</td>
              <td className="memory-preview-cell" title={memory.lessons_learned || ''}>{truncate(memory.lessons_learned)}</td>
              <td className="date-cell">{formatDate(memory.created_at)}</td>
              <td>
                <div className="incident-row-actions">
                  <button className="incident-action-button" disabled={busy} onClick={() => onView(memory.id)} type="button">View</button>
                  <button className="incident-action-button" disabled={busy} onClick={() => onEdit(memory.id)} type="button">Edit</button>
                  <button className="incident-action-button incident-delete-button" disabled={busy} onClick={() => onDelete(memory)} type="button">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function positiveInteger(value) {
  const trimmed = value.trim()
  return /^\d+$/.test(trimmed) && Number.isSafeInteger(Number(trimmed)) && Number(trimmed) > 0
}

function CyberMemoryPage() {
  const [memories, setMemories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingMemoryId, setDeletingMemoryId] = useState(null)
  const [loadingMemoryId, setLoadingMemoryId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createIncidentId, setCreateIncidentId] = useState('')
  const [createError, setCreateError] = useState('')
  const [editingMemory, setEditingMemory] = useState(null)
  const [editError, setEditError] = useState('')
  const [viewingMemory, setViewingMemory] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [attackType, setAttackType] = useState('')
  const [activeSearch, setActiveSearch] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [incidentLookupId, setIncidentLookupId] = useState('')
  const [incidentMemory, setIncidentMemory] = useState(null)
  const [incidentLookupError, setIncidentLookupError] = useState('')
  const [isLookingUpIncident, setIsLookingUpIncident] = useState(false)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const mutationInProgress = useRef(false)

  const displayedMemories = useMemo(
    () => [...memories].sort((a, b) => a.id - b.id),
    [memories],
  )

  const loadMemories = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setPageError('')
    try {
      const data = await getCyberMemories()
      if (!Array.isArray(data)) throw new Error('Unexpected Cyber Memory response')
      setMemories(data)
      setActiveSearch(null)
    } catch (error) {
      setPageError(getCyberMemoryErrorMessage(error, 'list'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  async function refreshMemories() {
    if (isLoading || isRefreshing || isCreating || isUpdating || deletingMemoryId !== null || isSearching) return
    setIsRefreshing(true)
    setSuccessMessage('')
    await loadMemories(false)
  }

  async function createFromIncident(event) {
    event.preventDefault()
    if (!positiveInteger(createIncidentId)) {
      setCreateError('Incident ID must be a positive whole number.')
      return
    }
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setIsCreating(true)
    setCreateError('')
    setPageError('')
    setSuccessMessage('')
    try {
      const result = await createMemoryFromIncident(Number(createIncidentId))
      setSuccessMessage(result.message || `Cyber Memory created from incident ${createIncidentId}.`)
      setIncidentLookupError('')
      setShowCreateForm(false)
      setCreateIncidentId('')
      await loadMemories(false)
    } catch (error) {
      setCreateError(getCyberMemoryErrorMessage(error, 'create'))
    } finally {
      mutationInProgress.current = false
      setIsCreating(false)
    }
  }

  async function viewMemory(id) {
    setLoadingMemoryId(id)
    setPageError('')
    setSuccessMessage('')
    try {
      setViewingMemory(await getCyberMemory(id))
    } catch (error) {
      setPageError(getCyberMemoryErrorMessage(error, 'details'))
    } finally {
      setLoadingMemoryId(null)
    }
  }

  async function editMemory(id) {
    setLoadingMemoryId(id)
    setEditError('')
    setPageError('')
    setSuccessMessage('')
    try {
      setEditingMemory(await getCyberMemory(id))
    } catch (error) {
      setPageError(getCyberMemoryErrorMessage(error, 'details'))
    } finally {
      setLoadingMemoryId(null)
    }
  }

  async function saveMemory(data) {
    if (mutationInProgress.current || !editingMemory) return
    mutationInProgress.current = true
    setIsUpdating(true)
    setEditError('')
    setPageError('')
    setSuccessMessage('')
    try {
      await updateCyberMemory(editingMemory.id, data)
      setEditingMemory(null)
      setSuccessMessage('Cyber Memory updated successfully.')
      await loadMemories(false)
    } catch (error) {
      setEditError(getCyberMemoryErrorMessage(error, 'update'))
    } finally {
      mutationInProgress.current = false
      setIsUpdating(false)
    }
  }

  async function deleteMemory(memory) {
    if (!window.confirm('Are you sure you want to delete this Cyber Memory?')) return
    if (mutationInProgress.current) return
    mutationInProgress.current = true
    setDeletingMemoryId(memory.id)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteCyberMemory(memory.id)
      if (viewingMemory?.id === memory.id) setViewingMemory(null)
      setSuccessMessage('Cyber Memory deleted successfully.')
      await loadMemories(false)
      if (incidentMemory?.id === memory.id) {
        setIncidentMemory(null)
        setIncidentLookupError('No Cyber Memory found for this incident.')
      }
    } catch (error) {
      setPageError(getCyberMemoryErrorMessage(error, 'delete'))
    } finally {
      mutationInProgress.current = false
      setDeletingMemoryId(null)
    }
  }

  async function submitKeywordSearch(event) {
    event.preventDefault()
    const value = keyword.trim()
    if (!value) {
      setPageError('Enter a keyword to search Cyber Memory.')
      return
    }
    setIsSearching(true)
    setPageError('')
    setSuccessMessage('')
    try {
      const response = await searchCyberMemory(value)
      if (!Array.isArray(response.results) || typeof response.total_results !== 'number') {
        throw new Error('Unexpected Cyber Memory search response')
      }
      setMemories(response.results)
      setActiveSearch({ label: `Keyword results for “${response.keyword}”`, count: response.total_results })
    } catch (error) {
      setPageError(getCyberMemoryErrorMessage(error, 'keyword'))
    } finally {
      setIsSearching(false)
    }
  }

  async function submitAttackSearch(event) {
    event.preventDefault()
    const value = attackType.trim()
    if (!value) {
      setPageError('Enter an attack type to search.')
      return
    }
    setIsSearching(true)
    setPageError('')
    setSuccessMessage('')
    try {
      const response = await searchCyberMemoryByAttackType(value)
      if (!Array.isArray(response.results) || typeof response.total_results !== 'number') {
        throw new Error('Unexpected attack type search response')
      }
      setMemories(response.results)
      setActiveSearch({ label: `Attack type: ${response.attack_type}`, count: response.total_results })
    } catch (error) {
      setPageError(getCyberMemoryErrorMessage(error, 'attack-type'))
    } finally {
      setIsSearching(false)
    }
  }

  async function clearSearch() {
    if (isSearching) return
    setKeyword('')
    setAttackType('')
    setActiveSearch(null)
    setSuccessMessage('')
    await loadMemories()
  }

  async function findIncidentMemory(event) {
    event.preventDefault()
    if (!positiveInteger(incidentLookupId)) {
      setIncidentMemory(null)
      setIncidentLookupError('Incident ID must be a positive whole number.')
      return
    }
    setIsLookingUpIncident(true)
    setIncidentLookupError('')
    setIncidentMemory(null)
    try {
      const memory = await getIncidentCyberMemory(Number(incidentLookupId))
      if (!memory || typeof memory !== 'object' || !Number.isInteger(memory.id)) {
        throw new Error('Unexpected incident Cyber Memory response')
      }
      setIncidentMemory(memory)
    } catch (error) {
      setIncidentLookupError(getCyberMemoryErrorMessage(error, 'incident'))
    } finally {
      setIsLookingUpIncident(false)
    }
  }

  const busy = isCreating || isUpdating || deletingMemoryId !== null || isSearching || loadingMemoryId !== null

  return (
    <main className="page-content incidents-page cyber-memory-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY KNOWLEDGE</span>
          <h1>Cyber Memory</h1>
          <p className="page-description">Store and reuse knowledge from previously investigated security incidents.</p>
        </div>
        <div className="incident-heading-actions">
          <button className="incident-secondary-button" disabled={isLoading || isRefreshing || busy} onClick={refreshMemories} type="button">
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            className="incident-primary-button"
            disabled={busy}
            onClick={() => {
              setShowCreateForm((current) => !current)
              setCreateError('')
              setSuccessMessage('')
            }}
            type="button"
          >
            Create Memory from Incident
          </button>
        </div>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}

      {showCreateForm && (
        <section aria-labelledby="create-memory-title" className="dashboard-panel memory-create-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CLOSED INCIDENT REQUIRED</span>
              <h2 id="create-memory-title">Create Memory from Incident</h2>
            </div>
            <button aria-label="Close create memory form" className="incident-icon-button" disabled={isCreating} onClick={() => setShowCreateForm(false)} type="button">×</button>
          </div>
          <form className="memory-create-form" onSubmit={createFromIncident}>
            <div className="incident-field">
              <label htmlFor="create-memory-incident-id">Incident ID <span aria-hidden="true">*</span></label>
              <input
                id="create-memory-incident-id"
                min={1}
                onChange={(event) => {
                  setCreateIncidentId(event.target.value)
                  setCreateError('')
                }}
                required
                step={1}
                type="number"
                value={createIncidentId}
              />
            </div>
            <button className="incident-primary-button" disabled={isCreating} type="submit">
              {isCreating ? 'Creating memory…' : 'Create Memory'}
            </button>
          </form>
          {createError && <p className="memory-inline-error" role="alert">{createError}</p>}
        </section>
      )}

      <section aria-label="Cyber Memory list" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">INCIDENT KNOWLEDGE BASE</span>
            <h2>{activeSearch?.label || 'Cyber Memories'}</h2>
          </div>
          {!isLoading && <span className="panel-count">{activeSearch ? `${activeSearch.count} results` : `${memories.length} total`}</span>}
        </div>
        {isLoading || isRefreshing || isSearching ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            {isSearching ? 'Searching Cyber Memory…' : 'Loading Cyber Memories…'}
          </div>
        ) : pageError && memories.length === 0 && !activeSearch ? (
          <p className="panel-message">Cyber Memory records are unavailable.</p>
        ) : (
          <MemoryTable
            busy={busy}
            memories={displayedMemories}
            onDelete={deleteMemory}
            onEdit={editMemory}
            onView={viewMemory}
          />
        )}
      </section>

      <div className="memory-search-grid">
        <section aria-labelledby="keyword-search-title" className="dashboard-panel memory-search-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">FULL-TEXT FIELD SEARCH</span>
              <h2 id="keyword-search-title">Search Cyber Memory</h2>
            </div>
          </div>
          <form className="memory-search-form" onSubmit={submitKeywordSearch}>
            <div className="incident-field">
              <label htmlFor="cyber-memory-keyword">Keyword</label>
              <input id="cyber-memory-keyword" onChange={(event) => setKeyword(event.target.value)} placeholder="Search saved incident knowledge" required type="search" value={keyword} />
            </div>
            <div className="memory-search-actions">
              <button className="incident-primary-button" disabled={isSearching} type="submit">{isSearching ? 'Searching…' : 'Search'}</button>
              <button className="incident-secondary-button" disabled={isSearching || isLoading} onClick={clearSearch} type="button">Clear Search</button>
            </div>
          </form>
        </section>

        <section aria-labelledby="attack-type-search-title" className="dashboard-panel memory-search-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">EXACT ATTACK TYPE</span>
              <h2 id="attack-type-search-title">Search by Attack Type</h2>
            </div>
          </div>
          <form className="memory-search-form" onSubmit={submitAttackSearch}>
            <div className="incident-field">
              <label htmlFor="cyber-memory-attack-type">Attack Type</label>
              <input id="cyber-memory-attack-type" onChange={(event) => setAttackType(event.target.value)} placeholder="For example, Brute Force" required type="text" value={attackType} />
            </div>
            <div className="memory-search-actions">
              <button className="incident-primary-button" disabled={isSearching} type="submit">{isSearching ? 'Searching…' : 'Search Attack Type'}</button>
              <button className="incident-secondary-button" disabled={isSearching || isLoading} onClick={clearSearch} type="button">Clear</button>
            </div>
          </form>
        </section>
      </div>

      <section aria-labelledby="incident-memory-lookup-title" className="dashboard-panel incident-list-panel memory-lookup-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">INCIDENT ASSOCIATION</span>
            <h2 id="incident-memory-lookup-title">Find Memory by Incident</h2>
          </div>
        </div>
        <form className="memory-search-form" onSubmit={findIncidentMemory}>
          <div className="incident-field">
            <label htmlFor="lookup-memory-incident-id">Incident ID</label>
            <input id="lookup-memory-incident-id" min={1} onChange={(event) => setIncidentLookupId(event.target.value)} placeholder="Enter an incident ID" required step={1} type="number" value={incidentLookupId} />
          </div>
          <button className="incident-primary-button" disabled={isLookingUpIncident} type="submit">
            {isLookingUpIncident ? 'Finding memory…' : 'Find Memory'}
          </button>
        </form>
        {incidentLookupError && <p className="memory-inline-error" role="alert">{incidentLookupError}</p>}
        {incidentMemory && (
          <article className="memory-lookup-result">
            <div className="memory-lookup-heading memory-lookup-metadata">
              <h3>{incidentMemory.attack_type || 'Cyber Memory'} <span>· Incident #{incidentMemory.incident_id} · Memory #{incidentMemory.id}</span></h3>
              <span className="date-cell">{formatDate(incidentMemory.created_at)}</span>
            </div>
            <div className="memory-content-sections">
              {EDITABLE_FIELDS.slice(1).map(([field, label]) => (
                <section className="memory-content-section" key={field}>
                  <h3>{label}</h3>
                  <p>{incidentMemory[field] || 'No information recorded.'}</p>
                </section>
              ))}
            </div>
          </article>
        )}
      </section>

      {editingMemory && (
        <div className="incident-modal-backdrop">
          <section aria-labelledby="edit-memory-title" aria-modal="true" className="incident-dialog memory-edit-dialog" role="dialog">
            <div className="incident-dialog-heading">
              <div>
                <span className="panel-kicker">EDIT KNOWLEDGE RECORD</span>
                <h2 id="edit-memory-title">Edit Cyber Memory #{editingMemory.id}</h2>
              </div>
              <button aria-label="Close edit memory form" className="incident-icon-button" disabled={isUpdating} onClick={() => setEditingMemory(null)} type="button">×</button>
            </div>
            {editError && <div className="dashboard-error" role="alert">{editError}</div>}
            <MemoryForm
              initialMemory={editingMemory}
              isSaving={isUpdating}
              onCancel={() => setEditingMemory(null)}
              onSubmit={saveMemory}
            />
          </section>
        </div>
      )}

      {loadingMemoryId !== null && (
        <div className="incident-modal-backdrop">
          <section aria-label="Loading Cyber Memory details" aria-modal="true" className="incident-dialog" role="dialog">
            <div className="dashboard-loading" role="status">
              <span aria-hidden="true" className="loading-spinner" />
              Loading memory details…
            </div>
          </section>
        </div>
      )}

      {viewingMemory && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingMemory(null)
        }}>
          <MemoryDetails memory={viewingMemory} onClose={() => setViewingMemory(null)} />
        </div>
      )}
    </main>
  )
}

export default CyberMemoryPage
