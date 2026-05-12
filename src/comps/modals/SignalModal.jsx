import React, { useState, useEffect } from 'react'
import { GABON_LOCATIONS } from './SignUp'
import { supabase } from '../../supabaseClient' // Ensure this path is correct

const INCIDENT_TYPES = [
  { id: 'accident',   label: 'Accident',              icon: '🚗' },
  { id: 'traffic',    label: 'Embouteillage',         icon: '🚦' },
  { id: 'police',     label: 'Contrôle Police',       icon: '👮' },
  { id: 'pothole',    label: 'Nid de poule',          icon: '🕳️' },
  { id: 'protest',    label: 'Manifestation',         icon: '📢' },
  { id: 'roadblock',  label: 'Route barrée',          icon: '🚧' },
  { id: 'power',      label: "Coupure d'électricité",  icon: '⚡' },
  { id: 'water',      label: "Coupure d'eau",          icon: '💧' },
]

function SignalModal({ isOpen, onClose, onSubmit, userProfile = {} }) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: '',
    title: '',
    desc: '',
    location: '',
    image: null
  })

  const [preview, setPreview] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  const authorName =
    userProfile.prenom && userProfile.nom
      ? `${userProfile.prenom} ${userProfile.nom}`
      : userProfile.email ?? 'Anonyme'

  useEffect(() => {
    if (isOpen) setMounted(true)
  }, [isOpen])

  if (!isOpen && !mounted) return null

  const close = () => {
    setMounted(false)
    setTimeout(onClose, 180)
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

  const handleSubmit = async () => {
    if (!form.type || !form.title || isSubmitting) return
    
    setIsSubmitting(true)

    try {
      // Connect to Supabase "incidents" table
      const { data, error } = await supabase
        .from('incidents')
        .insert([
          {
            type: form.type,
            title: form.title,
            description: form.desc,
            location: form.location,
            image: null, // Note: For actual images, upload to Supabase Storage first and put URL here
            author_id: userProfile.id,
            author_name: authorName,
            author_location: userProfile.location ?? '',
            coords: null, // Placeholder for jsonb
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error

      // Call the original onSubmit prop if needed for local state update
      if (onSubmit) onSubmit(data[0])

      // Reset form
      setForm({
        type: '',
        title: '',
        desc: '',
        location: '',
        image: null
      })
      setPreview(null)
      setSuggestions([])
      close()
      
    } catch (error) {
      console.error('Error inserting incident:', error.message)
      alert('Erreur lors de l’envoi du signalement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSend = form.type && form.title && !isSubmitting

  return (
    <div onClick={close} style={{ ...styles.overlay, opacity: mounted ? 1 : 0 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...styles.modal,
          transform: mounted
            ? 'translateY(0) scale(1)'
            : 'translateY(20px) scale(0.98)'
        }}
      >
        <div style={styles.header}>
          <div>
            <p style={styles.kicker}>Signalement rapide</p>
            <h2 style={styles.title}>Que se passe-t-il ?</h2>
          </div>
          <button onClick={close} style={styles.close}>×</button>
        </div>

        {/* AUTHOR */}
        <div style={styles.authorBadge}>
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=111&color=fff`}
            alt=""
            style={styles.authorAvatar}
          />
          <div>
            <p style={styles.authorName}>{authorName}</p>
            <p style={styles.authorSub}>
              {userProfile.location ?? 'Libreville'}
            </p>
          </div>
        </div>

        {/* TYPES */}
        <div style={styles.section}>
          <p style={styles.label}>Choisis une situation</p>
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
          <p style={styles.label}>Décris la situation</p>
          <input
            style={styles.input}
            placeholder="Titre court"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />

          <textarea
            style={{ ...styles.input, height: 80, marginTop: 10 }}
            placeholder="Détails (optionnel)"
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
                    style={styles.sItem}
                    onClick={() => {
                      update('location', s)
                      setSuggestions([])
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* IMAGE */}
        <label style={styles.upload}>
          {preview ? (
            <img src={preview} style={styles.preview} />
          ) : (
            <span>📷 Ajouter une photo</span>
          )}
          <input type="file" hidden onChange={handleFile} />
        </label>

        {/* SUBMIT */}
        <button
          disabled={!canSend}
          onClick={handleSubmit}
          style={{
            ...styles.button,
            opacity: canSend ? 1 : 0.4
          }}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
    transition: '0.2s ease'
  },
  modal: {
    width: 420,
    maxHeight: '88vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 22,
    padding: 22,
    transition: '0.2s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  kicker: { fontSize: 12, opacity: 0.5, margin: 0 },
  title: { fontSize: 20, fontWeight: 800, margin: 0 },
  close: { border: 'none', background: 'transparent', fontSize: 24 },
  authorBadge: {
    display: 'flex',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    background: '#f5f5f7',
    marginBottom: 16
  },
  authorAvatar: { width: 38, height: 38, borderRadius: 10 },
  authorName: { margin: 0, fontWeight: 700 },
  authorSub: { margin: 0, fontSize: 12, color: '#777' },
  section: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 8 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  },
  card: {
    padding: 10,
    border: '1px solid #eee',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'center'
  },
  cardActive: {
    background: '#000',
    color: '#fff'
  },
  icon: { fontSize: 18 },
  cardText: { fontSize: 11, marginTop: 5 },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    border: '1px solid #eee',
    background: '#f7f7f7'
  },
  suggestions: {
    position: 'absolute',
    width: '100%',
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 10,
    maxHeight: 140,
    overflowY: 'auto',
    zIndex: 10
  },
  sItem: { padding: 10, cursor: 'pointer' },
  upload: {
    display: 'block',
    border: '2px dashed #ddd',
    borderRadius: 14,
    padding: 14,
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: 14
  },
  preview: { width: '100%', borderRadius: 10 },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    border: 'none',
    background: '#000',
    color: '#fff',
    fontWeight: 700
  }
}

export default SignalModal