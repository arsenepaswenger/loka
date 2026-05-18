import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

function RightSidebar({ user, onSelect, refreshKey }) {
  const [open, setOpen] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyIncidents = async () => {
      if (!user?.id) return

      setLoading(true)

      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) setIncidents(data || [])
      setLoading(false)
    }

    fetchMyIncidents()
  }, [user, refreshKey])

  const handleDelete = async (id) => {
    await supabase.from('incidents').delete().eq('id', id)
    setIncidents(prev => prev.filter(i => i.id !== id))
  }

  return (
    <>
      {/* TOGGLE */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...styles.toggle,
          right: open ? 338 : 22
        }}
      >
        {open ? '→' : '←'}
      </button>

      {/* PANEL */}
      <aside
        style={{
          ...styles.sidebar,
          transform: open ? 'translateX(0)' : 'translateX(110%)'
        }}
      >
        <h3 style={styles.title}>Mes signalements</h3>
        <p style={styles.subtitle}>Historique personnel</p>

        {loading && <p style={{ opacity: 0.6 }}>Chargement...</p>}

        {!loading && incidents.length === 0 && (
          <p style={{ opacity: 0.5 }}>Aucun signalement</p>
        )}

        <div style={styles.list}>
          {incidents.map(item => (
            <div key={item.id} style={styles.card}>
              
              <div
                style={styles.cardMain}
                onClick={() => onSelect(item)}
              >
                <p style={styles.cardTitle}>{item.title}</p>
                <p style={styles.cardSub}>
                  📍 {item.location || 'Libreville'}
                </p>
              </div>

              <div style={styles.actions}>
                <button
                  onClick={() => onSelect(item, true)}
                  style={styles.edit}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  style={styles.delete}
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 18,
    right: 18,
    bottom: 18,
    width: 320,
    borderRadius: 30,
    background: 'rgba(15,15,15,0.34)',
    backdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    transition: '0.6s cubic-bezier(.16,1,.3,1)',
    zIndex: 100
  },

  toggle: {
    position: 'fixed',
    top: 28,
    width: 46,
    height: 46,
    borderRadius: '50%',
    background: 'rgba(20,20,20,0.55)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    zIndex: 200
  },

  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.6
  },

  list: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },

  card: {
    padding: 12,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer'
  },

  cardMain: {
    flex: 1
  },

  cardTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: 14
  },

  cardSub: {
    margin: 0,
    fontSize: 11,
    opacity: 0.6
  },

  actions: {
    display: 'flex',
    gap: 6
  },

  edit: {
    background: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 11,
    cursor: 'pointer'
  },

  delete: {
    background: '#ff3b3b',
    border: 'none',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 11,
    color: '#fff',
    cursor: 'pointer'
  }
}

export default RightSidebar
