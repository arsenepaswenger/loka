import { useState } from 'react'
import { GABON_LOCATIONS, INCIDENT_DURATION_OPTIONS } from '../../constants'
import loka from '../../assets/loka.png'

const INCIDENT_TYPES = [
  { id: 'accident', label: 'Accident', icon: '🚗' },
  { id: 'traffic', label: 'Embouteillage', icon: '🚦' },
  { id: 'police', label: 'Contrôle Police', icon: '👮' },
  { id: 'pothole', label: 'Nid de poule', icon: '🕳️' },
  { id: 'protest', label: 'Manifestation', icon: '📢' },
  { id: 'roadblock', label: 'Route barrée', icon: '🚧' },
  { id: 'power', label: "Coupure d'électricité", icon: '⚡' },
  { id: 'water', label: "Coupure d'eau", icon: '💧' },
]

function SignalModal({ isOpen, onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: '',
    title: '',
    desc: '',
    location: '',
    duration: 'unknown',
    image: null
  })

  const [preview, setPreview] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  if (!isOpen) return null

  const close = () => {
    onClose()
  }

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleLocation = (val) => {
    update('location', val)

    if (val.length > 1) {
      setSuggestions(
        GABON_LOCATIONS.filter(l =>
          l.toLowerCase().includes(val.toLowerCase())
        )
      )
    } else {
      setSuggestions([])
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    update('image', file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    if (!form.type || !form.title || isSubmitting) return

    setIsSubmitting(true)

    if (onSubmit) onSubmit(form)

    setForm({
      type: '',
      title: '',
      desc: '',
      location: '',
      duration: 'unknown',
      image: null
    })

    setPreview(null)
    setSuggestions([])
    setIsSubmitting(false)
    close()
  }

  const canSend = form.type && form.title && !isSubmitting

  return (
    <div onClick={close} style={styles.overlay}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={styles.modal}
      >

        {/* LOGO */}
        <div style={styles.logoWrapper}>
          <img src={loka} alt="Loka" style={styles.logo} />
        </div>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Que se passe-t-il ?</h2>
 
          </div>
          <button onClick={close} style={styles.close}>×</button>
        </div>

        

        {/* TYPES */}
        <div style={styles.section}>
          <p style={styles.label}>Type d’incident</p>
          <div style={styles.grid}>
            {INCIDENT_TYPES.map(t => (
              <div
                key={t.id}
                onClick={() => update('type', t.id)}
                style={{
                  ...styles.card,
                  ...(form.type === t.id ? styles.cardActive : {})
                }}
              >
                <div style={styles.icon}>{t.icon}</div>
                <div style={styles.cardText}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TEXT */}
        <div style={styles.section}>
          <p style={styles.label}>Détails</p>

          <input
            style={styles.input}
            placeholder="Titre court"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />

          <textarea
            style={{ ...styles.input, height: 80, marginTop: 10 }}
            placeholder="Description"
            value={form.desc}
            onChange={(e) => update('desc', e.target.value)}
          />
        </div>

        {/* LOCATION */}
        <div style={styles.section}>
          <p style={styles.label}>Localisation</p>

          <div style={{ position: 'relative' }}>
            <input
              style={styles.input}
              placeholder="Quartier"
              value={form.location}
              onChange={(e) => handleLocation(e.target.value)}
            />

            {suggestions.length > 0 && (
              <div style={styles.suggestions}>
                {suggestions.map((s) => (
                  <div
                    key={s}
                    style={styles.suggestion}
                    onClick={() => {
                      update('location', s)
                      setSuggestions([])
                    }}
                  >
                    📍 {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DURATION */}
        <div style={styles.section}>
          <p style={styles.label}>Durée estimée</p>
          <div style={styles.durationGrid}>
            {INCIDENT_DURATION_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => update('duration', option.id)}
                style={{
                  ...styles.durationOption,
                  ...(form.duration === option.id ? styles.durationActive : {})
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* IMAGE */}
        <label style={styles.upload}>
          {preview ? (
            <img src={preview} style={styles.preview} />
          ) : (
            '📷 Ajouter une photo'
          )}
          <input type="file" accept="image/*" hidden onChange={handleFile} />
        </label>

        {/* BUTTON */}
        <button
          disabled={!canSend}
          onClick={handleSubmit}
          style={{
            ...styles.button,
            opacity: canSend ? 1 : 0.4
          }}
        >
          {isSubmitting ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>

      <style>{`
        * {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui;
        }

        input:focus, textarea:focus {
          border-color: #000 !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(14px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
    transition: '0.2s ease'
  },

  modal: {
    width: 400,
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: 40,
    borderRadius: 32,
    background: '#fff',
    border: '1px solid #f0f0f0',
    boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
    transition: '0.2s ease'
  },

  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 18
  },

  logo: {
    width: 52,
    height: 52,
    objectFit: 'contain'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18
  },

  title: {
    fontSize: 24,
    fontWeight: 800,
    margin: 0,
    letterSpacing: -0.5
  },

  subtitle: {
    fontSize: 13,
    color: '#86868b',
    marginTop: 4
  },

  close: {
    border: 'none',
    background: 'transparent',
    fontSize: 26,
    cursor: 'pointer',
    color: '#bbb'
  },

  author: {
    display: 'flex',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    background: '#f6f6f7',
    marginBottom: 18
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12
  },

  authorName: { margin: 0, fontWeight: 700 },
  authorSub: { margin: 0, fontSize: 12, color: '#777' },

  section: { marginBottom: 16 },

  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },

  card: {
    padding: 12,
    borderRadius: 14,
    border: '1px solid #eee',
    cursor: 'pointer',
    textAlign: 'center'
  },

  cardActive: {
    background: '#000',
    color: '#fff'
  },

  icon: { fontSize: 18 },

  cardText: { fontSize: 11, marginTop: 6 },

  input: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    border: '1px solid #eee',
    background: '#f7f7f7',
    fontSize: 14,
    outline: 'none'
  },

  suggestions: {
    position: 'absolute',
    width: '100%',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 12,
    maxHeight: 150,
    overflowY: 'auto',
    zIndex: 10
  },

  suggestion: {
    padding: 10,
    cursor: 'pointer'
  },

  durationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8
  },

  durationOption: {
    border: '1px solid #eee',
    background: '#f7f7f7',
    borderRadius: 12,
    padding: '10px 8px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#1d1d1f'
  },

  durationActive: {
    background: '#000',
    color: '#fff',
    borderColor: '#000'
  },

  upload: {
    display: 'block',
    border: '2px dashed #ddd',
    borderRadius: 16,
    padding: 14,
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: 16
  },

  preview: {
    width: '100%',
    borderRadius: 12
  },

  button: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    border: 'none',
    background: '#000',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15
  }
}

export default SignalModal
