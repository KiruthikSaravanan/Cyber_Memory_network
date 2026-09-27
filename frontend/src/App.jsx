import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import IncidentsPage from './pages/IncidentsPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import IOCsPage from './pages/IOCsPage.jsx'
import LogsPage from './pages/Logs.jsx'
import MitrePage from './pages/Mitre.jsx'
import ResponseActionsPage from './pages/ResponseActions.jsx'
import CyberMemoryPage from './pages/CyberMemory.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

const pages = [
  { path: 'incidents', title: 'Incident Management', description: 'Review and manage security incidents.' },
  { path: 'alerts', title: 'Alert Management', description: 'Review security alerts.' },
  { path: 'iocs', title: 'IOC Management', description: 'Manage indicators of compromise.' },
  { path: 'logs', title: 'Security Logs', description: 'Review ingested security logs.' },
  { path: 'mitre', title: 'MITRE ATT&CK', description: 'Review incident technique mappings.' },
  { path: 'response-actions', title: 'Response Actions', description: 'Track analyst response actions.' },
  { path: 'cyber-memory', title: 'Cyber Memory', description: 'Browse stored incident knowledge.' },
]

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/iocs" element={<IOCsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/mitre" element={<MitrePage />} />
        <Route path="/response-actions" element={<ResponseActionsPage />} />
        <Route path="/cyber-memory" element={<CyberMemoryPage />} />
        {pages.filter((page) => !['incidents', 'alerts', 'iocs', 'logs', 'mitre', 'response-actions', 'cyber-memory'].includes(page.path)).map((page) => (
          <Route
            key={page.path}
            path={`/${page.path}`}
            element={<PlaceholderPage title={page.title} description={page.description} />}
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
