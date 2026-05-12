import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Sidebar from '../../comps/side/Sidebar'
import SignalModal from '../../comps/modals/SignalModal'
import { supabase } from '../../supabaseClient'

export const INCIDENT_TYPES = [
  { id: 'accident', icon: '🚗', label: 'Accidents' },
  { id: 'traffic', icon: '🚦', label: 'Trafic' },
  { id: 'police', icon: '👮', label: 'Police' },
  { id: 'pothole', icon: '🕳️', label: 'Nids de poule' },
  { id: 'protest', icon: '📢', label: 'Manifestations' },
  { id: 'roadblock', icon: '🚧', label: 'Routes barrées' },
  { id: 'power', icon: '⚡', label: 'Coupure élec.' },
  { id: 'water', icon: '💧', label: 'Coupure eau' }
]

function Dashboard({ onLogout, userProfile = {} }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const tempMarker = useRef(null)
  const markersRef = useRef([])

  const [alerts, setAlerts] = useState([])
  const [filters, setFilters] = useState(INCIDENT_TYPES.map(t => t.id))
  const [modalOpen, setModalOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(false)

  // 1. FETCH INITIAL DATA FROM SUPABASE
  useEffect(() => {
    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setAlerts(data)
      }
    }
    fetchIncidents()
  }, [])

  // 2. MAP INIT
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [9.4582, 0.3924],
      zoom: 13,
    })

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
    })

    mapRef.current.addControl(geolocate, 'top-right')
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    mapRef.current.on('load', () => {
      try { geolocate.trigger() } catch (e) {}
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // 3. RENDER MARKERS (PERSISTENT + FILTERED)
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    alerts.forEach(alert => {
      // Check if alert has coords and matches active filters
      if (!alert?.coords || !filters.includes(alert.type)) return

      const type = INCIDENT_TYPES.find(t => t.id === alert.type)
      const el = document.createElement('div')
      el.className = 'marker-wrapper'

      const icon = type?.icon ?? '⚠️'
      
      if (alert.image) {
        el.innerHTML = `
          <div class="marker-photo">
            <img src="${alert.image}" onerror="this.src='https://placehold.co/100x100?text=Incident'"/>
            <div class="badge">${icon}</div>
          </div>
        `
      } else {
        el.innerHTML = `<div class="marker-simple">${icon}</div>`
      }

      const popupHTML = `
        <div class="popup">
          ${alert.image ? `<img src="${alert.image}" class="popup-img" />` : ''}
          <div class="popup-body">
            <strong>${type?.label ?? 'Signalement'}</strong>
            <h3 style="margin: 5px 0">${alert.title ?? ''}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 5px">📍 ${alert.location ?? ''}</p>
            <p style="font-size: 13px;">${alert.description ?? ''}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 10px 0" />
            <small>Par: ${alert.author_name ?? 'Anonyme'}</small>
          </div>
        </div>
      `

      try {
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([alert.coords.lng, alert.coords.lat]) // Ensure correct array/object format
          .setPopup(new maplibregl.Popup({ offset: 35, maxWidth: '250px' }).setHTML(popupHTML))
          .addTo(mapRef.current)

        markersRef.current.push(marker)
      } catch (e) {
        console.error("Marker error:", e)
      }
    })
  }, [alerts, filters])

  // 4. STEP 1: MODAL SUBMIT (OPEN PLACING MODE)
  const handleModalSubmit = (formData) => {
    setPending(formData)
    setModalOpen(false)
    setPlacing(true)

    if (tempMarker.current) tempMarker.current.remove()

    const center = mapRef.current.getCenter()

    tempMarker.current = new maplibregl.Marker({
      draggable: true,
      color: '#000000' // Darker color for the "aim" marker
    })
      .setLngLat(center)
      .addTo(mapRef.current)
  }

  // 5. STEP 2: CONFIRM & SAVE TO DATABASE
  const confirm = async () => {
    if (!tempMarker.current || !pending) return
    setLoading(true)

    const coords = tempMarker.current.getLngLat()

    try {
      const authorName = userProfile.prenom && userProfile.nom
        ? `${userProfile.prenom} ${userProfile.nom}`
        : userProfile.email ?? 'Anonyme'

      // INSERT INTO SUPABASE
      const { data, error } = await supabase
        .from('incidents')
        .insert([{
          type: pending.type,
          title: pending.title,
          description: pending.desc || '', // map 'desc' from modal to DB 'description'
          location: pending.location,
          image: pending.image, // URL from storage or null
          author_id: userProfile.id,
          author_name: authorName,
          author_location: userProfile.location ?? '',
          coords: { lat: coords.lat, lng: coords.lng },
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error

      // Update local UI immediately
      if (data) {
        setAlerts(prev => [data[0], ...prev])
      }

      // Cleanup
      tempMarker.current.remove()
      tempMarker.current = null
      setPending(null)
      setPlacing(false)
    } catch (err) {
      console.error("Confirm error:", err.message)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  const cancel = () => {
    tempMarker.current?.remove()
    tempMarker.current = null
    setPending(null)
    setPlacing(false)
  }

  return (
    <div style={styles.page}>
      <Sidebar
        onSignalerClick={() => setModalOpen(true)}
        activeFilters={filters}
        setActiveFilters={setFilters}
        onLogout={onLogout}
      />

      <main style={styles.main}>
        <div ref={mapContainer} style={styles.map} />

        {placing && (
          <div style={styles.bar}>
            <div style={styles.barInfo}>
              <strong>📍 Positionnez l'incident</strong>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Faites glisser le marqueur noir sur la carte</p>
            </div>
            <div style={styles.barActions}>
              <button onClick={confirm} style={styles.confirm} disabled={loading}>
                {loading ? 'Envoi...' : 'Confirmer le lieu'}
              </button>
              <button onClick={cancel} style={styles.cancel} disabled={loading}>Annuler</button>
            </div>
          </div>
        )}

        <SignalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
          userProfile={userProfile}
        />

        <style>{`
          .marker-wrapper { cursor: pointer; transition: transform 0.18s ease; }
          .marker-wrapper:hover { transform: scale(1.15); z-index: 100; }
          
          .marker-simple {
            width: 40px; height: 40px; border-radius: 50%;
            background: white; display: flex; align-items: center; justify-content: center;
            font-size: 20px; border: 2px solid #000; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          }

          .marker-photo {
            width: 50px; height: 50px; border-radius: 50%;
            position: relative; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          }

          .marker-photo img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

          .badge {
            position: absolute; bottom: -4px; right: -4px; width: 22px; height: 22px;
            background: white; border-radius: 50%; display: flex; align-items: center;
            justify-content: center; font-size: 12px; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }

          .popup-img { width: 100%; height: 120px; object-fit: cover; }
          .popup-body { padding: 12px; }
          .maplibregl-popup-content { padding: 0; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        `}</style>
      </main>
    </div>
  )
}

const styles = {
  page: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' },
  main: { flex: 1, position: 'relative' },
  map: { position: 'absolute', inset: 0 },
  bar: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    padding: '12px 20px',
    borderRadius: '100px',
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    zIndex: 10,
    border: '1px solid #eee',
    minWidth: '400px',
    justifyContent: 'space-between'
  },
  barInfo: { display: 'flex', flexDirection: 'column' },
  barActions: { display: 'flex', gap: 10 },
  confirm: {
    background: '#000',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  cancel: {
    background: '#f1f1f1',
    border: 'none',
    color: '#666',
    padding: '10px 18px',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '14px'
  }
}

export default Dashboard