import api from './api.js'

export async function loginUser(usernameOrEmail, password) {
  const response = await api.post('/auth/login', {
    username_or_email: usernameOrEmail,
    password,
  })
  return response.data
}

export async function registerUser(username, email, password) {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
  })
  return response.data
}

export function getAuthErrorMessage(error, fallbackMessage) {
  if (!error.response) {
    return 'Unable to connect to the server. Check that the backend is running and try again.'
  }

  const { status, data } = error.response
  if (status === 401) {
    return 'The username/email or password is incorrect.'
  }
  if (status === 409 && typeof data?.detail === 'string') {
    return data.detail
  }
  if (status === 422 && Array.isArray(data?.detail)) {
    const messages = data.detail
      .map((item) => item.msg)
      .filter((message) => typeof message === 'string')
    return messages.length > 0 ? messages.join('. ') : 'Please check the information you entered.'
  }
  return fallbackMessage
}
