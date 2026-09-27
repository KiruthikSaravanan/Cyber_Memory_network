import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getAuthErrorMessage, loginUser } from '../services/auth.js'

function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    const normalizedUsernameOrEmail = usernameOrEmail.trim()
    if (!normalizedUsernameOrEmail) {
      setErrorMessage('Enter your username or email.')
      return
    }
    if (!password) {
      setErrorMessage('Enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await loginUser(normalizedUsernameOrEmail, password)
      login(response.user)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Login failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
      setPassword('')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card">
        <Link className="auth-brand" to="/login" aria-label="Cyber Memory Network home">
          <span className="brand-mark" aria-hidden="true">CM</span>
          <span>Cyber Memory Network</span>
        </Link>
        <span className="eyebrow">SECURE WORKSPACE</span>
        <h1>Welcome back</h1>
        <p>Sign in to continue to your security operations workspace.</p>

        {location.state?.successMessage && (
          <div className="form-message success-message" role="status">
            {location.state.successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="form-message error-message" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="username-or-email">Username or Email</label>
          <input
            autoComplete="username"
            id="username-or-email"
            name="username_or_email"
            onChange={(event) => setUsernameOrEmail(event.target.value)}
            placeholder="analyst or analyst@example.com"
            type="text"
            value={usernameOrEmail}
          />

          <label htmlFor="login-password">Password</label>
          <input
            autoComplete="current-password"
            id="login-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            type="password"
            value={password}
          />

          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          New to the network? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
