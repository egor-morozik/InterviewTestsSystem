import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTestSession, getQuestion, submitAnswer, logTabSwitch, finishTest as finishTestApi } from '../api/testApi'

function TestPage() {
  const { uniqueLink, questionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [selectedChoices, setSelectedChoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [remainingTime, setRemainingTime] = useState(null)
  const [switches, setSwitches] = useState(0)

  useEffect(() => {
    loadSession()
  }, [uniqueLink])

  useEffect(() => {
    if (questionId && session) {
      loadQuestion()
    }
  }, [questionId, session])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = document.hidden ? 'hidden' : 'visible'
      logTabSwitch(uniqueLink, state).then(() => {
        if (state === 'hidden') {
          setSwitches(prev => prev + 1)
        }
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [uniqueLink])

  const finishTest = useCallback(async () => {
    try {
      if (questionId) {
        let answerValue = answer
        if (question?.question_type === 'multiple_choice' || question?.question_type === 'single_choice') {
          answerValue = JSON.stringify(selectedChoices)
        }
        await submitAnswer(uniqueLink, questionId, answerValue, switches)
      }
      await finishTestApi(uniqueLink)
      navigate(`/completed/${uniqueLink}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка завершения теста')
    }
  }, [uniqueLink, questionId, answer, question, selectedChoices, switches, navigate])

  useEffect(() => {
    if (session?.remaining_time !== null && session?.remaining_time !== undefined && remainingTime !== null) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer)
            finishTest()
            return 0
          }
          return prev !== null ? prev - 1 : null
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [session?.remaining_time, remainingTime, finishTest])

  const loadSession = async () => {
    try {
      const data = await getTestSession(uniqueLink)
      setSession(data)
      setRemainingTime(data.remaining_time)
      
      if (data.completed) {
        navigate(`/completed/${uniqueLink}`)
        return
      }

      if (!questionId && data.questions?.length > 0) {
        navigate(`/test/${uniqueLink}/question/${data.questions[0].id}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки теста')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestion = async () => {
    try {
      const data = await getQuestion(uniqueLink, questionId)
      setQuestion(data.question)
      setAnswer(data.current_answer?.response || '')
      
      if (data.question?.question_type === 'multiple_choice' || data.question?.question_type === 'single_choice') {
        try {
          const saved = JSON.parse(data.current_answer?.response || '[]')
          setSelectedChoices(Array.isArray(saved) ? saved : [])
        } catch {
          setSelectedChoices([])
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки вопроса')
    }
  }

  const handleChoiceChange = (choiceId, isMultiple) => {
    if (isMultiple) {
      setSelectedChoices(prev => 
        prev.includes(choiceId) 
          ? prev.filter(id => id !== choiceId)
          : [...prev, choiceId]
      )
    } else {
      setSelectedChoices([choiceId])
    }
  }

  const handleSubmit = async (action) => {
    try {
      let answerValue = answer
      if (question?.question_type === 'multiple_choice' || question?.question_type === 'single_choice') {
        answerValue = JSON.stringify(selectedChoices)
      }

      await submitAnswer(uniqueLink, questionId, answerValue, switches)

      if (action === 'next') {
        const currentIndex = session.questions.findIndex(q => q.id === parseInt(questionId))
        if (currentIndex < session.questions.length - 1) {
          navigate(`/test/${uniqueLink}/question/${session.questions[currentIndex + 1].id}`)
        } else {
          finishTest()
        }
      } else if (action === 'prev') {
        const currentIndex = session.questions.findIndex(q => q.id === parseInt(questionId))
        if (currentIndex > 0) {
          navigate(`/test/${uniqueLink}/question/${session.questions[currentIndex - 1].id}`)
        }
      } else if (action === 'finish') {
        finishTest()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения ответа')
    }
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (error) return <div className="error">{error}</div>
  if (!session || !question) return null

  const currentIndex = session.questions.findIndex(q => q.id === parseInt(questionId))
  const isFirst = currentIndex === 0
  const isLast = currentIndex === session.questions.length - 1
  const progress = ((currentIndex + 1) / session.questions.length) * 100

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerClass = () => {
    if (remainingTime === null) return 'timer'
    if (remainingTime < 60) return 'timer danger'
    if (remainingTime < 300) return 'timer warning'
    return 'timer'
  }

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ marginBottom: '8px' }}>{session.template_name}</h1>
            <p className="text-secondary" style={{ fontSize: '15px', fontWeight: '500' }}>
              👤 Кандидат: {session.candidate_name}
            </p>
          </div>
          {remainingTime !== null && (
            <div className={getTimerClass()}>
              <span>⏱</span>
              <span>{formatTime(remainingTime)}</span>
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="flex-between mb-2">
            <span className="text-secondary" style={{ fontWeight: '600', fontSize: '15px' }}>
              Вопрос {currentIndex + 1} из {session.questions.length}
            </span>
            <span className="text-secondary" style={{ fontWeight: '600', fontSize: '15px' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '2px solid var(--border-light)' }}>
          <h2 style={{ marginBottom: '24px', lineHeight: '1.4' }}>{question?.text}</h2>

          {question?.question_type === 'text' && (
            <div className="form-group">
              <textarea
                className="form-textarea"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Введите ваш ответ"
              />
            </div>
          )}

          {question?.question_type === 'code' && (
            <div>
              <div className="form-group">
                <textarea
                  className="form-textarea code"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введите ваш код на Python 3"
                />
              </div>
              {question.stdin && (
                <div className="code-block">
                  <strong>Входные данные:</strong>
                  <pre>{question.stdin}</pre>
                </div>
              )}
            </div>
          )}

          {(question?.question_type === 'single_choice' || question?.question_type === 'multiple_choice') && (
            <div className="form-group">
              {question?.choices?.map((choice) => (
                <label key={choice.id} className="choice-item">
                  <input
                    type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                    checked={selectedChoices.includes(choice.id)}
                    onChange={() => handleChoiceChange(choice.id, question.question_type === 'multiple_choice')}
                    name="choice"
                  />
                  <span>{choice.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex-between" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid var(--border-light)' }}>
          <div>
            {!isFirst && (
              <button className="btn btn-outline" onClick={() => handleSubmit('prev')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>←</span>
                <span>Назад</span>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {!isLast && (
              <button className="btn btn-primary" onClick={() => handleSubmit('next')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Далее</span>
                <span>→</span>
              </button>
            )}
            <button className="btn btn-danger" onClick={() => handleSubmit('finish')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span>
              <span>Завершить тест</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestPage
