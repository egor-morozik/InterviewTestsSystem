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
          <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-white">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="w-full max-w-2xl bg-white rounded-lg shadow-card p-16">
                <div className="flex justify-center mb-8">
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">ITS</span>
                  </div>
                </div>
                <h1 className="text-4xl font-extrabold text-center text-secondary mb-4">
                  Interview Tests System
                </h1>
                <p className="text-center text-secondary-light text-lg mb-8 leading-relaxed">
                  Система для проведения интервью и тестирования кандидатов
                </p>
                <div className="bg-primary-light border-l-4 border-primary rounded p-4 mb-8">
                  <p className="text-secondary text-base">
                    INFO: Используйте ссылку из приглашения для прохождения теста или интервью
                  </p>
                </div>
                <div className="flex justify-center">
                  <a href="/admin-panel" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded hover:opacity-90 transition-opacity">
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
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-white">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="w-full max-w-xl bg-white rounded-lg shadow-card p-16 text-center">
                <h1 className="text-6xl font-extrabold text-secondary mb-4">404</h1>
                <p className="text-secondary-light text-lg">
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
