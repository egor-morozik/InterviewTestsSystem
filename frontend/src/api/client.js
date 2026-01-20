import axios from 'axios'

const API_BASE_URL = '/api'

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

const initCsrf = async() => {
    try {
        const resp = await apiClient.get('/csrf-token/')
        if (resp.data && resp.data.csrfToken) {
            apiClient.defaults.headers.common['X-CSRFToken'] = resp.data.csrfToken
        }
    } catch (e) {}
}

initCsrf()

export default apiClient