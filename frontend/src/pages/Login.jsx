import { useState } from 'react'
import { login as apiLogin, getCurrentUser } from '../api/adminApi'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      setLoading(true)
      await apiLogin({ username, password })
      // try fetching current user to confirm
      await getCurrentUser()
      nav('/admin-panel')
    } catch (e) {
      setError('Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded p-8 shadow">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <form onSubmit={submit} style={{ display:'grid', gap:8 }}>
          <input className="form-input" placeholder="Username or email" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" className="form-input" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div style={{ color:'#b91c1c' }}>{error}</div>}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className="px-4 py-2 bg-primary text-white rounded" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            <a href="/" className="text-sm text-gray-600">Back</a>
          </div>
        </form>
      </div>
    </div>
  )
}
