import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TestPage from './pages/TestPage'
import TechnicalInterview from './pages/TechnicalInterview'
import TestCompleted from './pages/TestCompleted'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-white">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="w-full max-w-2xl p-16 bg-white rounded-lg shadow-card">
                <div className="flex justify-center mb-8">
                  <div className="flex items-center justify-center w-32 h-32 rounded-full shadow-lg bg-primary">
                    <span className="text-2xl font-bold text-white">ITS</span>
                  </div>
                </div>
                <h1 className="mb-4 text-4xl font-extrabold text-center text-secondary">
                  Interview Tests System
                </h1>
                <div className="flex justify-center">
                  <a href="/admin-panel" className="inline-flex items-center justify-center px-6 py-3 font-medium text-white transition-opacity rounded bg-primary hover:opacity-90">
                    Панель управления
                  </a>
                </div>
              </div>
            </div>
          </div>
        } />
        <Route path="/test/:uniqueLink" element={<TestPage />} />
        <Route path="/test/:uniqueLink/question/:questionId" element={<TestPage />} />
        <Route path="/interview/:uniqueLink" element={<TechnicalInterview />} />
        <Route path="/completed/:uniqueLink" element={<TestCompleted />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/admin-panel/results" element={<AdminPanel initialTab="results" />} />
        <Route path="/admin-panel/management" element={<AdminPanel initialTab="users" />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-white">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="w-full max-w-xl p-16 text-center bg-white rounded-lg shadow-card">
                <h1 className="mb-4 text-6xl font-extrabold text-secondary">404</h1>
                <p className="text-lg text-secondary-light">
                  Страница не найдена
                </p>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
