import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLog, getLogErrorMessage, getLogs, ingestLogs } from '../services/logService.js'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function LogDetails({ log, onClose }) {
  const preferredFields = ['id', 'timestamp', 'username', 'source_ip', 'event_type', 'created_at']
  const fields = useMemo(() => {
    const entries = preferredFields
      .filter((field) => Object.hasOwn(log, field))
      .map((field) => [field, log[field]])
    const additionalFields = Object.entries(log).filter(([field]) => !preferredFields.includes(field))
    return [...entries, ...additionalFields]
  }, [log])

  return (
    <section aria-label="Security log details" aria-modal="true" className="incident-dialog" role="dialog">
      <div className="incident-dialog-heading">
        <div>
          <span className="panel-kicker">SECURITY EVENT</span>
          <h2>Log Details</h2>
        </div>
        <button aria-label="Close log details" className="incident-icon-button" onClick={onClose} type="button">
          ×
        </button>
      </div>
      <dl className="incident-detail-grid">
        {fields.map(([field, value]) => (
          <div className={`incident-detail-item${typeof value === 'object' && value !== null ? ' log-detail-wide' : ''}`} key={field}>
            <dt>{field.replaceAll('_', ' ')}</dt>
            <dd>
              {field === 'timestamp' || field === 'created_at'
                ? formatDate(value)
                : typeof value === 'object' && value !== null
                  ? <pre className="log-raw-data">{displayValue(value)}</pre>
                  : displayValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function LogsPage() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isIngesting, setIsIngesting] = useState(false)
  const [loadingLogId, setLoadingLogId] = useState(null)
  const [viewingLog, setViewingLog] = useState(null)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const ingestionInProgress = useRef(false)

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => {
      const timestampDifference = new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      return (Number.isNaN(timestampDifference) ? 0 : timestampDifference) || b.id - a.id
    }),
    [logs],
  )

  const loadLogs = useCallback(async ({ showLoading = true, clearSuccess = true } = {}) => {
    if (showLoading) setIsLoading(true)
    setPageError('')
    if (clearSuccess) setSuccessMessage('')
    try {
      const data = await getLogs()
      if (!Array.isArray(data)) throw new Error('Unexpected logs response')
      setLogs(data)
    } catch (error) {
      setPageError(getLogErrorMessage(error, 'load'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  async function handleRefresh() {
    if (isLoading || isRefreshing || isIngesting) return
    setIsRefreshing(true)
    await loadLogs({ showLoading: false })
  }

  async function handleIngest() {
    if (ingestionInProgress.current || isIngesting || isRefreshing) return
    ingestionInProgress.current = true
    setIsIngesting(true)
    setPageError('')
    setSuccessMessage('')
    try {
      const result = await ingestLogs()
      const count = Number.isInteger(result?.inserted) ? result.inserted : null
      setSuccessMessage(
        count === null
          ? 'Security log ingestion completed successfully.'
          : `Security log ingestion completed successfully. ${count} new log${count === 1 ? '' : 's'} stored.`,
      )
      await loadLogs({ showLoading: false, clearSuccess: false })
    } catch (error) {
      setPageError(getLogErrorMessage(error, 'ingest'))
    } finally {
      ingestionInProgress.current = false
      setIsIngesting(false)
    }
  }

  async function handleView(logId) {
    setPageError('')
    setViewingLog(null)
    setLoadingLogId(logId)
    try {
      setViewingLog(await getLog(logId))
    } catch (error) {
      setPageError(getLogErrorMessage(error, 'load details'))
    } finally {
      setLoadingLogId(null)
    }
  }

  return (
    <main className="page-content incidents-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY OPERATIONS</span>
          <h1>Security Logs</h1>
          <p className="page-description">View and ingest security event logs used by the detection engine.</p>
        </div>
        <div className="incident-heading-actions">
          <button
            className="incident-secondary-button"
            disabled={isLoading || isRefreshing || isIngesting}
            onClick={handleRefresh}
            type="button"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            className="incident-primary-button"
            disabled={isIngesting || isRefreshing}
            onClick={handleIngest}
            type="button"
          >
            {isIngesting ? 'Ingesting logs…' : 'Ingest Security Logs'}
          </button>
        </div>
      </div>

      {pageError && <div className="dashboard-error" role="alert">{pageError}</div>}
      {successMessage && <div className="form-message success-message" role="status">{successMessage}</div>}

      <section aria-label="Security logs" className="dashboard-panel incident-list-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">EVENT ACTIVITY</span>
            <h2>Security Logs</h2>
          </div>
          {!isLoading && <span className="panel-count">{logs.length} total</span>}
        </div>
        {isLoading ? (
          <div className="dashboard-loading" role="status">
            <span aria-hidden="true" className="loading-spinner" />
            Loading logs…
          </div>
        ) : pageError && logs.length === 0 ? (
          <p className="panel-message">Security log records are unavailable.</p>
        ) : sortedLogs.length === 0 ? (
          <p className="panel-message">No security logs found.</p>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table log-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Username</th>
                  <th>Source IP</th>
                  <th>Event Type</th>
                  {sortedLogs.some((log) => Object.hasOwn(log, 'created_at')) && <th>Created At</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td className="date-cell">{formatDate(log.timestamp)}</td>
                    <td>{log.username || '—'}</td>
                    <td>{log.source_ip || '—'}</td>
                    <td><span className="event-type-value">{log.event_type || '—'}</span></td>
                    {sortedLogs.some((item) => Object.hasOwn(item, 'created_at')) && (
                      <td className="date-cell">{formatDate(log.created_at)}</td>
                    )}
                    <td>
                      <button
                        className="incident-action-button"
                        disabled={loadingLogId !== null}
                        onClick={() => handleView(log.id)}
                        type="button"
                      >
                        {loadingLogId === log.id ? 'Loading…' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {loadingLogId !== null && (
        <div className="incident-modal-backdrop">
          <section aria-label="Loading log details" aria-modal="true" className="incident-dialog" role="dialog">
            <div className="dashboard-loading" role="status">
              <span aria-hidden="true" className="loading-spinner" />
              Loading log details…
            </div>
          </section>
        </div>
      )}

      {viewingLog && (
        <div className="incident-modal-backdrop" onClick={(event) => {
          if (event.target === event.currentTarget) setViewingLog(null)
        }}>
          <LogDetails log={viewingLog} onClose={() => setViewingLog(null)} />
        </div>
      )}
    </main>
  )
}

export default LogsPage
