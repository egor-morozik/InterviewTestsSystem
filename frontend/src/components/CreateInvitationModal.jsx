import { useState, useEffect } from 'react'
import { getCandidates, createCandidate } from '../api/adminApi'

function CreateInvitationModal({ templates, candidates: existingCandidates, techLeads, onClose, onSubmit }) {
  const [step, setStep] = useState(1) // 1 - выбор/создание кандидата, 2 - выбор теста и типа
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [newCandidate, setNewCandidate] = useState({ email: '', full_name: '' })
  const [createNewCandidate, setCreateNewCandidate] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedInterviewType, setSelectedInterviewType] = useState('general')
  const [selectedTechLeadId, setSelectedTechLeadId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [candidates, setCandidates] = useState(existingCandidates)

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      const data = await getCandidates()
      setCandidates(data)
    } catch (err) {
      console.error('Ошибка загрузки кандидатов:', err)
    }
  }

  const handleCreateCandidate = async () => {
    if (!newCandidate.email || !newCandidate.full_name) {
      setError('Заполните все поля')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const candidate = await createCandidate(newCandidate)
      setCandidates([...candidates, candidate])
      setSelectedCandidateId(candidate.id.toString())
      setCreateNewCandidate(false)
      setNewCandidate({ email: '', full_name: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания кандидата')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!selectedCandidateId && !createNewCandidate) {
        setError('Выберите кандидата или создайте нового')
        return
      }
      if (createNewCandidate) {
        handleCreateCandidate()
        return
      }
      setStep(2)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!selectedTemplateId) {
      setError('Выберите шаблон теста')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const invitationData = {
        candidate_id: parseInt(selectedCandidateId),
        test_template_id: parseInt(selectedTemplateId),
        interview_type: selectedInterviewType,
      }

      if (selectedInterviewType === 'technical' && selectedTechLeadId) {
        invitationData.assigned_tech_lead_id = parseInt(selectedTechLeadId)
      }

      await onSubmit(invitationData)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания приглашения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card fade-in" style={{
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>➕ Создать приглашение</h2>
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        {/* Индикатор шагов */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <div style={{
            flex: 1,
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: step >= 1 ? 'var(--primary-gradient)' : 'var(--border-light)',
            color: step >= 1 ? 'white' : 'var(--text-secondary)',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Шаг 1: Кандидат
          </div>
          <div style={{
            flex: 1,
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: step >= 2 ? 'var(--primary-gradient)' : 'var(--border-light)',
            color: step >= 2 ? 'white' : 'var(--text-secondary)',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Шаг 2: Тест
          </div>
        </div>

        {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* Шаг 1: Выбор кандидата */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Выберите способ:</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  className={`btn ${!createNewCandidate ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setCreateNewCandidate(false)
                    setError(null)
                  }}
                  style={{ flex: 1 }}
                >
                  Выбрать существующего
                </button>
                <button
                  className={`btn ${createNewCandidate ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setCreateNewCandidate(true)
                    setError(null)
                  }}
                  style={{ flex: 1 }}
                >
                  Создать нового
                </button>
              </div>
            </div>

            {!createNewCandidate ? (
              <div className="form-group">
                <label className="form-label">Кандидат:</label>
                <select
                  className="form-input"
                  value={selectedCandidateId}
                  onChange={(e) => {
                    setSelectedCandidateId(e.target.value)
                    setError(null)
                  }}
                >
                  <option value="">-- Выберите кандидата --</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Email кандидата:</label>
                  <input
                    type="email"
                    className="form-input"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ФИО кандидата:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCandidate.full_name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, full_name: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Шаг 2: Выбор теста */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">Шаблон теста:</label>
              <select
                className="form-input"
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value)
                  setError(null)
                }}
              >
                <option value="">-- Выберите шаблон теста --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Тип собеседования:</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className={`btn ${selectedInterviewType === 'general' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setSelectedInterviewType('general')
                    setSelectedTechLeadId('')
                  }}
                  style={{ flex: 1 }}
                >
                  📋 Общий тест (HR)
                </button>
                <button
                  className={`btn ${selectedInterviewType === 'technical' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedInterviewType('technical')}
                  style={{ flex: 1 }}
                >
                  💻 Техническое (Tech Lead)
                </button>
              </div>
            </div>

            {selectedInterviewType === 'technical' && (
              <div className="form-group">
                <label className="form-label">Назначить Tech Lead (необязательно):</label>
                <select
                  className="form-input"
                  value={selectedTechLeadId}
                  onChange={(e) => setSelectedTechLeadId(e.target.value)}
                >
                  <option value="">-- Не назначать --</option>
                  {techLeads.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.username} {tl.email ? `(${tl.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            className="btn btn-outline"
            onClick={step === 1 ? onClose : () => setStep(1)}
            style={{ flex: 1 }}
            disabled={loading}
          >
            {step === 1 ? 'Отмена' : 'Назад'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            style={{ flex: 1 }}
            disabled={loading}
          >
            {loading ? 'Сохранение...' : step === 1 ? 'Далее →' : '✅ Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateInvitationModal
