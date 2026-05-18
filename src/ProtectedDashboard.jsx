import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Dashboard from './pages/dash/Dashboard'
import { supabase } from './supabaseClient'
import { getProfileForSession } from './authProfile'

function ProtectedDashboard() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const applySession = async (currentSession) => {
      setSession(currentSession)

      if (!currentSession) {
        setUserProfile(null)
        return
      }

      try {
        const profile = await getProfileForSession(currentSession)

        if (active) {
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Profile load error:', error.message)

        if (active) {
          setUserProfile({
            id: currentSession.user.id,
            email: currentSession.user.email,
            emailConfirmedAt: currentSession.user.email_confirmed_at
          })
        }
      }
    }

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!error) {
        await applySession(data.session)
      }

      if (active) {
        setLoading(false)
      }
    }

    loadSession()

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setTimeout(() => {
        applySession(currentSession)
      }, 0)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUserProfile(null)
  }

  if (loading) return null
  if (!session) return <Navigate to="/" replace />

  return <Dashboard onLogout={handleLogout} userProfile={userProfile ?? {}} />
}

export default ProtectedDashboard
