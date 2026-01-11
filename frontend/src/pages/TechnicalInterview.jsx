import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getInterviewSession } from '../api/testApi'

function TechnicalInterview() {
  const { uniqueLink } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [code, setCode] = useState('')
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [codeOutput, setCodeOutput] = useState(null)
  const [isInterviewer, setIsInterviewer] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    loadSession()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [uniqueLink])

  useEffect(() => {
    if (session) {
      connectWebSocket()
    }
  }, [session])

  const loadSession = async () => {
    try {
      const data = await getInterviewSession(uniqueLink)
      setSession(data)
      if (data.questions?.length > 0) {
        setCurrentQuestionId(data.questions[0].id)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки сессии')
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/interview/${uniqueLink}/`
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'initial_data') {
        const questions = data.questions?.map(q => ({
          id: q.question__id,
          text: q.question__text,
          question_type: q.question__question_type
        })) || []
        setSession(prev => ({ ...prev, questions: questions }))
        if (questions.length > 0) {
          setCurrentQuestionId(questions[0].id)
        }
      } else if (data.type === 'code_update') {
        if (data.question_id === currentQuestionId) {
          setCode(data.code)
        }
      } else if (data.type === 'chat_message') {
        setMessages(prev => [...prev, {
          message: data.message,
          sender: data.sender,
          timestamp: new Date()
        }])
      } else if (data.type === 'code_result') {
        setCodeOutput({
          stdout: data.stdout,
          stderr: data.stderr,
          time: data.time
        })
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setError('Ошибка подключения к серверу')
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    }
  }

  const sendCodeUpdate = (newCode) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'code_update',
        code: newCode,
        question_id: currentQuestionId
      }))
    }
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const sender = isInterviewer ? 'interviewer' : 'candidate'
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: messageInput,
      sender: sender
    }))

    setMessageInput('')
  }

  const runCode = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'run_code',
        code: code,
        question_id: currentQuestionId
      }))
    }
  }

  const handleCodeChange = (newCode) => {
    setCode(newCode)
    sendCodeUpdate(newCode)
  }

  const currentQuestion = session?.questions?.find(q => (q.id || q.question__id) === currentQuestionId) || 
    session?.questions?.find((q, idx) => idx === 0)

  if (loading) return <div className="loading">Загрузка...</div>
  if (error) return <div className="error">{error}</div>
  if (!session) return null

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ marginBottom: '8px' }}>💻 Техническое собеседование</h1>
            <p className="text-secondary" style={{ fontSize: '15px', fontWeight: '500' }}>
              👤 Кандидат: {session.candidate_name} | 📋 Шаблон: {session.template_name}
            </p>
          </div>
          <div className="flex gap-2" style={{ alignItems: 'center', padding: '8px 16px', borderRadius: 'var(--radius)', background: isConnected ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: `2px solid ${isConnected ? '#10b981' : '#ef4444'}` }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#ef4444',
              boxShadow: isConnected ? '0 0 8px rgba(16, 185, 129, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)',
              animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none'
            }}></div>
            <span style={{ fontWeight: '600', color: isConnected ? '#065f46' : '#991b1b' }}>
              {isConnected ? 'Подключено' : 'Отключено'}
            </span>
          </div>
        </div>

        <div className="interview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Левая колонка - Вопросы и Код */}
          <div>
            {/* Список вопросов */}
            <div className="card mb-2 slide-in">
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span>
                <span>Вопросы</span>
              </h3>
              <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '8px' }}>
                {session.questions?.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    onClick={() => setCurrentQuestionId(q.id)}
                    className="slide-in"
                    style={{
                      padding: '16px',
                      marginBottom: '12px',
                      border: currentQuestionId === q.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: currentQuestionId === q.id 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' 
                        : 'var(--surface-elevated)',
                      transition: 'all 0.3s ease',
                      boxShadow: currentQuestionId === q.id ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 4px var(--shadow)'
                    }}
                    onMouseEnter={(e) => {
                      if (currentQuestionId !== q.id) {
                        e.currentTarget.style.transform = 'translateX(4px)'
                        e.currentTarget.style.boxShadow = '0 4px 8px var(--shadow-md)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentQuestionId !== q.id) {
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.boxShadow = '0 2px 4px var(--shadow)'
                      }
                    }}
                  >
                    <strong style={{ color: currentQuestionId === q.id ? 'var(--primary)' : 'var(--text)' }}>
                      Вопрос {idx + 1}
                    </strong>
                    <p className="text-secondary" style={{ fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
                      {(q.text || '').substring(0, 60)}{(q.text || '').length > 60 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Текущий вопрос */}
            {currentQuestion && (
              <div className="card mb-2 slide-in" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '2px solid var(--border-light)' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>❓</span>
                  <span>Текущий вопрос</span>
                </h3>
                <p style={{ lineHeight: '1.7', fontSize: '15px', marginBottom: '16px' }}>
                  {currentQuestion.text || currentQuestion.question__text || 'Вопрос не выбран'}
                </p>
                {currentQuestion.stdin && (
                  <div className="code-block mt-2">
                    <strong>Входные данные:</strong>
                    <pre>{currentQuestion.stdin}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Редактор кода */}
            <div className="card slide-in">
              <div className="flex-between mb-3">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <span>💻</span>
                  <span>Код</span>
                </h3>
                <button className="btn btn-primary" onClick={runCode} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>▶</span>
                  <span>Запустить</span>
                </button>
              </div>
              <textarea
                className="form-textarea code"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Начните писать код на Python 3..."
                style={{ minHeight: '350px', fontFamily: 'monospace', fontSize: '14px' }}
              />
              
              {codeOutput && (
                <div className="mt-3 fade-in">
                  {codeOutput.stderr ? (
                    <div className="error">
                      <strong>❌ Ошибка:</strong>
                      <pre style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.6' }}>{codeOutput.stderr}</pre>
                    </div>
                  ) : (
                    <div className="success">
                      <strong>✅ Вывод:</strong>
                      <pre style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{codeOutput.stdout || '(пусто)'}</pre>
                      {codeOutput.time && (
                        <p className="text-secondary" style={{ marginTop: '12px', fontSize: '13px', fontWeight: '600' }}>
                          ⏱ Время выполнения: {codeOutput.time}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - Чат */}
          <div>
            <div className="card slide-in" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💬</span>
                <span>Чат</span>
              </h3>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '16px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                minHeight: '400px',
                border: '2px solid var(--border-light)'
              }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '60px', opacity: 0.6 }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <p className="text-secondary" style={{ fontSize: '15px', fontWeight: '500' }}>
                      Нет сообщений. Начните общение!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="fade-in"
                      style={{
                        marginBottom: '16px',
                        padding: '14px 16px',
                        background: msg.sender === 'interviewer' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : 'var(--surface-elevated)',
                        color: msg.sender === 'interviewer' ? 'white' : 'var(--text)',
                        borderRadius: 'var(--radius-sm)',
                        marginLeft: msg.sender === 'candidate' ? '24px' : '0',
                        marginRight: msg.sender === 'interviewer' ? '24px' : '0',
                        boxShadow: '0 2px 8px var(--shadow)',
                        border: msg.sender === 'candidate' ? '2px solid var(--border-light)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '12px', opacity: msg.sender === 'interviewer' ? '0.9' : '0.7', marginBottom: '6px', fontWeight: '600' }}>
                        {msg.sender === 'interviewer' ? '👨‍💼 Tech Lead' : '👤 Кандидат'}
                      </div>
                      <div style={{ lineHeight: '1.6', fontSize: '14px' }}>{msg.message}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="form-input"
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Введите сообщение..."
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📤</span>
                  <span>Отправить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TechnicalInterview
