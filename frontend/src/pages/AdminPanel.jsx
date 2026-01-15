import { useState, useEffect } from 'react'
import {
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
  getCurrentUser,
  getUsers,
  updateUser,
  createUser,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updateQuestion,
  deleteQuestion,
  updateTestTemplate,
  deleteTestTemplate,
  deleteInvitation,
  createTag,
} from '../api/adminApi'
import { getTestResults, getTestResultDetail, saveQuestionFeedback } from '../api/testApi'
import CreateInvitationModal from '../components/CreateInvitationModal'
import Pagination from '../components/Pagination'

function CreateUserForm({ onCreate }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isHr, setIsHr] = useState(false)
  const [isTech, setIsTech] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [isSuper, setIsSuper] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !email.trim()) {
      setError('Enter username and email')
      return
    }
    try {
      setLoading(true)
      await onCreate({ username, email, password, is_hr: isHr, is_tech_lead: isTech, is_staff: isStaff, is_superuser: isSuper })
      setUsername('')
      setEmail('')
      setPassword('')
      setIsHr(false)
      setIsTech(false)
      setIsStaff(false)
      setIsSuper(false)
    } catch (err) {
      setError('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="form-input" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="form-input" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (optional)" className="form-input" />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label><input type="checkbox" checked={isHr} onChange={e => setIsHr(e.target.checked)} /> HR</label>
        <label><input type="checkbox" checked={isTech} onChange={e => setIsTech(e.target.checked)} /> TechLead</label>
        <label><input type="checkbox" checked={isStaff} onChange={e => setIsStaff(e.target.checked)} /> Staff</label>
        <label><input type="checkbox" checked={isSuper} onChange={e => setIsSuper(e.target.checked)} /> Superuser</label>
        <button className="px-3 py-2 text-white rounded bg-primary" disabled={loading} type="submit">{loading ? 'Creating...' : 'Create'}</button>
      </div>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
    </form>
  )
}

function CreateCandidateForm({ onCreate }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return
    try { setLoading(true); await onCreate({ full_name: fullName, email }); setFullName(''); setEmail('') } finally { setLoading(false) }
  }
  return (
    <form onSubmit={submit} style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input className="form-input" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
      <input className="form-input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="px-3 py-2 text-white rounded bg-primary" type="submit" disabled={loading}>{loading? 'Adding...':'Add'}</button>
    </form>
  )
}

