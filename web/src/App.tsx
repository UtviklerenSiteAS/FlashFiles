import { useState, useEffect } from 'react'
import { LandingPage } from './pages/LandingPage'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { supabase } from './lib/supabase'

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

  if (session) {
    return <Dashboard />
  }

  if (view === 'login') {
    return <Login onBack={() => setView('landing')} onSuccess={() => setView('landing')} onGoToRegister={() => setView('register')} />
  }

  if (view === 'register') {
    return <Register onBack={() => setView('landing')} onSuccess={() => setView('landing')} />
  }

  return (
    <div className="w-full h-full">
      <LandingPage onLogin={() => setView('login')} onRegister={() => setView('register')} />
    </div>
  )
}

export default App
