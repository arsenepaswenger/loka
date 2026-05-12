import React, { useState, useEffect } from 'react'
import Navbar from './comps/nav/Navbar'
import Login from './comps/modals/Login'
import SignUp from './comps/modals/SignUp'
import Dashboard from './pages/dash/Dashboard'

function Home() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.documentElement.style.margin = '0'
    document.documentElement.style.padding = '0'
  }, [])

  const handleAuthSuccess = () => {
    setLoginOpen(false)
    setSignupOpen(false)
    setIsLoading(true)

    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true')
      setIsLoggedIn(true)
      setIsLoading(false)
    }, 1500)
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
  }

  if (isLoading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <p style={styles.loaderText}>Initialisation de la carte...</p>

        <style>{`
          .spinner {
            width: 52px;
            height: 52px;
            border: 4px solid rgba(255,255,255,0.15);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />
  }

  return (
    <div style={styles.page}>
      <video autoPlay muted loop playsInline style={styles.videoBg}>
        <source src="/traffic.mp4" type="video/mp4" />
      </video>

      <div style={styles.overlay}></div>

      <Navbar
        onLoginClick={() => setLoginOpen(true)}
        onSignupClick={() => setSignupOpen(true)}
      />

      <Login
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToSignup={() => {
          setLoginOpen(false)
          setSignupOpen(true)
        }}
      />

      <SignUp
        isOpen={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={() => {
          setSignupOpen(false)
          setLoginOpen(true)
        }}
      />

      <div style={styles.hero}>
        <p style={styles.tag}>LIBREVILLE EN DIRECT</p>

        <h1 style={styles.title}>
          L'activité de la ville,
          <br />
          en temps réel.
        </h1>

        <p style={styles.subtitle}>
          Une plateforme intelligente pour suivre la circulation, les alertes,
          les événements et tout ce qui anime Libreville.
        </p>

        <div style={styles.buttons}>
          <button
            style={styles.primary}
            onClick={() => setLoginOpen(true)}
          >
            Explorer
          </button>

          <button
            style={styles.secondary}
            onClick={() => setSignupOpen(true)}
          >
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  },

  videoBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -2
  },

  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background:
      'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.65))',
    zIndex: -1
  },

  loaderContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#050505',
    color: 'white'
  },

  loaderText: {
    marginTop: '22px',
    fontWeight: '500',
    fontSize: '16px',
    opacity: 0.85
  },

  hero: {
    padding: '160px 80px',
    maxWidth: '760px'
  },

  tag: {
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '3px',
    marginBottom: '20px',
    opacity: 0.8
  },

  title: {
    fontSize: '78px',
    fontWeight: '800',
    lineHeight: '1.02',
    marginBottom: '24px'
  },

  subtitle: {
    fontSize: '20px',
    lineHeight: '1.7',
    opacity: 0.82,
    maxWidth: '620px',
    marginBottom: '40px'
  },

  buttons: {
    display: 'flex',
    gap: '16px'
  },

  primary: {
    padding: '16px 30px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    background: 'white',
    color: 'black'
  },

  secondary: {
    padding: '16px 30px',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px'
  }
}

export default Home