import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TestPage from './pages/TestPage'
import TechnicalInterview from './pages/TechnicalInterview'
import TestCompleted from './pages/TestCompleted'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="container fade-in">
            <div className="card" style={{ textAlign: 'center', maxWidth: '700px', margin: '120px auto', padding: '64px 48px' }}>
              <div style={{
                fontSize: '72px',
                marginBottom: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)'
              }}>
                <span>📝</span>
              </div>
              <h1 style={{ marginBottom: '20px' }}>Interview Tests System</h1>
              <p className="text-secondary" style={{ marginTop: '16px', marginBottom: '40px', fontSize: '18px', lineHeight: '1.6' }}>
                Система для проведения интервью и тестирования кандидатов
              </p>
              <div className="success" style={{ textAlign: 'left', marginTop: '32px' }}>
                <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6' }}>
                  💡 Используйте ссылку из приглашения для прохождения теста или интервью
                </p>
              </div>
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <a href="/admin-panel" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  🎛️ Панель управления
                </a>
              </div>
            </div>
          </div>
        } />
        <Route path="/test/:uniqueLink" element={<TestPage />} />
        <Route path="/test/:uniqueLink/question/:questionId" element={<TestPage />} />
        <Route path="/interview/:uniqueLink" element={<TechnicalInterview />} />
        <Route path="/completed/:uniqueLink" element={<TestCompleted />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="*" element={
          <div className="container fade-in">
            <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '120px auto', padding: '64px 48px' }}>
              <div style={{
                fontSize: '80px',
                marginBottom: '24px'
              }}>🔍</div>
              <h1 style={{ marginBottom: '16px' }}>404</h1>
              <p className="text-secondary" style={{ marginTop: '16px', fontSize: '18px' }}>
                Страница не найдена
              </p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
