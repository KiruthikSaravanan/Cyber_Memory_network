import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/incidents', label: 'Incidents', icon: '◈' },
  { to: '/alerts', label: 'Alerts', icon: '◎' },
  { to: '/iocs', label: 'IOCs', icon: '⌁' },
  { to: '/logs', label: 'Logs', icon: '≋' },
  { to: '/mitre', label: 'MITRE ATT&CK', icon: '⌘' },
  { to: '/response-actions', label: 'Response Actions', icon: '↗' },
  { to: '/cyber-memory', label: 'Cyber Memory', icon: '▤' },
]

function AppLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">CM</div>
          <div className="brand-copy">
            <span className="brand-name">Cyber Memory</span>
            <span className="brand-subtitle">SECURITY OPERATIONS</span>
          </div>
        </div>
        <div className="nav-label">Workspace</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              aria-label={item.label}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              key={item.to}
              to={item.to}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          Cyber Memory Network
          <br />
          Enterprise Defense
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          {user?.username && <span className="current-user">{user.username}</span>}
          <span className="environment-tag">
            <span className="status-dot" aria-hidden="true" />
            Development environment
          </span>
          <button className="logout-button" onClick={handleLogout} type="button">
            Logout
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
