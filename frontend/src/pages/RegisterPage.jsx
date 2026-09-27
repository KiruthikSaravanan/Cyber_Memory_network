import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getAuthErrorMessage, registerUser } from '../services/auth.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage('Complete all fields to create your account.')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      await registerUser(username.trim(), email.trim(), password)
      setPassword('')
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Registration successful. You can now sign in.' },
      })
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Registration failed. Please try again.'))
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
        <h1>Create account</h1>
        <p>Register an analyst account for the security operations workspace.</p>

        {errorMessage && (
          <div className="form-message error-message" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="register-username">Username</label>
          <input
            autoComplete="username"
            id="register-username"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Choose a username"
            type="text"
            value={username}
          />

          <label htmlFor="register-email">Email</label>
          <input
            autoComplete="email"
            id="register-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="analyst@example.com"
            type="email"
            value={email}
          />

          <label htmlFor="register-password">Password</label>
          <input
            autoComplete="new-password"
            id="register-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />

          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Back to Login</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
