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
        // Set user role from server
        setIsInterviewer(data.is_interviewer || false)
      } else if (data.type === 'error') {
        setError(data.message)
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
          time: data.time,
          status: data.status
        })
      }
    }

    ws.onerror = () => {
      setError('Ошибка подключения к серверу')
    }

    ws.onclose = () => {
      setIsConnected(false)
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

    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: messageInput,
    }))

    setMessageInput('')
  }

  const runCode = () => {
    if (!isInterviewer && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'run_code',
        code: code,
        question_id: currentQuestionId
      }))
    } else if (isInterviewer) {
      setError('Tech Lead cannot run code - only candidate can')
    }
  }

  const handleCodeChange = (newCode) => {
    setCode(newCode)
    sendCodeUpdate(newCode)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-secondary">Загрузка...</div>
  if (error) return <div className="flex items-center justify-center min-h-screen p-4 text-red-700 bg-red-100 border border-red-400 rounded">{error}</div>
  if (!session) return null

  return (
    <div className="min-h-screen p-6 bg-background fade-in">
      <div className="p-8 mx-auto bg-white rounded-lg max-w-7xl shadow-card">
        <div className="flex items-start justify-between pb-6 mb-8 border-b border-border">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-secondary">💻 Техническое собеседование</h1>
            <p className="font-medium text-secondary-light">
              👤 Кандидат: {session.candidate_name} | 📋 Шаблон: {session.template_name}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {isInterviewer ? '👨‍💼 Вы: Tech Lead' : '👤 Вы: Кандидат'}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border-2 ${isConnected ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Подключено' : 'Отключено'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <div className="p-6 mb-6 bg-white border rounded-lg shadow-card border-border">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-secondary">
                <span>📝</span>
                <span>Вопросы</span>
              </h3>
              <div className="pr-2 space-y-2 overflow-y-auto max-h-56">
                {session.questions?.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    onClick={() => setCurrentQuestionId(q.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      currentQuestionId === q.id 
                        ? 'border-primary bg-blue-50 shadow-md' 
                        : 'border-border bg-white hover:border-primary hover:shadow-sm'
                    }`}
                  >
                    <strong className={currentQuestionId === q.id ? 'text-primary' : 'text-secondary'}>
                      Вопрос {idx + 1}
                    </strong>
                    <p className="mt-1 text-sm text-secondary-light line-clamp-2">
                      {(q.text || '').substring(0, 60)}{(q.text || '').length > 60 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border rounded-lg shadow-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-secondary">
                  <span>💻</span>
                  <span>Код</span>
                </h3>
                <button 
                  disabled={isInterviewer}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isInterviewer 
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                      : 'text-white bg-primary hover:opacity-90'
                  }`} 
                  onClick={runCode}
                  title={isInterviewer ? 'Tech Lead cannot run code' : 'Run code'}
                >
                  <span>▶</span>
                  <span>Запустить</span>
                </button>
              </div>
              <textarea
                className={`w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary resize-none font-mono text-sm ${
                  isInterviewer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                style={{ minHeight: '350px' }}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isInterviewer}
                placeholder={isInterviewer ? 'Tech Lead view only' : 'Начните писать код на Python 3...'}
              />
              
              {codeOutput && (
                <div className="mt-4">
                  {codeOutput.stderr ? (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <strong className="text-sm text-red-700">❌ Ошибка:</strong>
                      <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-red-600">{codeOutput.stderr}</pre>
                    </div>
                  ) : (
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <strong className="text-sm text-green-700">✅ Вывод:</strong>
                      <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-green-600 whitespace-pre-wrap">{codeOutput.stdout || '(пусто)'}</pre>
                      {codeOutput.time && (
                        <p className="mt-3 text-xs font-semibold text-green-600">
                          ⏱ Время выполнения: {codeOutput.time}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-col p-6 bg-white border rounded-lg shadow-card border-border" style={{ height: 'calc(100vh - 200px)' }}>
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold text-secondary">
                <span>💬</span>
                <span>Чат</span>
              </h3>
              <div className="flex-1 p-4 mb-4 overflow-y-auto bg-white border-2 rounded-lg border-border min-h-96">
                {messages.length === 0 ? (
                  <div className="mt-20 text-center opacity-60">
                    <div className="mb-4 text-4xl">💬</div>
                    <p className="font-medium text-secondary">
                      Нет сообщений. Начните общение!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`mb-4 p-3 rounded-lg ${
                        msg.sender === 'interviewer' 
                          ? 'bg-blue-500 text-white ml-6' 
                          : 'bg-gray-100 text-secondary mr-6'
                      }`}
                    >
                      <div className="mb-1 text-xs font-semibold opacity-75">
                        {msg.sender === 'interviewer' ? '👨‍💼 Tech Lead' : '👤 Кандидат'}
                      </div>
                      <div className="text-sm leading-relaxed">{msg.message}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-3 bg-white border rounded-lg border-border text-secondary focus:outline-none focus:border-primary"
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Введите сообщение..."
                />
                <button className="flex items-center gap-2 px-4 py-3 font-medium text-white transition-all rounded-lg bg-primary hover:opacity-90" onClick={sendMessage}>
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
