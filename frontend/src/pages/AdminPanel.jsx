import { useState, useEffect } from 'react'
import { getDashboard, getCandidates, getInvitations, createInvitation, getTestTemplates, getTechLeads } from '../api/adminApi'
import CreateInvitationModal from '../components/CreateInvitationModal'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [invitations, setInvitations] = useState([])
  const [templates, setTemplates] = useState([])
  const [techLeads, setTechLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

export default AdminPanel
