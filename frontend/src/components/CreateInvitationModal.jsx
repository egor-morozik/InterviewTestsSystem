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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 p-5">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary m-0">➕ Создать приглашение</h2>
          <button
            className="px-3 py-1 text-xl text-secondary-light hover:text-secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Индикатор шагов */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 px-4 py-2 rounded text-xs font-semibold text-center text-white ${step >= 1 ? 'bg-primary' : 'bg-border text-secondary-light'}`}>
            Шаг 1: Кандидат
          </div>
          <div className={`flex-1 px-4 py-2 rounded text-xs font-semibold text-center text-white ${step >= 2 ? 'bg-primary' : 'bg-border text-secondary-light'}`}>
            Шаг 2: Тест
          </div>
        </div>

        {error && <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        {/* Шаг 1: Выбор кандидата */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <label className="block text-secondary font-medium mb-4">Выберите способ:</label>
              <div className="flex gap-3 mb-4">
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${!createNewCandidate ? 'bg-primary text-white' : 'bg-border text-secondary-light hover:bg-gray-100'}`}
                  onClick={() => {
                    setCreateNewCandidate(false)
                    setError(null)
                  }}
                >
                  Выбрать существующего
                </button>
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${createNewCandidate ? 'bg-primary text-white' : 'bg-border text-secondary-light hover:bg-gray-100'}`}
                  onClick={() => {
                    setCreateNewCandidate(true)
                    setError(null)
                  }}
                >
                  Создать нового
                </button>
              </div>
            </div>

            {!createNewCandidate ? (
              <div className="mb-6">
                <label className="block text-secondary font-medium mb-2">Кандидат:</label>
                <select
                  className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary"
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
                <div className="mb-6">
                  <label className="block text-secondary font-medium mb-2">Email кандидата:</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-secondary font-medium mb-2">ФИО кандидата:</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary"
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
            <div className="mb-6">
              <label className="block text-secondary font-medium mb-2">Шаблон теста:</label>
              <select
                className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary"
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

            <div className="mb-6">
              <label className="block text-secondary font-medium mb-4">Тип собеседования:</label>
              <div className="flex gap-3">
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${selectedInterviewType === 'general' ? 'bg-primary text-white' : 'bg-border text-secondary-light hover:bg-gray-100'}`}
                  onClick={() => {
                    setSelectedInterviewType('general')
                    setSelectedTechLeadId('')
                  }}
                >
                  📋 Общий тест (HR)
                </button>
                <button
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${selectedInterviewType === 'technical' ? 'bg-primary text-white' : 'bg-border text-secondary-light hover:bg-gray-100'}`}
                  onClick={() => setSelectedInterviewType('technical')}
                >
                  💻 Техническое (Tech Lead)
                </button>
              </div>
            </div>

            {selectedInterviewType === 'technical' && (
              <div className="mb-6">
                <label className="block text-secondary font-medium mb-2">Назначить Tech Lead (необязательно):</label>
                <select
                  className="w-full px-4 py-3 border border-border rounded-lg text-secondary bg-white focus:outline-none focus:border-primary"
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
        <div className="flex gap-3 mt-8">
          <button
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all border border-border text-secondary-light hover:bg-gray-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={step === 1 ? onClose : () => setStep(1)}
            disabled={loading}
          >
            {step === 1 ? 'Отмена' : 'Назад'}
          </button>
          <button
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white bg-primary hover:opacity-90 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
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
