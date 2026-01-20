import apiClient from './client'

export const getTestSession = async(uniqueLink) => {
    const response = await apiClient.get(`/candidate/test/${uniqueLink}/session/`)
    return response.data
}

export const getQuestion = async(uniqueLink, questionId) => {
    const response = await apiClient.get(`/candidate/test/${uniqueLink}/question/${questionId}/`)
    return response.data
}

export const submitAnswer = async(uniqueLink, questionId, answer, switches = 0) => {
    const response = await apiClient.post(`/candidate/test/${uniqueLink}/question/${questionId}/answer/`, {
        response: answer,
        switches: switches
    })
    return response.data
}

export const finishTest = async(uniqueLink) => {
    const response = await apiClient.post(`/candidate/test/${uniqueLink}/finish/`)
    return response.data
}

export const logTabSwitch = async(uniqueLink, state) => {
    const response = await apiClient.post(`/candidate/log-switch/${uniqueLink}/`, {
        state: state
    })
    return response.data
}

export const getInterviewSession = async(uniqueLink) => {
    const response = await apiClient.get(`/candidate/session/${uniqueLink}/`)
    return response.data
}

export const getTestResults = async() => {
    const response = await apiClient.get(`/candidate/results/`)
    return response.data
}

export const getTestResultDetail = async(invitationId) => {
    const response = await apiClient.get(`/candidate/results/${invitationId}/`)
    return response.data
}

export const saveQuestionFeedback = async(invitationId, questionId, score, comment) => {
    const response = await apiClient.post(`/candidate/results/${invitationId}/question/${questionId}/feedback/`, {
        score,
        comment
    })
    return response.data
}