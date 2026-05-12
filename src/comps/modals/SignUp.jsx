import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import loka from '../../assets/loka.png'

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
      nav('/dashboard')

    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* LOGO */}
        <div style={styles.logoWrapper}>
          <img src={loka} alt="Loka" style={styles.logo} />
        </div>

        {/* HEADER */}
        <div style={styles.top}>
          <h2 style={styles.title}>Créer un compte</h2>
          <button style={styles.close} onClick={onClose}>×</button>
        </div>
        {/* FORM */}
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

        {/* BUTTON */}
        <button
          style={styles.button}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Création..." : "Créer un compte"}
        </button>

        {/* FOOTER */}
        <p style={styles.bottomText}>
          Déjà un compte ?
          <span style={styles.link} onClick={onSwitchToLogin}>
            Connexion
          </span>
        </p>

      </div>

      <style>{`
        input:focus { 
          border-color: #000 !important; 
          background-color: #fff !important;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.02);
        }
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },

  modal: {
    width: '380px',
    padding: '40px',
    borderRadius: '32px',
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
    color: '#1d1d1f'
  },

  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '18px'
  },

  logo: {
    width: '54px',
    height: '54px',
    objectFit: 'contain'
  },

  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },

  title: {
    fontSize: '26px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.8px'
  },

  close: {
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#ccc'
  },

  subtitle: {
    fontSize: '14px',
    color: '#86868b',
    marginBottom: '32px',
    lineHeight: '1.5'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  row: {
    display: 'flex',
    gap: '12px'
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #efefef',
    backgroundColor: '#f9f9fb',
    color: '#000',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease'
  },

  suggestions: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #eee',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10
  },

  suggestion: {
    padding: '12px',
    cursor: 'pointer'
  },

  button: {
    marginTop: '24px',
    width: '100%',
    padding: '18px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: '#000',
    color: '#fff',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },

  bottomText: {
    marginTop: '24px',
    fontSize: '14px',
    color: '#86868b',
    textAlign: 'center'
  },

  link: {
    color: '#000',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: '5px'
  }
}

export default SignUp