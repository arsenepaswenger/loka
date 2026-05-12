import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'

export const GABON_LOCATIONS = [
  "Libreville - Nzeng Ayong", "Libreville - Louis", "Libreville - Glass",
  "Libreville - Oloumi", "Libreville - Petit Paris", "Libreville - Montagne Sainte",
  "Akanda - Cap Estérias", "Owendo - Alénakiri",
  "Port-Gentil - Centre Ville", "Franceville - Poto-Poto",
  "Oyem", "Bitam", "Lambaréné", "Mouila", "Tchibanga"
].sort()

function SignUp({ isOpen, onClose, onSwitchToLogin }) {
  const nav = useNavigate()

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm(prev => ({ ...prev, [name]: value }))

    if (name === 'location') {
      const filtered = GABON_LOCATIONS.filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(value.length > 0)
    }
  }

  const selectLocation = (loc) => {
    setForm(prev => ({ ...prev, location: loc }))
    setShowSuggestions(false)
  }

  const handleSubmit = async () => {
    if (loading) return

    if (form.password !== form.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nom: form.nom,
            prenom: form.prenom,
            phone: form.phone,
            location: form.location
          }
        }
      })

      if (error) throw error

      const user = data?.user
      if (!user) throw new Error("Utilisateur introuvable")

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          nom: form.nom,
          prenom: form.prenom,
          phone: form.phone,
          location: form.location
        })

      if (profileError) throw profileError

      onClose()
      nav('/dashboard')   // ✅ redirect here

    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div style={styles.header}>
          <h2 style={styles.title}>Créer un compte</h2>
          <button style={styles.close} onClick={onClose}>×</button>
        </div>

        <p style={styles.subtitle}>
          Rejoins Loka et suis ta ville en temps réel.
        </p>

        <div style={styles.form}>
          <div style={styles.row}>
            <input name="nom" placeholder="Nom" style={styles.input} onChange={handleChange} />
            <input name="prenom" placeholder="Prénom" style={styles.input} onChange={handleChange} />
          </div>

          <input name="email" placeholder="Email" style={styles.input} onChange={handleChange} />
          <input name="phone" placeholder="Téléphone" style={styles.input} onChange={handleChange} />

          <div style={{ position: 'relative' }}>
            <input
              name="location"
              value={form.location}
              placeholder="Quartier"
              style={styles.input}
              onChange={handleChange}
            />

            {showSuggestions && (
              <div style={styles.suggestions}>
                {suggestions.map((loc, i) => (
                  <div
                    key={i}
                    style={styles.suggestion}
                    onClick={() => selectLocation(loc)}
                  >
                    📍 {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          <input name="password" type="password" placeholder="Mot de passe" style={styles.input} onChange={handleChange} />
          <input name="confirmPassword" type="password" placeholder="Confirmer" style={styles.input} onChange={handleChange} />
        </div>

        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Création..." : "Créer un compte"}
        </button>

        <p style={styles.footer}>
          Déjà un compte ?
          <span style={styles.link} onClick={onSwitchToLogin}>
            Connexion
          </span>
        </p>

      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },

  modal: {
    width: 380,
    padding: 40,
    borderRadius: 32,
    background: '#fff',
    border: '1px solid #eee',
    boxShadow: '0 30px 60px rgba(0,0,0,0.12)'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  title: {
    fontSize: 26,
    fontWeight: 800,
    margin: 0
  },

  close: {
    background: 'transparent',
    border: 'none',
    fontSize: 28,
    cursor: 'pointer',
    color: '#bbb'
  },

  subtitle: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 30
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14
  },

  row: {
    display: 'flex',
    gap: 12
  },

  input: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    border: '1px solid #efefef',
    background: '#f9f9fb',
    outline: 'none',
    fontSize: 15
  },

  suggestions: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #eee',
    maxHeight: 200,
    overflowY: 'auto',
    zIndex: 10
  },

  suggestion: {
    padding: 12,
    cursor: 'pointer'
  },

  button: {
    marginTop: 24,
    width: '100%',
    padding: 18,
    borderRadius: 16,
    border: 'none',
    background: '#000',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer'
  },

  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: '#86868b'
  },

  link: {
    marginLeft: 6,
    fontWeight: 700,
    color: '#000',
    cursor: 'pointer'
  }
}

export default SignUp