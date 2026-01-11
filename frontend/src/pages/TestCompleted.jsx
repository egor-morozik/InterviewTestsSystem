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

  if (loading) return <div className="loading">Загрузка...</div>

  return (
    <div className="container fade-in">
      <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '80px auto', padding: '48px' }}>
        <div style={{ 
          fontSize: '80px', 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          animation: 'scaleIn 0.5s ease-out'
        }}>
          <span style={{ color: 'white', fontSize: '60px' }}>✓</span>
        </div>
        <h1 style={{ marginBottom: '16px' }}>Тест завершён</h1>
        <p className="text-secondary" style={{ fontSize: '18px', marginTop: '16px', marginBottom: '32px', fontWeight: '500' }}>
          {session?.candidate_name ? `Спасибо, ${session.candidate_name}!` : 'Спасибо!'}
        </p>
        <div className="success" style={{ marginBottom: '32px' }}>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6' }}>
            Ваши ответы сохранены. Результаты будут отправлены вам по email.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default TestCompleted
