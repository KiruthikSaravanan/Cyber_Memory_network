import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadDashboardData } from '../services/dashboardService.js'

const INCIDENT_STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed']

function timestampValue(value) {
  const timestamp = value ? new Date(value).getTime() : 0
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function SeverityBadge({ severity }) {
  const normalized = (severity || 'Unknown').toLowerCase()
  return <span className={`severity-badge severity-${normalized}`}>{severity || 'Unknown'}</span>
}

function StatusBadge({ status }) {
  const normalized = (status || 'Unknown').toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-${normalized}`}>{status || 'Unknown'}</span>
}

function LoadingTable({ columns }) {
  return (
    <div className="dashboard-loading" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      Loading {columns}…
    </div>
  )
}

function DashboardPage() {
  const [collections, setCollections] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    const data = await loadDashboardData()
    setCollections(data)
    setHasLoaded(true)
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const incidents = collections?.incidents.data ?? null
  const alerts = collections?.alerts.data ?? null
  const iocs = collections?.iocs.data ?? null
  const failures = useMemo(
    () => Object.values(collections ?? {}).filter((collection) => collection.error).length,
    [collections],
  )

  const incidentStatuses = useMemo(() => {
    if (!incidents) return null
    return Object.fromEntries(
      INCIDENT_STATUSES.map((status) => [
        status,
        incidents.filter((incident) => incident.status?.toLowerCase() === status.toLowerCase()).length,
      ]),
    )
  }, [incidents])

  const summaryCards = [
    {
      label: 'Total Incidents',
      value: incidents?.length,
      detail:
        incidents === null
          ? 'Data unavailable.'
          : incidents.length === 0
            ? 'No incidents found.'
            : 'Recorded security incidents',
      tone: 'teal',
    },
    {
      label: 'Open Incidents',
      value: incidentStatuses?.Open,
      detail:
        incidentStatuses === null
          ? 'Data unavailable.'
          : incidentStatuses.Open === 0
            ? 'No open incidents.'
            : 'Require analyst attention',
      tone: 'blue',
    },
    {
      label: 'Critical Alerts',
      value: alerts?.filter((alert) => alert.severity?.toLowerCase() === 'critical').length,
      detail:
        alerts === null
          ? 'Data unavailable.'
          : alerts.length === 0
            ? 'No alerts found.'
            : `${alerts.length} total alert${alerts.length === 1 ? '' : 's'}`,
      tone: 'red',
    },
    {
      label: 'Total IOCs',
      value: iocs?.length,
      detail:
        iocs === null
          ? 'Data unavailable.'
          : iocs.length === 0
            ? 'No IOCs found.'
            : 'Tracked indicators',
      tone: 'violet',
    },
  ]

  const recentAlerts = alerts
    ? [...alerts].sort((a, b) => timestampValue(b.timestamp) - timestampValue(a.timestamp)).slice(0, 5)
    : []
  const recentIncidents = incidents
    ? [...incidents]
        .sort(
          (a, b) =>
            timestampValue(b.detection_time || b.created_at) -
            timestampValue(a.detection_time || a.created_at),
        )
        .slice(0, 5)
    : []

  return (
    <main className="page-content dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY OPERATIONS</span>
          <h1>Dashboard</h1>
          <p className="page-description">Current security posture across incidents, alerts, and indicators.</p>
        </div>
        <button
          className="refresh-button"
          disabled={isRefreshing}
          onClick={refresh}
          type="button"
        >
          <span aria-hidden="true">{isRefreshing ? '◌' : '↻'}</span>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {failures > 0 && (
        <div className="dashboard-error" role="alert">
          Unable to load dashboard data. Some sections may be unavailable. Check that the backend is running and refresh.
        </div>
      )}

      <section aria-label="Summary cards" className="summary-grid">
        {summaryCards.map((card) => (
          <article className={`summary-card summary-${card.tone}`} key={card.label}>
            <div className="summary-card-top">
              <span>{card.label}</span>
              <span aria-hidden="true" className="summary-indicator" />
            </div>
            {isLoading ? (
              <div aria-label={`Loading ${card.label}`} className="metric-skeleton" />
            ) : card.value === undefined ? (
              <div className="metric-unavailable">Unavailable</div>
            ) : (
              <div className="summary-value">{card.value.toLocaleString()}</div>
            )}
            <p>{isLoading ? 'Loading current data…' : card.detail}</p>
          </article>
        ))}
      </section>

      <div className="dashboard-content-grid">
        <section aria-labelledby="recent-alerts-title" className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">MONITORING</span>
              <h2 id="recent-alerts-title">Recent Alerts</h2>
            </div>
            {alerts && <span className="panel-count">{alerts.length} total</span>}
          </div>
          {isLoading ? (
            <LoadingTable columns="alerts" />
          ) : collections?.alerts.error ? (
            <p className="panel-message">Alerts are currently unavailable.</p>
          ) : recentAlerts.length === 0 ? (
            <p className="panel-message">No alerts found.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Alert Type</th>
                    <th>Severity</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="primary-cell">{alert.alert_type}</td>
                      <td><SeverityBadge severity={alert.severity} /></td>
                      <td>{alert.source || '—'}</td>
                      <td><StatusBadge status={alert.status} /></td>
                      <td className="date-cell">{formatDate(alert.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="security-overview-title" className="dashboard-panel overview-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">INCIDENT STATUS</span>
              <h2 id="security-overview-title">Security Overview</h2>
            </div>
          </div>
          {isLoading ? (
            <LoadingTable columns="overview" />
          ) : collections?.incidents.error ? (
            <p className="panel-message">Incident status counts are currently unavailable.</p>
          ) : (
            <div className="overview-list">
              {INCIDENT_STATUSES.map((status) => (
                <div className="overview-row" key={status}>
                  <span className={`overview-dot overview-${status.toLowerCase()}`} aria-hidden="true" />
                  <span>{status}</span>
                  <strong>{incidentStatuses?.[status] ?? 0}</strong>
                </div>
              ))}
              {incidents?.length === 0 && (
                <p className="overview-empty">No incidents found.</p>
              )}
              {iocs?.length === 0 && !collections?.iocs.error && (
                <p className="overview-empty">No IOCs found.</p>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="recent-incidents-title" className="dashboard-panel incidents-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CASE ACTIVITY</span>
              <h2 id="recent-incidents-title">Recent Incidents</h2>
            </div>
            {incidents && <span className="panel-count">{incidents.length} total</span>}
          </div>
          {isLoading ? (
            <LoadingTable columns="incidents" />
          ) : collections?.incidents.error ? (
            <p className="panel-message">Incidents are currently unavailable.</p>
          ) : recentIncidents.length === 0 ? (
            <p className="panel-message">No incidents found.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Attack Type</th>
                    <th>Detection Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((incident) => (
                    <tr key={incident.id}>
                      <td className="primary-cell">{incident.title}</td>
                      <td><SeverityBadge severity={incident.severity} /></td>
                      <td><StatusBadge status={incident.status} /></td>
                      <td>{incident.attack_type || '—'}</td>
                      <td className="date-cell">{formatDate(incident.detection_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {hasLoaded && failures === 0 && (
        <p className="dashboard-updated">Dashboard data is up to date.</p>
      )}
    </main>
  )
}

export default DashboardPage
