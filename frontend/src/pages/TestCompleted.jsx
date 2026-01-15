import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getTestSession } from '../api/testApi'

function TestCompleted() {
  const { uniqueLink } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [uniqueLink])

  const loadSession = async () => {
    try {
      const data = await getTestSession(uniqueLink)
      setSession(data)
    } catch (err) {
      console.error('Ошибка загрузки сессии:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-secondary">Загрузка...</div>

  return (
    <div className="min-h-screen bg-background fade-in p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-card p-12 text-center">
        <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-6xl text-white">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Тест завершён</h1>
        <p className="text-lg text-secondary-light font-medium mt-4 mb-8">
          {session?.candidate_name ? `Спасибо, ${session.candidate_name}!` : 'Спасибо!'}
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <p className="text-secondary font-medium leading-relaxed">
            Ваши ответы сохранены. Результаты будут отправлены вам по email.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestCompleted
