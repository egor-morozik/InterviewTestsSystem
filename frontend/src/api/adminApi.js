import axios from 'axios'

const API_BASE = '/api/interviewer'

// Настройка axios для отправки CSRF токена
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withCredentials = true

// Получить CSRF токен
const getCsrfToken = async() => {
    try {
        const response = await axios.get('/api/csrf-token/')
        if (response.data && response.data.csrfToken) {
            axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken
        }
    } catch (e) {
        // Игнорируем ошибки для GET запросов, CSRF нужен только для POST/PATCH/DELETE
        console.log('CSRF token not available, continuing without it')
    }
}

// Дашборд
export const getDashboard = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/dashboard/`)
    return response.data
}

// Кандидаты
export const getCandidates = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/candidates/`)
    return response.data
}

export const createCandidate = async(candidateData) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/candidates/`, candidateData)
    return response.data
}

// Приглашения
export const getInvitations = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/invitations/`)
    return response.data
}

export const createInvitation = async(invitationData) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/invitations/`, invitationData)
    return response.data
}

export const getInvitation = async(id) => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/invitations/${id}/`)
    return response.data
}

export const updateInvitation = async(id, data) => {
    await getCsrfToken()
    const response = await axios.patch(`${API_BASE}/admin/invitations/${id}/`, data)
    return response.data
}

// Tech Leads
export const getTechLeads = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/tech-leads/`)
    return response.data
}

export const getCurrentUser = async() => {
    await getCsrfToken()
    const response = await axios.get('/api/interviewer/me/')
    return response.data
}

export const getUsers = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/users/`)
    return response.data
}

export const updateUser = async(id, data) => {
    await getCsrfToken()
    const response = await axios.patch(`${API_BASE}/admin/users/${id}/`, data)
    return response.data
}

export const createUser = async(data) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/users/`, data)
    return response.data
}

export const deleteUser = async(id) => {
    await getCsrfToken()
    const response = await axios.delete(`${API_BASE}/admin/users/${id}/`)
    return response.data
}

// Шаблоны тестов
export const getTestTemplates = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/templates/`)
    return response.data
}

// Questions & Tags
export const getQuestions = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/questions/`)
    return response.data
}

export const createQuestion = async(data) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/questions/`, data)
    return response.data
}

export const updateQuestion = async(id, data) => {
    await getCsrfToken()
    const response = await axios.patch(`${API_BASE}/admin/questions/${id}/`, data)
    return response.data
}

export const deleteQuestion = async(id) => {
    await getCsrfToken()
    const response = await axios.delete(`${API_BASE}/admin/questions/${id}/`)
    return response.data
}

export const getTags = async() => {
    await getCsrfToken()
    const response = await axios.get(`${API_BASE}/admin/tags/`)
    return response.data
}

export const createTag = async(data) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/tags/`, data)
    return response.data
}

export const createTestTemplate = async(data) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/templates/`, data)
    return response.data
}

export const updateTestTemplate = async(id, data) => {
    await getCsrfToken()
    const response = await axios.patch(`${API_BASE}/admin/templates/${id}/`, data)
    return response.data
}

export const deleteTestTemplate = async(id) => {
    await getCsrfToken()
    const response = await axios.delete(`${API_BASE}/admin/templates/${id}/`)
    return response.data
}

export const deleteInvitation = async(id) => {
    await getCsrfToken()
    const response = await axios.delete(`${API_BASE}/admin/invitations/${id}/`)
    return response.data
}

export const updateCandidate = async(id, data) => {
    await getCsrfToken()
    const response = await axios.patch(`${API_BASE}/admin/candidates/${id}/`, data)
    return response.data
}

export const deleteCandidate = async(id) => {
    await getCsrfToken()
    const response = await axios.delete(`${API_BASE}/admin/candidates/${id}/`)
    return response.data
}

export const generateQuestion = async(description) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/admin/generate-question/`, {
        description,
    })
    return response.data
}

export const login = async(data) => {
    await getCsrfToken()
    const response = await axios.post(`${API_BASE}/login/`, data)
    return response.data
}