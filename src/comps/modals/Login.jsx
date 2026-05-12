import React, { useState } from 'react'
import loka from '../../assets/loka.png'

function Login({ isOpen, onClose, onSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (email && password) {
      onSuccess({ email, password })
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
          <h2 style={styles.title}>Connexion</h2>
          <button style={styles.close} onClick={onClose}>
            ×
          </button>
        </div>


        {/* FORM */}
        <div style={styles.form}>
          <div style={styles.inputWrapper}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={styles.inputWrapper}>
            <input
              style={styles.input}
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p style={styles.forgotPassword}>Oublié ?</p>
          </div>
        </div>

        {/* SUBMIT */}
        <button style={styles.button} onClick={handleSubmit}>
          Se connecter
        </button>

        {/* FOOTER */}
        <p style={styles.bottomText}>
          Pas encore de compte ?
          <span style={styles.link} onClick={onSwitchToSignup}>
            Créer un compte
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
    color: '#ccc',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0 4px'
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

  inputWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
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

  forgotPassword: {
    position: 'absolute',
    right: '16px',
    top: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#86868b',
    cursor: 'pointer',
    margin: 0
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

export default Login