import { useState } from 'react'
import loka from '../../assets/loka.png'

const Navbar = ({ onLoginClick, onSignupClick }) => {
  const [hovered, setHovered] = useState(null)

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
    fontSize: '14px',
    height: '100%',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    outline: 'none',
    transition: 'all 0.2s ease'
  }

  const getDynamicStyle = (id) => ({
    background: hovered === id ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: hovered === id ? 'white' : 'rgba(255,255,255,0.75)',
  })

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        padding: '0 2.5rem',
        height: '90px',
        background: 'rgba(10, 10, 10, 0.55)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'sans-serif'
      }}
    >
      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={loka} alt="Loka logo" style={{ height: 45 }} />
      </div>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'stretch' }}>
        {['Accueil', 'Infos', 'Contact', 'La Map'].map((item) => (
          <a
            key={item}
            href="#"
            style={{ ...linkStyle, ...getDynamicStyle(item) }}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
          >
            {item}
          </a>
        ))}

        <div
          style={{
            width: '1px',
            background: 'rgba(255,255,255,0.1)',
            margin: '25px 10px'
          }}
        />

        {/* LOGIN */}
        <button
          style={{ ...linkStyle, ...getDynamicStyle('login') }}
          onMouseEnter={() => setHovered('login')}
          onMouseLeave={() => setHovered(null)}
          onClick={onLoginClick}
        >
          Se connecter
        </button>

        {/* SIGNUP */}
        <button
          style={{
            ...linkStyle,
            ...getDynamicStyle('signup'),
            fontWeight: 600
          }}
          onMouseEnter={() => setHovered('signup')}
          onMouseLeave={() => setHovered(null)}
          onClick={onSignupClick}
        >
          S'inscrire
        </button>
      </nav>
    </div>
  )
}

export default Navbar
