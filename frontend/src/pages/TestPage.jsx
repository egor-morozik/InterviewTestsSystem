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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-secondary">Загрузка...</div>
  if (error) return <div className="flex items-center justify-center min-h-screen bg-red-100 border border-red-400 text-red-700 rounded p-4">{error}</div>
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

  const getTimerColor = () => {
    if (remainingTime === null) return 'text-secondary'
    if (remainingTime < 60) return 'text-red-600 font-bold'
    if (remainingTime < 300) return 'text-yellow-600 font-bold'
    return 'text-secondary'
  }

  return (
    <div className="min-h-screen bg-background fade-in p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-card p-8">
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-secondary mb-2">{session.template_name}</h1>
            <p className="text-secondary-light font-medium">
              👤 Кандидат: {session.candidate_name}
            </p>
          </div>
          {remainingTime !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${getTimerColor()} bg-gray-100`}>
              <span>⏱</span>
              <span>{formatTime(remainingTime)}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-secondary font-semibold">
              Вопрос {currentIndex + 1} из {session.questions.length}
            </span>
            <span className="text-secondary font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-bg-light border-2 border-border rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-secondary mb-6 leading-relaxed">{question?.text}</h2>

          {question?.question_type === 'text' && (
            <div className="mb-6">
              <textarea
                className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary resize-none"
                rows="6"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Введите ваш ответ"
              />
            </div>
          )}

          {question?.question_type === 'code' && (
            <div>
              <div className="mb-6">
                <textarea
                  className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary resize-none font-mono text-sm"
                  rows="8"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введите ваш код на Python 3"
                />
              </div>
              {question.stdin && (
                <div className="bg-gray-50 border border-border rounded-lg p-4 mb-6">
                  <strong className="text-secondary">Входные данные:</strong>
                  <pre className="text-sm text-secondary-light mt-2 font-mono overflow-x-auto">{question.stdin}</pre>
                </div>
              )}
            </div>
          )}

          {(question?.question_type === 'single_choice' || question?.question_type === 'multiple_choice') && (
            <div className="space-y-3">
              {question?.choices?.map((choice) => (
                <label key={choice.id} className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-bg-light transition-colors">
                  <input
                    type={question.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                    checked={selectedChoices.includes(choice.id)}
                    onChange={() => handleChoiceChange(choice.id, question.question_type === 'multiple_choice')}
                    name="choice"
                    className="w-5 h-5 text-primary cursor-pointer"
                  />
                  <span className="ml-3 text-secondary font-medium">{choice.text}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <div>
            {!isFirst && (
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border border-border text-secondary-light hover:bg-gray-50" onClick={() => handleSubmit('prev')}>
                <span>←</span>
                <span>Назад</span>
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {!isLast && (
              <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-primary hover:opacity-90 transition-all" onClick={() => handleSubmit('next')}>
                <span>Далее</span>
                <span>→</span>
              </button>
            )}
            <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-red-600 hover:opacity-90 transition-all" onClick={() => handleSubmit('finish')}>
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
