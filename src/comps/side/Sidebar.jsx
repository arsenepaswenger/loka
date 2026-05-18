import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import lokaLogo from '../../assets/loka.png'
import { INCIDENT_TYPES } from '../../constants'
import { supabase } from '../../supabaseClient'

function Sidebar({
  onSignalerClick,
  activeFilters,
  setActiveFilters,
  onLogout
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const navigate = useNavigate()

  const toggleFilter = (typeId) => {
    if (activeFilters.includes(typeId)) {
      setActiveFilters(activeFilters.filter(id => id !== typeId))
    } else {
      setActiveFilters([...activeFilters, typeId])
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select('nom, prenom, location')
          .eq('id', user.id)
          .single()

        if (!error) setProfile(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [])

  const handleFinalLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('isLoggedIn')

    if (onLogout) onLogout()

    navigate('/') // 🔥 HOME REDIRECT
  }

  const fullName = profile
    ? `${profile.prenom} ${profile.nom}`
    : loadingProfile ? "Chargement..." : "Utilisateur"

  const location = profile?.location || "Libreville"

  return (
    <>
      {/* CONFIRM MODAL */}
      {showLogoutConfirm && (
        <div style={styles.confirmOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div style={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <p style={styles.confirmTitle}>Déconnexion</p>
            <p style={styles.confirmText}>
              Êtes-vous sûr de vouloir quitter Loka ?
            </p>

            <div style={styles.confirmActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Rester
              </button>

              <button
                style={styles.confirmBtn}
                onClick={handleFinalLogout}
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...styles.toggle, left: isOpen ? 338 : 22 }}
      >
        {isOpen ? '←' : '→'}
      </button>

      {/* SIDEBAR */}
      <aside
        style={{
          ...styles.sidebar,
          transform: isOpen ? 'translateX(0)' : 'translateX(-110%)'
        }}
      >
        {/* HEADER */}
        <div style={styles.header}>
          <img src={lokaLogo} alt="Loka" style={styles.logo} />
          <p style={styles.tagline}>Libreville en réel</p>
        </div>

        {/* BUTTON */}
        <button style={styles.mainButton} onClick={onSignalerClick}>
          + Signaler
        </button>

        {/* FILTERS */}
        <div style={styles.filters}>
          <p style={styles.sectionTitle}>Surveillance urbaine</p>

          {INCIDENT_TYPES.map((type) => {
            const active = activeFilters.includes(type.id)

            return (
              <div
                key={type.id}
                onClick={() => toggleFilter(type.id)}
                style={{
                  ...styles.filter,
                  ...(active ? styles.activeFilter : {})
                }}
              >
                <div style={styles.filterLeft}>
                  <span style={styles.icon}>{type.icon}</span>
                  <span>{type.label}</span>
                </div>
                <div style={{ ...styles.dot, opacity: active ? 1 : 0.2 }} />
              </div>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* PROFILE */}
        <div style={styles.profile}>
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=111&color=fff`}
            alt="avatar"
            style={styles.avatar}
          />
          <div>
            <p style={styles.name}>{fullName}</p>
            <p style={styles.location}>{location}</p>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          style={styles.logout}
          onClick={() => setShowLogoutConfirm(true)}
        >
          Déconnexion
        </button>
      </aside>
    </>
  )
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 18,
    left: 18,
    bottom: 18,
    width: 320,
    borderRadius: 30,
    background: 'rgba(15,15,15,0.34)',
    backdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform .6s cubic-bezier(.16,1,.3,1)',
    fontFamily: "'Inter', sans-serif",
    color: '#fff'
  },

  toggle: {
    position: 'fixed',
    top: 28,
    width: 46,
    height: 46,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(20,20,20,0.55)',
    backdropFilter: 'blur(20px)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    zIndex: 200,
    transition: 'all .6s cubic-bezier(.16,1,.3,1)'
  },

  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 34
  },

  logo: { height: 56 },

  tagline: {
    marginTop: 10,
    fontSize: 12,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)'
  },

  mainButton: {
    height: 58,
    borderRadius: 18,
    border: 'none',
    background: '#fff',
    color: '#111',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 32
  },

  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },

  sectionTitle: {
    fontSize: 11,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 6
  },

  filter: {
    height: 56,
    borderRadius: 18,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.72)',
    transition: '.25s'
  },

  activeFilter: {
    background: 'rgba(255,255,255,0.08)',
    color: '#fff'
  },

  filterLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14
  },

  icon: { fontSize: 18 },

  dot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: '#fff'
  },

  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.05)',
    marginBottom: 12
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16
  },

  name: {
    margin: 0,
    fontWeight: 700
  },

  location: {
    margin: 0,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)'
  },

  logout: {
    height: 50,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600
  },

  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  confirmBox: {
    width: 320,
    background: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    textAlign: 'center'
  },

  confirmTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10,
    color: '#fff'
  },

  confirmText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24
  },

  confirmActions: {
    display: 'flex',
    gap: 12
  },

  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff'
  },

  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    background: '#e74c3c',
    border: 'none',
    color: '#fff'
  }
}

export default Sidebar
