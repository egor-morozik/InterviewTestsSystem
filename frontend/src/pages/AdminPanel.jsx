import { useState, useEffect } from 'react'
import {
  getDashboard,
  getCandidates,
  getInvitations,
  createInvitation,
  getTestTemplates,
  getTechLeads,
  getQuestions,
  createQuestion,
  getTags,
  createTestTemplate,
  generateQuestion,
} from '../api/adminApi'
import { getTestResults, getTestResultDetail, saveQuestionFeedback } from '../api/testApi'
import CreateInvitationModal from '../components/CreateInvitationModal'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [invitations, setInvitations] = useState([])
  const [templates, setTemplates] = useState([])
  const [questions, setQuestions] = useState([])
  const [tags, setTags] = useState([])
  const [techLeads, setTechLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [results, setResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'dashboard') {
        const data = await getDashboard()
        setDashboard(data)
      } else if (activeTab === 'templates') {
        const data = await getTestTemplates()
        setTemplates(data)
      } else if (activeTab === 'questions') {
        const [qs, tg] = await Promise.all([getQuestions(), getTags()])
        setQuestions(qs)
        setTags(tg)
      } else if (activeTab === 'candidates') {
        const data = await getCandidates()
        setCandidates(data)
      } else if (activeTab === 'invitations') {
        const [invData, templatesData, techLeadsData] = await Promise.all([
          getInvitations(),
          getTestTemplates(),
          getTechLeads(),
        ])
        setInvitations(invData)
        setTemplates(templatesData)
        setTechLeads(techLeadsData)
      } else if (activeTab === 'results') {
        const data = await getTestResults()
        setResults(data)
        setSelectedResult(null)
      }
    } catch (err) {
      console.error('Ошибка загрузки данных:', err)
      setError(err.response?.data?.error || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvitation = async (invitationData) => {
    try {
      await createInvitation(invitationData)
      setShowCreateModal(false)
      loadData() // Перезагружаем список приглашений
    } catch (err) {
      console.error('Ошибка создания приглашения:', err)
      throw err
    }
  }

  const getInvitationLink = (uniqueLink) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/test/${uniqueLink}`
  }

  const getInterviewLink = (uniqueLink) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/interview/${uniqueLink}`
  }

  const handleCreateQuestion = async (data) => {
    await createQuestion(data)
    // reload questions
    const qs = await getQuestions()
    setQuestions(qs)
  }

  const handleCreateTemplate = async (data) => {
    await createTestTemplate(data)
    const tpls = await getTestTemplates()
    setTemplates(tpls)
  }

  if (loading && !dashboard && !candidates.length && !invitations.length) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '24px' }}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>🎛️ Панель управления</h1>
        <p className="text-secondary">Управление кандидатами, приглашениями и тестами</p>
      </div>

      {/* Вкладки */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--border-light)', marginBottom: '24px' }}>
          <button
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', marginBottom: '-2px' }}
          >
            📊 Дашборд
          </button>
          <button
            className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('templates')}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', marginBottom: '-2px' }}
          >
            🧩 Шаблоны
          </button>
          <button
            className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('questions')}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', marginBottom: '-2px' }}
          >
            ❓ Вопросы
          </button>
          <button
            className={`btn ${activeTab === 'candidates' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('candidates')}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', marginBottom: '-2px' }}
          >
            👥 Кандидаты
          </button>
          <button
            className={`btn ${activeTab === 'invitations' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('invitations')}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', marginBottom: '-2px' }}
          >
            📧 Приглашения
          </button>
          <button
            className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('results')}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', marginBottom: '-2px' }}
          >
            📊 Результаты
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Дашборд */}
        {activeTab === 'dashboard' && dashboard && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="card" style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>{dashboard.total_candidates}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Кандидатов</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📧</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>{dashboard.total_invitations}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Приглашений</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>{dashboard.completed_invitations}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Завершено</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>{dashboard.pending_invitations}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>В ожидании</div>
              </div>
            </div>
          </div>
        )}

        {/* Кандидаты */}
        {activeTab === 'candidates' && (
          <div>
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <div>
                {candidates.length === 0 ? (
                  <p className="text-secondary" style={{ textAlign: 'center', padding: '40px' }}>
                    Кандидатов пока нет
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px 0' }}>{candidate.full_name}</h3>
                            <p className="text-secondary" style={{ margin: 0 }}>{candidate.email}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                              {candidate.invitations_count}
                            </div>
                            <div className="text-secondary" style={{ fontSize: '12px' }}>приглашений</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Приглашения */}
        {activeTab === 'invitations' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Приглашения</h2>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                ➕ Создать приглашение
              </button>
            </div>

            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <div>
                {invitations.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
                    <p className="text-secondary" style={{ marginBottom: '24px' }}>
                      Приглашений пока нет
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                      ➕ Создать первое приглашение
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {invitations.map((inv) => (
                      <div key={inv.id} className="card slide-in" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px 0' }}>{inv.candidate.full_name}</h3>
                            <p className="text-secondary" style={{ margin: '0 0 8px 0' }}>{inv.candidate.email}</p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: inv.interview_type === 'technical' 
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                color: 'white'
                              }}>
                                {inv.interview_type_display}
                              </span>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: inv.completed 
                                  ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
                                  : inv.sent 
                                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                                    : 'var(--border-light)',
                                color: inv.completed || inv.sent ? 'white' : 'var(--text-secondary)'
                              }}>
                                {inv.completed ? '✅ Завершено' : inv.sent ? '📤 Отправлено' : '📝 Черновик'}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Тест</div>
                            <div style={{ fontWeight: '600' }}>{inv.test_template.name}</div>
                          </div>
                        </div>

                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                          <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>Ссылка для кандидата:</div>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}>
                            <input
                              type="text"
                              readOnly
                              value={inv.interview_type === 'technical' 
                                ? getInterviewLink(inv.unique_link)
                                : getInvitationLink(inv.unique_link)
                              }
                              className="form-input"
                              style={{ flex: 1, minWidth: '200px', fontSize: '12px' }}
                              onClick={(e) => e.target.select()}
                            />
                            <button
                              className="btn btn-outline"
                              style={{ fontSize: '12px', padding: '8px 16px' }}
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  inv.interview_type === 'technical' 
                                    ? getInterviewLink(inv.unique_link)
                                    : getInvitationLink(inv.unique_link)
                                )
                                alert('Ссылка скопирована!')
                              }}
                            >
                              📋 Копировать
                            </button>
                          </div>
                        </div>

                        {inv.assigned_tech_lead && (
                          <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                            <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Назначен Tech Lead:</div>
                            <div style={{ fontWeight: '600' }}>{inv.assigned_tech_lead.username}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Шаблоны */}
        {activeTab === 'templates' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0' }}>📋 Создать новый шаблон</h2>
              <p className="text-secondary" style={{ margin: 0, fontSize: '14px' }}>
                Шаблон — это набор вопросов для проведения тестирования. Выберите вопросы и установите время прохождения.
              </p>
            </div>

            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <div>
                {/* Форма создания (вверху) */}
                <div className="card" style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
                  <CreateTemplateForm questions={questions} onCreate={handleCreateTemplate} />
                </div>

                {/* Список существующих */}
                <div>
                  <h3 style={{ marginBottom: '16px' }}>Существующие шаблоны ({templates.length})</h3>
                  {templates.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                      <p className="text-secondary">Шаблонов пока нет. Создайте первый выше!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {templates.map((t) => (
                        <div key={t.id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)' }}>
                          <h3 style={{ margin: '0 0 8px 0' }}>{t.name}</h3>
                          <p className="text-secondary" style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{t.description || '(описание отсутствует)'}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                            <span className="text-secondary">⏱️ {t.time_limit || 'без ограничения'} мин</span>
                            <span className="text-secondary">❓ {t.questions.length} вопросов</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Вопросы */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 12px 0' }}>❓ Создать новый вопрос</h2>
              <p className="text-secondary" style={{ margin: 0, fontSize: '14px' }}>
                Вопросы могут быть разных типов: свободный текст, выбор ответа, написание кода. Выберите тип и заполните детали.
              </p>
            </div>

            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <div>
                {/* Форма создания (вверху) */}
                <div className="card" style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
                  <CreateQuestionForm tags={tags} onCreate={handleCreateQuestion} />
                </div>

                {/* Фильтры */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="text-secondary" style={{ alignSelf: 'center' }}>Типы:</span>
                  <button className="btn btn-outline" style={{ fontSize: '12px' }}>Все ({questions.length})</button>
                  <button className="btn btn-outline" style={{ fontSize: '12px' }}>📝 Текст</button>
                  <button className="btn btn-outline" style={{ fontSize: '12px' }}>✓ Выбор одного</button>
                  <button className="btn btn-outline" style={{ fontSize: '12px' }}>✓✓ Несколько</button>
                  <button className="btn btn-outline" style={{ fontSize: '12px' }}>💻 Код</button>
                </div>

                {/* Список существующих */}
                <div>
                  <h3 style={{ marginBottom: '16px' }}>Все вопросы ({questions.length})</h3>
                  {questions.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                      <p className="text-secondary">Вопросов пока нет. Создайте первый выше!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {questions.map((q) => {
                        const typeDisplay = {
                          text: '📝 Текст',
                          single_choice: '✓ Один',
                          multiple_choice: '✓✓ Несколько',
                          code: '💻 Код'
                        }
                        const complexityColor = {
                          easy: '#43e97b',
                          medium: '#f5a623',
                          hard: '#f5576c'
                        }
                        return (
                          <div key={q.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${complexityColor[q.complexity] || '#ccc'}` }}>
                            <div style={{ marginBottom: '8px' }}>
                              <h3 style={{ margin: '0 0 8px 0', lineHeight: '1.4' }}>{q.text.slice(0, 150)}{q.text.length > 150 ? '...' : ''}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: 'var(--border-light)',
                                color: 'var(--text-secondary)'
                              }}>
                                {typeDisplay[q.question_type] || q.question_type}
                              </span>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: complexityColor[q.complexity] || '#ccc',
                                color: 'white'
                              }}>
                                {q.complexity === 'easy' ? 'Легко' : q.complexity === 'hard' ? 'Сложно' : 'Средне'}
                              </span>
                              {q.tags && q.tags.length > 0 && (
                                <span className="text-secondary" style={{ fontSize: '12px' }}>
                                  🏷️ {q.tags.map(t => t.name).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Результаты */}
        {activeTab === 'results' && (
          <div>
            {selectedResult ? (
              <ResultsDetailView
                result={selectedResult}
                onBack={() => setSelectedResult(null)}
                onSaveScore={loadData}
              />
            ) : (
              <ResultsListView
                results={results}
                loading={loading}
                onSelectResult={setSelectedResult}
              />
            )}
          </div>
        )}
      </div>

      {/* Модальное окно создания приглашения */}
      {showCreateModal && (
        <CreateInvitationModal
          templates={templates}
          candidates={candidates}
          techLeads={techLeads}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvitation}
        />
      )}
    </div>
  )
}

function CreateTemplateForm({ questions, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState(0)
  const [selected, setSelected] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const toggle = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter(x => x!==id) : [...s, id]))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Введите название шаблона')
      return
    }

    if (selected.length === 0) {
      setError('Выберите хотя бы один вопрос')
      return
    }

    try {
      setLoading(true)
      const payload = {
        name,
        description,
        time_limit: Number(timeLimit) || 0,
        questions: selected.map(id => ({ question_id: id })),
      }
      await onCreate(payload)
      setName('')
      setDescription('')
      setTimeLimit(0)
      setSelected([])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при создании шаблона')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Название шаблона *</label>
        <input
          className="form-input"
          placeholder="Например: Python базовый"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Описание</label>
        <textarea
          className="form-input"
          placeholder="Описание шаблона, что в нём проверяется..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows="3"
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Ограничение времени (минуты)</label>
        <input
          className="form-input"
          type="number"
          placeholder="0 = без ограничений"
          value={timeLimit}
          onChange={e => setTimeLimit(e.target.value)}
          min="0"
          style={{ width: '100%', maxWidth: '200px' }}
        />
        <div className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
          Оставьте 0 если нет ограничения
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Выберите вопросы ({selected.length} выбрано) *
        </label>
        {questions.length === 0 ? (
          <div className="card" style={{ padding: '16px', textAlign: 'center', background: 'var(--surface)' }}>
            <p className="text-secondary">Сначала создайте вопросы во вкладке "Вопросы"</p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '12px', maxHeight: '300px', overflow: 'auto', background: 'var(--surface)' }}>
            {questions.map((q, idx) => (
              <label key={q.id} style={{ display: 'flex', gap: '8px', padding: '8px 0', borderBottom: idx < questions.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(q.id)}
                  onChange={() => toggle(q.id)}
                  style={{ marginTop: '3px' }}
                />
                <span style={{ flex: 1 }}>
                  <div>{q.text.slice(0, 100)}{q.text.length > 100 ? '...' : ''}</div>
                  <div className="text-secondary" style={{ fontSize: '12px' }}>
                    {q.question_type} • {q.complexity}
                  </div>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(245, 87, 108, 0.1)', border: '1px solid #f5576c', borderRadius: 'var(--radius-sm)', color: '#f5576c', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? '⏳ Создание...' : '✨ Создать шаблон'}
      </button>
    </form>
  )
}

function CreateQuestionForm({ tags, onCreate }) {
  const [text, setText] = useState('')
  const [questionType, setQuestionType] = useState('text')
  const [complexity, setComplexity] = useState('medium')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [stdin, setStdin] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [choices, setChoices] = useState([{ text: '', is_correct: false }])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generatingQuestion, setGeneratingQuestion] = useState(false)
  const [generationDescription, setGenerationDescription] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!text.trim()) {
      setError('Введите текст вопроса')
      return
    }

    if ((questionType === 'text' || questionType === 'code') && !correctAnswer.trim()) {
      setError('Введите правильный ответ')
      return
    }

    if ((questionType === 'single_choice' || questionType === 'multiple_choice')) {
      const filledChoices = choices.filter(c => c.text.trim())
      if (filledChoices.length < 2) {
        setError('Нужно минимум 2 варианта ответа')
        return
      }
      const hasCorrect = filledChoices.some(c => c.is_correct)
      if (!hasCorrect) {
        setError('Отметьте хотя бы один правильный ответ')
        return
      }
    }

    try {
      setLoading(true)
      const payload = {
        text,
        question_type: questionType,
        complexity,
        correct_answer: correctAnswer,
        stdin,
        tag_ids: selectedTags,
      }
      if (questionType === 'single_choice' || questionType === 'multiple_choice') {
        payload.choices = choices.filter(c => c.text.trim())
      }
      await onCreate(payload)
      // reset
      setText('')
      setCorrectAnswer('')
      setStdin('')
      setSelectedTags([])
      setChoices([{ text: '', is_correct: false }])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при создании вопроса')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (id) => setSelectedTags(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const updateChoice = (idx, field, val) => setChoices(c => c.map((ch, i) => i === idx ? { ...ch, [field]: val } : ch))
  const addChoice = () => setChoices(c => [...c, { text: '', is_correct: false }])
  const removeChoice = (idx) => setChoices(c => c.filter((_, i) => i !== idx))

  const handleGenerateQuestion = async () => {
    if (!generationDescription.trim()) {
      setError('Введите описание для генерации вопроса')
      return
    }

    try {
      setGeneratingQuestion(true)
      setError(null)
      const result = await generateQuestion(generationDescription)
      setText(result.text)
      setGenerationDescription('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при генерации вопроса')
    } finally {
      setGeneratingQuestion(false)
    }
  }

  const questionTypeLabels = {
    text: 'Свободный текст (открытый вопрос)',
    single_choice: 'Выбор одного варианта',
    multiple_choice: 'Выбор нескольких вариантов',
    code: 'Написать код'
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Тип вопроса *</label>
        <select
          className="form-input"
          value={questionType}
          onChange={e => setQuestionType(e.target.value)}
          style={{ width: '100%' }}
        >
          <option value="text">📝 {questionTypeLabels.text}</option>
          <option value="single_choice">✓ {questionTypeLabels.single_choice}</option>
          <option value="multiple_choice">✓✓ {questionTypeLabels.multiple_choice}</option>
          <option value="code">💻 {questionTypeLabels.code}</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Текст вопроса *</label>
        <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Опишите, какой вопрос нужно сгенерировать..."
              value={generationDescription}
              onChange={e => setGenerationDescription(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="button"
              onClick={handleGenerateQuestion}
              disabled={generatingQuestion || !generationDescription.trim()}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: generatingQuestion || !generationDescription.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                opacity: generatingQuestion || !generationDescription.trim() ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {generatingQuestion ? '⏳ Генерирую...' : '✨ Генерировать'}
            </button>
          </div>
          <div className="text-secondary" style={{ fontSize: '12px' }}>
            ✨ Используйте AI для быстрого создания вопроса
          </div>
        </div>

        <textarea
          className="form-input"
          placeholder="Сформулируйте вопрос..."
          value={text}
          onChange={e => setText(e.target.value)}
          required
          rows="3"
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Сложность *</label>
          <select
            className="form-input"
            value={complexity}
            onChange={e => setComplexity(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="easy">🟢 Легко</option>
            <option value="medium">🟡 Средне</option>
            <option value="hard">🔴 Сложно</option>
          </select>
        </div>
      </div>

      {(questionType === 'text' || questionType === 'code') && (
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Правильный ответ (для проверки) *</label>
          <textarea
            className="form-input"
            placeholder={questionType === 'code' ? 'Напишите правильный код...' : 'Напишите правильный ответ...'}
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            rows={questionType === 'code' ? 5 : 2}
            style={{ width: '100%', resize: 'vertical', fontFamily: questionType === 'code' ? 'monospace' : 'inherit' }}
          />
        </div>
      )}

      {questionType === 'code' && (
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Входные данные (stdin)</label>
          <textarea
            className="form-input"
            placeholder="Примеры входных данных для тестирования кода..."
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            rows="2"
            style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace' }}
          />
        </div>
      )}

      {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Варианты ответа *</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            {choices.map((ch, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  className="form-input"
                  value={ch.text}
                  onChange={e => updateChoice(idx, 'text', e.target.value)}
                  placeholder={`Вариант ${idx + 1}`}
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontWeight: '500' }}>
                  <input
                    type={questionType === 'single_choice' ? 'radio' : 'checkbox'}
                    name="correct"
                    checked={ch.is_correct}
                    onChange={e => {
                      if (questionType === 'single_choice') {
                        setChoices(c => c.map((x, i) => ({ ...x, is_correct: i === idx })))
                      } else {
                        updateChoice(idx, 'is_correct', e.target.checked)
                      }
                    }}
                  />
                  {questionType === 'single_choice' ? '✓' : '✓'}
                </label>
                {choices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChoice(idx)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--border-light)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={addChoice}
            style={{ marginTop: '8px', fontSize: '14px' }}
          >
            ➕ Добавить вариант
          </button>
        </div>
      )}

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Теги (для категоризации)</label>
        {tags.length === 0 ? (
          <div className="text-secondary" style={{ fontSize: '14px' }}>Нет доступных тегов</div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {tags.map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => toggleTag(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedTags.includes(t.id) ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: selectedTags.includes(t.id) ? 'var(--primary)' : 'transparent',
                  color: selectedTags.includes(t.id) ? 'white' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(245, 87, 108, 0.1)', border: '1px solid #f5576c', borderRadius: 'var(--radius-sm)', color: '#f5576c', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? '⏳ Создание...' : '✨ Создать вопрос'}
      </button>
    </form>
  )
}

export default AdminPanel
function ResultsListView({ results, loading, onSelectResult }) {
  if (loading) {
    return <div className="loading">Загрузка результатов...</div>
  }

  if (results.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
        <p className="text-secondary">Завершённых тестов пока нет</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Результаты тестирования</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Кандидат</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Тест</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Тип</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Автооценка</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Ручная оценка</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr key={result.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '600' }}>{result.candidate_name}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div className="text-secondary" style={{ fontSize: '12px' }}>{result.candidate_email}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div>{result.test_template}</div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: result.interview_type === 'Техническое собеседование (Tech Lead)' ? '#667eea' : '#4facfe',
                    color: 'white'
                  }}>
                    {result.interview_type === 'Техническое собеседование (Tech Lead)' ? '💻' : '👥'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#43e97b',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {result.auto_score}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {result.manual_score ? (
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#f5a623',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {result.manual_score}
                    </span>
                  ) : (
                    <span className="text-secondary">—</span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => onSelectResult(result.id)}
                  >
                    📋 Подробно
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ResultsDetailView({ result, onBack, onSaveScore }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingScores, setEditingScores] = useState({})

  useEffect(() => {
    loadDetail()
  }, [result])

  const loadDetail = async () => {
    try {
      setLoading(true)
      const data = await getTestResultDetail(result)
      setDetail(data)
    } catch (err) {
      setError('Ошибка загрузки результатов')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveScore = async (questionId, score) => {
    try {
      await saveQuestionFeedback(result, questionId, score, '')
      // Обновляем локальное состояние
      setDetail(prev => ({
        ...prev,
        answers: prev.answers.map(a => 
          a.question_id === questionId ? { ...a, manual_score: score } : a
        )
      }))
    } catch (err) {
      setError('Ошибка сохранения оценки')
    }
  }

  if (loading) {
    return <div className="loading">Загрузка деталей...</div>
  }

  if (!detail) {
    return <div className="error">Не удалось загрузить результаты</div>
  }

  return (
    <div>
      <button
        className="btn btn-outline"
        onClick={onBack}
        style={{ marginBottom: '20px' }}
      >
        ← Назад
      </button>

      <div className="card" style={{ marginBottom: '24px', padding: '20px', background: 'var(--surface)' }}>
        <h2 style={{ margin: '0 0 12px 0' }}>{detail.candidate.name}</h2>
        <p className="text-secondary" style={{ margin: '0 0 12px 0' }}>{detail.candidate.email}</p>
        <p className="text-secondary" style={{ margin: 0 }}>Тест: {detail.test_template}</p>
      </div>

      <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>Автоматическая оценка</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#43e97b' }}>{detail.total_auto_score}</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>Ручная оценка</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f5a623' }}>
            {detail.total_manual_score !== null ? detail.total_manual_score : '—'}
          </div>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

      <h3 style={{ marginBottom: '16px' }}>Ответы на вопросы</h3>
      <div style={{ display: 'grid', gap: '16px' }}>
        {detail.answers.map((answer) => (
          <div key={answer.question_id} className="card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{answer.question_text}</h4>
              <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                Тип: {answer.question_type}
              </div>
            </div>

            <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
              <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Ответ кандидата:</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-word' }}>{answer.answer}</div>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>✅ Автооценка</div>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#43e97b',
                  color: 'white',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  {answer.auto_score} баллов
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>✋ Ручная оценка</div>
                <input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Оценка"
                  value={answer.manual_score ?? ''}
                  onChange={(e) => {
                    const score = e.target.value ? parseInt(e.target.value) : null
                    handleSaveScore(answer.question_id, score)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    textAlign: 'center',
                    fontWeight: '600'
                  }}
                />
              </div>
            </div>

            {answer.feedback && (
              <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                <div className="text-secondary" style={{ fontSize: '12px', marginBottom: '4px' }}>Комментарий:</div>
                <div>{answer.feedback}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}