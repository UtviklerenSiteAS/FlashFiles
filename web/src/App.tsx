import { useState, useEffect } from 'react'
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { supabase } from './lib/supabase'
import { LanguageProvider } from './lib/LanguageContext'

function App() {
  const [session, setSession] = useState<any>(null)
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <LanguageProvider>
      {session ? (
        <Dashboard />
      ) : view === 'login' ? (
        <Login onBack={() => setView('landing')} onSuccess={() => setView('landing')} onGoToRegister={() => setView('register')} />
      ) : view === 'register' ? (
        <Register onBack={() => setView('landing')} onSuccess={() => setView('landing')} />
      ) : (
        <div className="w-full h-full">
          <LandingPage onLogin={() => setView('login')} onRegister={() => setView('register')} />
        </div>
      )}
    </LanguageProvider>
  )
}

export default App
