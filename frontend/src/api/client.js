import axios from 'axios'

const API_BASE_URL = '/api'

// Ensure axios reads the Django CSRF cookie and sends header
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Try to initialize CSRF token cookie and header for this client
const initCsrf = async () => {
  try {
    const resp = await apiClient.get('/csrf-token/')
    if (resp.data && resp.data.csrfToken) {
      apiClient.defaults.headers.common['X-CSRFToken'] = resp.data.csrfToken
    }
  } catch (e) {
    // ignore; requests may still work if cookie already present
  }
}

initCsrf()

export default apiClient