function CandidateItem({ candidate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(candidate.full_name || '')
  const [email, setEmail] = useState(candidate.email || '')
  const save = async ()=>{
    await onUpdate(candidate.id, { full_name: name, email })
    setEditing(false)
  }
  return (
    <div className="p-3 bg-white border rounded">
      <div className="flex justify-between">
        <div>
          {editing ? (
            <div style={{ display:'grid', gap:6 }}>
              <input className="form-input" value={name} onChange={e=>setName(e.target.value)} />
              <input className="form-input" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="font-semibold">{candidate.full_name}</div>
              <div className="text-sm text-gray-600">{candidate.email}</div>
            </>
          )}
        </div>
        <div className="flex flex-col gap-2 text-right">
          {editing ? (
            <div style={{ display:'flex', gap:8 }}>
              <button className="px-2 py-1 text-white rounded bg-primary" onClick={save}>Save</button>
              <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button className="px-2 py-1 text-white rounded bg-primary" onClick={()=>setEditing(true)}>Edit</button>
              <button className="px-2 py-1 text-white bg-red-600 rounded" onClick={onDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel({ initialTab = null }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'templates')
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
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [editQuestion, setEditQuestion] = useState(null)
  const [editTemplate, setEditTemplate] = useState(null)

  // pagination
  const [page, setPage] = useState({ users: 1, candidates: 1, invitations: 1, templates: 1, questions: 1, results: 1 })
  const PAGE_SIZE = 10

  useEffect(() => {
    ;(async () => {
      try {
        const u = await getCurrentUser()
        setUser(u)
      } catch (e) {
        console.warn('Could not fetch current user', e)
      }
    })()
  }, [])

  useEffect(() => {
    loadData()
    // reset page when tab changes
    setPage(p => ({ ...p, [activeTab]: 1 }))
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'templates') {
        const [tpls, qs, tg] = await Promise.all([getTestTemplates(), getQuestions(), getTags()])
        setTemplates(tpls)
        setQuestions(qs)
        setTags(tg)
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
      } else if (activeTab === 'users') {
        const list = await getUsers()
        setUsers(list)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvitation = async (invitationData) => {
    await createInvitation(invitationData)
    setShowCreateModal(false)
    loadData()
  }

  const handleDeleteInvitation = async (id) => {
    if (!confirm('Delete invitation?')) return
    await deleteInvitation(id)
    loadData()
  }

  const handleCreateQuestion = async (data) => {
    if (data.id) {
      await updateQuestion(data.id, data)
    } else {
      await createQuestion(data)
    }
    const qs = await getQuestions()
    setQuestions(qs)
    setEditQuestion(null)
  }

  const handleCreateTemplate = async (data) => {
    if (data.id) {
      await updateTestTemplate(data.id, data)
    } else {
      await createTestTemplate(data)
    }
    const tpls = await getTestTemplates()
    setTemplates(tpls)
    setEditTemplate(null)
  }

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete template?')) return
    await deleteTestTemplate(id)
    loadData()
  }

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Delete question?')) return
    await deleteQuestion(id)
    loadData()
  }

  const handleCreateCandidate = async (data) => {
    await createCandidate(data)
    const list = await getCandidates()
    setCandidates(list)
  }

  const handleUpdateCandidate = async (id, data) => {
    await updateCandidate(id, data)
    const list = await getCandidates()
    setCandidates(list)
  }

  const handleDeleteCandidate = async (id) => {
    if (!confirm('Delete candidate?')) return
    await deleteCandidate(id)
    const list = await getCandidates()
    setCandidates(list)
  }

  const handleSaveUser = async (id, updated) => {
    await updateUser(id, updated)
    const list = await getUsers()
    setUsers(list)
  }

  const handleCreateUser = async (userData) => {
    await createUser(userData)
    const list = await getUsers()
    setUsers(list)
  }

  const getInvitationLink = (uniqueLink) => `${window.location.origin}/test/${uniqueLink}`
  const getInterviewLink = (uniqueLink) => `${window.location.origin}/interview/${uniqueLink}`

  if (loading && !templates.length && !questions.length) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // helpers for pagination
  const paginate = (arr, key) => {
    if (!Array.isArray(arr)) return []
    const p = page[key] || 1
    const start = (p - 1) * PAGE_SIZE
    return arr.slice(start, start + PAGE_SIZE)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="mx-auto max-w-7xl">
        <div className="p-4 mb-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-600">Manage tests, invitations, candidates and users</p>
        </div>

        <div className="p-4 mb-6 bg-white rounded shadow">
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={() => setActiveTab('templates')} className={`px-3 py-2 rounded ${activeTab==='templates'?'bg-primary text-white':'bg-gray-50'}`}>Templates</button>
            <button onClick={() => setActiveTab('questions')} className={`px-3 py-2 rounded ${activeTab==='questions'?'bg-primary text-white':'bg-gray-50'}`}>Questions</button>
            <button onClick={() => setActiveTab('candidates')} className={`px-3 py-2 rounded ${activeTab==='candidates'?'bg-primary text-white':'bg-gray-50'}`}>Candidates</button>
            <button onClick={() => setActiveTab('invitations')} className={`px-3 py-2 rounded ${activeTab==='invitations'?'bg-primary text-white':'bg-gray-50'}`}>Invitations</button>
            {(user && (user.is_hr || user.is_staff || user.is_tech_lead)) && (
              <>
                <button onClick={() => setActiveTab('results')} className={`px-3 py-2 rounded ${activeTab==='results'?'bg-primary text-white':'bg-gray-50'}`}>Results</button>
                {user && user.is_superuser && (
                  <button onClick={() => setActiveTab('users')} className={`px-3 py-2 rounded ${activeTab==='users'?'bg-primary text-white':'bg-gray-50'}`}>Management</button>
                )}
              </>
            )}
          </div>

          {error && <div className="p-3 text-red-700 bg-red-100 rounded">{error}</div>}

          {/* Users */}
          {activeTab === 'users' && user && user.is_superuser && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">User Management</h2>
              <CreateUserForm onCreate={handleCreateUser} />

              {users.length === 0 ? (
                <div className="p-4 rounded bg-gray-50">No users found</div>
              ) : (
                <div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Username</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-center">HR</th>
                        <th className="p-2 text-center">Tech</th>
                        <th className="p-2 text-center">Staff</th>
                        <th className="p-2 text-center">Super</th>
                        <th className="p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginate(users, 'users').map(u => (
                        <tr key={u.id} className="border-t">
                          <td className="p-2">{u.username}</td>
                          <td className="p-2">{u.email}</td>
                          <td className="p-2 text-center"><input type="checkbox" defaultChecked={u.is_hr} id={`hr-${u.id}`} /></td>
                          <td className="p-2 text-center"><input type="checkbox" defaultChecked={u.is_tech_lead} id={`tech-${u.id}`} /></td>
                          <td className="p-2 text-center"><input type="checkbox" defaultChecked={u.is_staff} id={`staff-${u.id}`} /></td>
                          <td className="p-2 text-center"><input type="checkbox" defaultChecked={u.is_superuser} id={`super-${u.id}`} /></td>
                          <td className="p-2 text-center">
                            <button className="px-2 py-1 text-white rounded bg-primary" onClick={async () => {
                              const updated = {
                                is_hr: document.getElementById(`hr-${u.id}`).checked,
                                is_tech_lead: document.getElementById(`tech-${u.id}`).checked,
                                is_staff: document.getElementById(`staff-${u.id}`).checked,
                                is_superuser: document.getElementById(`super-${u.id}`).checked,
                              }
                              await handleSaveUser(u.id, updated)
                            }}>Save</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination currentPage={page.users} totalPages={Math.ceil(users.length / PAGE_SIZE)} onPageChange={(p)=>setPage(prev=>({...prev, users:p}))} />
                </div>
              )}
            </div>
          )}

          {/* Candidates */}
          {activeTab === 'candidates' && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Candidates</h2>
              <div className="p-3 mb-4 bg-white border rounded">
                <CreateCandidateForm onCreate={handleCreateCandidate} />
              </div>

              {candidates.length === 0 ? (
                <div className="p-8 rounded bg-gray-50">No candidates yet</div>
              ) : (
                <div>
                  <div className="space-y-3">
                    {paginate(candidates, 'candidates').map(c => (
                      <CandidateItem key={c.id} candidate={c} onUpdate={handleUpdateCandidate} onDelete={()=>handleDeleteCandidate(c.id)} />
                    ))}
                  </div>
                  <Pagination currentPage={page.candidates} totalPages={Math.ceil(candidates.length / PAGE_SIZE)} onPageChange={(p)=>setPage(prev=>({...prev, candidates:p}))} />
                </div>
              )}
            </div>
          )}

          {/* Invitations */}
          {activeTab === 'invitations' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Invitations</h2>
                <div style={{ display: 'flex', gap:8, alignItems:'center' }}>
                  <input placeholder="Search candidate" onChange={e=>{
                    const q = e.target.value.trim().toLowerCase()
                    if (!q) { loadData(); return }
                    const filtered = invitations.filter(i => i.candidate && i.candidate.full_name.toLowerCase().includes(q))
                    setInvitations(filtered)
                  }} className="form-input" />
                  <button className="px-3 py-2 text-white rounded bg-primary" onClick={()=>setShowCreateModal(true)}>Create Invitation</button>
                </div>
              </div>

              {invitations.length === 0 ? (
                <div className="p-8 rounded bg-gray-50">No invitations yet</div>
              ) : (
                <div className="space-y-4">
                  {paginate(invitations, 'invitations').map(inv => (
                    <div key={inv.id} className="p-3 bg-white border rounded">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">{inv.candidate.full_name}</div>
                          <div className="text-sm text-gray-600">{inv.candidate.email}</div>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${inv.interview_type==='technical'?'bg-blue-600 text-white':'bg-pink-600 text-white'}`}>{inv.interview_type_display}</span>
                            <span className="px-2 py-1 text-xs bg-gray-200 rounded">{inv.completed? 'Completed' : inv.sent? 'Sent' : 'Draft'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{inv.test_template.name}</div>
                          <div className="mt-2">
                            <input readOnly value={inv.interview_type==='technical'?getInterviewLink(inv.unique_link):getInvitationLink(inv.unique_link)} className="px-2 py-1 text-xs border rounded" onClick={e=>e.target.select()} />
                          </div>
                          <div className="mt-2">
                            <button className="px-2 py-1 text-white bg-red-600 rounded" onClick={()=>handleDeleteInvitation(inv.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination currentPage={page.invitations} totalPages={Math.ceil(invitations.length / PAGE_SIZE)} onPageChange={(p)=>setPage(prev=>({...prev, invitations:p}))} />
                </div>
              )}
            </div>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Templates</h2>
              <div className="p-3 mb-4 bg-white border rounded">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div>{editTemplate ? <strong>Editing template</strong> : <strong>Create new template</strong>}</div>
                  {editTemplate && <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setEditTemplate(null)}>Cancel edit</button>}
                </div>
                <CreateTemplateForm questions={questions} onCreate={handleCreateTemplate} initial={editTemplate} />
              </div>

              {templates.length === 0 ? (
                <div className="p-8 rounded bg-gray-50">No templates yet</div>
              ) : (
                <div>
                  <div className="grid gap-3">
                    {paginate(templates, 'templates').map(t => (
                      <div key={t.id} className="p-3 bg-white border rounded">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{t.name}</div>
                            <div className="text-sm text-gray-600">{t.description || '(no description)'}</div>
                            <div className="mt-2 text-sm">Time: {t.time_limit || 'unlimited'} min — Questions: {t.questions.length}</div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            <button className="px-2 py-1 text-white rounded bg-primary" onClick={()=>setEditTemplate(t)}>Edit</button>
                            <button className="px-2 py-1 text-white bg-red-600 rounded" onClick={()=>handleDeleteTemplate(t.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination currentPage={page.templates} totalPages={Math.ceil(templates.length / PAGE_SIZE)} onPageChange={(p)=>setPage(prev=>({...prev, templates:p}))} />
                </div>
              )}
            </div>
          )}

          {/* Questions */}
          {activeTab === 'questions' && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Questions</h2>
              <div className="p-3 mb-4 bg-white border rounded">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div>{editQuestion ? <strong>Editing question</strong> : <strong>Create new question</strong>}</div>
                  {editQuestion && <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setEditQuestion(null)}>Cancel edit</button>}
                </div>
                <CreateQuestionForm tags={tags} onCreate={handleCreateQuestion} initial={editQuestion} />
              </div>

              {questions.length === 0 ? (
                <div className="p-8 rounded bg-gray-50">No questions yet</div>
              ) : (
                <div>
                  <div className="grid gap-3">
                    {paginate(questions, 'questions').map(q => (
                      <div key={q.id} className="p-3 bg-white border rounded">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{q.text.slice(0,150)}{q.text.length>150?'...':''}</div>
                            <div className="text-sm text-gray-600">{q.question_type} • {q.complexity}</div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            <button className="px-2 py-1 text-white rounded bg-primary" onClick={()=>setEditQuestion(q)}>Edit</button>
                            <button className="px-2 py-1 text-white bg-red-600 rounded" onClick={()=>handleDeleteQuestion(q.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination currentPage={page.questions} totalPages={Math.ceil(questions.length / PAGE_SIZE)} onPageChange={(p)=>setPage(prev=>({...prev, questions:p}))} />
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {activeTab === 'results' && (
            <div>
              {selectedResult ? (
                <ResultsDetailView result={selectedResult} onBack={()=>setSelectedResult(null)} onSaveScore={loadData} />
              ) : (
                <ResultsListView results={results} loading={loading} onSelectResult={(id)=>setSelectedResult(id)} />
              )}
            </div>
          )}

        </div>

        {showCreateModal && (
          <CreateInvitationModal templates={templates} candidates={candidates} techLeads={techLeads} onClose={()=>setShowCreateModal(false)} onSubmit={handleCreateInvitation} />
        )}
      </div>
    </div>
  )
}

// Note: CreateTemplateForm, CreateQuestionForm, ResultsListView, ResultsDetailView are kept as-is below
// For brevity reuse existing implementations from previous file (omitted here). If needed we can move them to separate files.

function CreateTemplateForm({ questions = [], onCreate, initial = null }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState(0)
  const [selected, setSelected] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (initial) {
      setName(initial.name || '')
      setDescription(initial.description || '')
      setTimeLimit(initial.time_limit || 0)
      setSelected(Array.isArray(initial.questions) ? initial.questions.map(q=>q.question_id || q.id) : [])
    }
  }, [initial])

  const toggle = (id) => setSelected(s => (s.includes(id) ? s.filter(x=>x!==id) : [...s, id]))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Enter template name')
    if (selected.length === 0) return setError('Select at least one question')
    try {
      setLoading(true)
      const payload = { name, description, time_limit: Number(timeLimit) || 0, questions: selected }
      if (initial && initial.id) payload.id = initial.id
      await onCreate(payload)
      setName('')
      setDescription('')
      setTimeLimit(0)
      setSelected([])
    } catch (err) {
      setError('Error creating template')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Template name" />
      <textarea className="form-input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" />
      <div style={{ display:'flex', gap:8 }}>
        <input type="number" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)} placeholder="Time limit (minutes)" />
        <button className="px-3 py-2 text-white rounded bg-primary" type="submit">{loading? (initial? 'Saving...':'Creating...') : (initial? 'Save Template' : 'Create Template')}</button>
      </div>
      <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #eee', padding:8, borderRadius:6 }}>
        <div className="mb-2 text-sm text-gray-600">Select questions</div>
        {questions.length === 0 && <div className="text-sm text-gray-500">No questions available</div>}
        {questions.map(q=> (
          <label key={q.id} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0' }}>
            <input type="checkbox" checked={selected.includes(q.id)} onChange={()=>toggle(q.id)} />
            <div>
              <div style={{ fontWeight:600 }}>{q.text.slice(0,120)}{q.text.length>120?'...':''}</div>
              <div className="text-sm text-gray-600">{q.question_type} • {q.complexity}</div>
            </div>
          </label>
        ))}
      </div>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
    </form>
  )
}

function CreateQuestionForm({ tags = [], onCreate, initial = null }) {
  const [text, setText] = useState('')
  const [questionType, setQuestionType] = useState('text')
  const [complexity, setComplexity] = useState('medium')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [stdin, setStdin] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [choices, setChoices] = useState([{ text: '', is_correct:false }])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [localTags, setLocalTags] = useState(Array.isArray(tags) ? tags : [])
  const [tagSearch, setTagSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')

  useEffect(()=>{
    setLocalTags(Array.isArray(tags) ? tags : [])
  }, [tags])

  useEffect(()=>{
    if (initial) {
      setText(initial.text || '')
      setQuestionType(initial.question_type || 'text')
      setComplexity(initial.complexity || 'medium')
      setCorrectAnswer(initial.correct_answer || '')
      setStdin(initial.stdin || '')
      setSelectedTags(initial.tag_ids || (initial.tags ? initial.tags.map(t=>t.id) : []))
      if (initial.choices) setChoices(initial.choices)
    }
  }, [initial])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!text.trim()) return setError('Enter question text')
    if ((questionType === 'text' || questionType === 'code') && !correctAnswer.trim()) return setError('Enter correct answer')
    if ((questionType === 'single_choice' || questionType === 'multiple_choice')) {
      const filled = choices.filter(c=>c.text.trim())
      if (filled.length < 2) return setError('Need at least 2 answer options')
      if (!filled.some(c=>c.is_correct)) return setError('Mark at least one correct answer')
    }
    try {
      setLoading(true)
      const payload = { text, question_type: questionType, complexity, correct_answer: correctAnswer, stdin, tag_ids: selectedTags }
      if (questionType === 'single_choice' || questionType === 'multiple_choice') payload.choices = choices.filter(c=>c.text.trim())
      if (initial && initial.id) payload.id = initial.id
      await onCreate(payload)
      setText('')
      setCorrectAnswer('')
      setStdin('')
      setSelectedTags([])
      setChoices([{ text:'', is_correct:false }])
    } catch (err) { setError('Error creating question') } finally { setLoading(false) }
  }

  const toggleTag = (id) => setSelectedTags(s => s.includes(id)? s.filter(x=>x!==id): [...s,id])
  const updateChoice = (i, field, val) => setChoices(c => c.map((ch,idx)=>idx===i? {...ch, [field]:val}:ch))
  const addChoice = () => setChoices(c=>[...c, {text:'', is_correct:false}])
  const removeChoice = (i) => setChoices(c=>c.filter((_,idx)=>idx!==i))

  const filteredTags = localTags.filter(t=> t.name.toLowerCase().includes(tagSearch.toLowerCase()))

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      const t = await createTag({ name: newTagName.trim() })
      setLocalTags(l=>[...l, t])
      setSelectedTags(s=>[...s, t.id])
      setNewTagName('')
    } catch (e) { console.error('Create tag failed', e) }
  }

  return (
    <form onSubmit={submit} style={{ display:'grid', gap:8 }}>
      <select value={questionType} onChange={e=>setQuestionType(e.target.value)} className="form-input">
        <option value="text">Free text</option>
        <option value="single_choice">Single choice</option>
        <option value="multiple_choice">Multiple choice</option>
        <option value="code">Code</option>
      </select>
      <textarea className="form-input" value={text} onChange={e=>setText(e.target.value)} placeholder="Question text" />
      { (questionType==='text' || questionType==='code') && <textarea className="form-input" value={correctAnswer} onChange={e=>setCorrectAnswer(e.target.value)} placeholder="Correct answer" /> }
      { questionType==='code' && <textarea className="form-input" value={stdin} onChange={e=>setStdin(e.target.value)} placeholder="stdin" /> }
      {(questionType==='single_choice'||questionType==='multiple_choice') && (
        <div>
          {choices.map((ch,idx)=> (
            <div key={idx} style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input value={ch.text} onChange={e=>updateChoice(idx,'text', e.target.value)} className="form-input" />
              <label><input type={questionType==='single_choice'?'radio':'checkbox'} checked={ch.is_correct} onChange={e=>{
                if (questionType==='single_choice') setChoices(c=>c.map((x,i)=>({ ...x, is_correct: i===idx })))
                else updateChoice(idx,'is_correct', e.target.checked)
              }} /> Correct</label>
              {choices.length>1 && <button type="button" onClick={()=>removeChoice(idx)}>Remove</button>}
            </div>
          ))}
          <button type="button" onClick={addChoice}>Add Option</button>
        </div>
      )}

      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input placeholder="Search tags" value={tagSearch} onChange={e=>setTagSearch(e.target.value)} className="form-input" />
        <input placeholder="New tag" value={newTagName} onChange={e=>setNewTagName(e.target.value)} className="form-input" />
        <button type="button" className="px-2 py-1 bg-gray-200 rounded" onClick={handleCreateTag}>Create Tag</button>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {filteredTags.map(t=> (
          <button key={t.id} type="button" onClick={()=>toggleTag(t.id)} className={`px-2 py-1 rounded ${selectedTags.includes(t.id)?'bg-primary text-white':'bg-gray-50'}`}>
            {t.name}
          </button>
        ))}
      </div>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <button className="px-3 py-2 text-white rounded bg-primary" type="submit">{loading? (initial? 'Saving...' : 'Creating...') : (initial? 'Save Question' : 'Create Question')}</button>
    </form>
  )
}

function ResultsListView({ results, loading, onSelectResult }) {
  if (loading) return <div>Loading results...</div>
  if (!results.length) return <div className="p-8 rounded bg-gray-50">No completed tests yet</div>
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Test Results</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Candidate</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Test</th>
              <th className="p-2 text-center">Type</th>
              <th className="p-2 text-center">Auto</th>
              <th className="p-2 text-center">Manual</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r=> (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.candidate_name}</td>
                <td className="p-2">{r.candidate_email}</td>
                <td className="p-2">{r.test_template}</td>
                <td className="p-2 text-center">{r.interview_type && r.interview_type.includes('Tech')? 'Technical' : 'General'}</td>
                <td className="p-2 text-center">{r.auto_score}</td>
                <td className="p-2 text-center">{r.manual_score ?? '—'}</td>
                <td className="p-2 text-center"><button className="px-2 py-1 text-white rounded bg-primary" onClick={()=>onSelectResult(r.id)}>View</button></td>
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

  useEffect(()=>{ load() }, [result])
  const load = async ()=>{
    try { setLoading(true); const data = await getTestResultDetail(result); setDetail(data) } catch (e) { setError('Error loading') } finally { setLoading(false) }
  }

  const handleSave = async (questionId, score, comment) => {
    try { await saveQuestionFeedback(result, questionId, score, comment); onSaveScore(); load() } catch(e){ setError('Error saving') }
  }

  if (loading) return <div>Loading details...</div>
  if (!detail) return <div>Could not load results</div>

  return (
    <div>
      <button onClick={onBack} className="px-2 py-1 mb-4 bg-gray-200 rounded">Back</button>
      <div className="p-3 mb-4 bg-white border rounded">
        <h3 className="font-semibold">{detail.candidate.name}</h3>
        <div className="text-sm text-gray-600">{detail.candidate.email}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 text-center bg-white border rounded">Auto: {detail.total_auto_score}</div>
        <div className="p-3 text-center bg-white border rounded">Manual: {detail.total_manual_score ?? '—'}</div>
      </div>

      <div className="space-y-3">
        {detail.answers.map(a=> (
          <AnswerFeedback key={a.question_id} answer={a} onSave={handleSave} />
        ))}
      </div>
    </div>
  )
}

function AnswerFeedback({ answer, onSave }) {
  const [score, setScore] = useState(answer.manual_score ?? '')
  const [comment, setComment] = useState(answer.manual_comment ?? '')

  return (
    <div className="p-3 bg-white border rounded">
      <div className="font-semibold">{answer.question_text}</div>
      <div className="mb-2 text-sm text-gray-600">Type: {answer.question_type}</div>
      <div className="p-2 mb-2 rounded bg-gray-50" style={{ fontFamily: 'monospace' }}>{answer.answer}</div>
      <div className="flex gap-3 mb-2">
        <div className="flex-1">
          <div className="text-sm text-gray-600">Auto score</div>
          <div className="font-bold">{answer.auto_score}</div>
        </div>
        <div style={{ width:140 }}>
          <div className="text-sm text-gray-600">Manual score</div>
          <input type="number" min="0" max="10" value={score} onChange={e=>setScore(e.target.value)} onBlur={()=>onSave(answer.invitation_id || answer.result_id || answer.id || answer.test_result_id || answer.result, score?parseInt(score):null, comment)} className="form-input" />
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-600">Comment</div>
        <textarea className="form-input" value={comment} onChange={e=>setComment(e.target.value)} onBlur={()=>onSave(answer.invitation_id || answer.result_id || answer.id || answer.test_result_id || answer.result, score?parseInt(score):null, comment)} />
      </div>
    </div>
  )
}
