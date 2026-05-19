import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Sidebar from '../../comps/side/Sidebar'
import SignalModal from '../../comps/modals/SignalModal'
import { supabase } from '../../supabaseClient'
import {
  DEFAULT_INCIDENT_DURATION_MINUTES,
  INCIDENT_DURATION_OPTIONS,
  INCIDENT_TYPES
} from '../../constants'

const INCIDENT_IMAGES_BUCKET = 'incident-images'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const getImageExtension = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension
  }

  return file.type.split('/')[1] || 'jpg'
}

const uploadIncidentImage = async (file, userId) => {
  if (!file) return null

  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('La photo ne doit pas dépasser 5 Mo')
  }

  const extension = getImageExtension(file)
  const path = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from(INCIDENT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false
    })

  if (error) throw error

  const { data } = supabase.storage
    .from(INCIDENT_IMAGES_BUCKET)
    .getPublicUrl(path)

  return {
    path,
    url: data.publicUrl
  }
}

const createMarkerElement = (alert, type) => {
  const wrapper = document.createElement('div')
  wrapper.className = 'marker-wrapper'

  const icon = type?.icon ?? '⚠️'
  const imageUrl = typeof alert.image === 'string' && alert.image.trim()
    ? alert.image
    : ''

  if (imageUrl) {
    const marker = document.createElement('div')
    marker.className = 'marker-photo'

    const image = document.createElement('img')
    image.src = imageUrl
    image.onerror = () => {
      image.src = 'https://placehold.co/100x100?text=Incident'
    }

    const badge = document.createElement('div')
    badge.className = 'badge'
    badge.textContent = icon

    marker.append(image, badge)
    wrapper.append(marker)
  } else {
    const marker = document.createElement('div')
    marker.className = 'marker-simple'
    marker.textContent = icon
    wrapper.append(marker)
  }

  return wrapper
}

const createPopupElement = (alert, type) => {
  const popup = document.createElement('div')
  popup.className = 'popup'

  const imageUrl = typeof alert.image === 'string' && alert.image.trim()
    ? alert.image
    : ''

  if (imageUrl) {
    const image = document.createElement('img')
    image.src = imageUrl
    image.className = 'popup-img'
    popup.append(image)
  }

  const body = document.createElement('div')
  body.className = 'popup-body'

  const label = document.createElement('strong')
  label.textContent = type?.label ?? 'Signalement'

  const title = document.createElement('h3')
  title.style.margin = '5px 0'
  title.textContent = alert.title ?? ''

  const location = document.createElement('p')
  location.style.fontSize = '12px'
  location.style.color = '#666'
  location.style.marginBottom = '5px'
  location.textContent = `📍 ${alert.location ?? ''}`

  const description = document.createElement('p')
  description.style.fontSize = '13px'
  description.textContent = alert.description ?? ''

  const separator = document.createElement('hr')
  separator.style.border = 'none'
  separator.style.borderTop = '1px solid #eee'
  separator.style.margin = '10px 0'

  const author = document.createElement('small')
  author.textContent = `Par: ${alert.author_name ?? 'Anonyme'}`

  body.append(label, title, location, description, separator, author)
  popup.append(body)

  return popup
}

const hasValidCoords = (alert) =>
  Number.isFinite(alert?.coords?.lat) && Number.isFinite(alert?.coords?.lng)

const getIncidentDurationMinutes = (type, durationId) => {
  const selectedDuration = INCIDENT_DURATION_OPTIONS.find(option => option.id === durationId)

  return selectedDuration?.minutes ?? DEFAULT_INCIDENT_DURATION_MINUTES[type] ?? 360
}

const getExpiryDate = (type, durationId) => {
  const minutes = getIncidentDurationMinutes(type, durationId)

  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

const getTimeAgo = (dateValue) => {
  const date = new Date(dateValue)
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))

  if (diffMinutes < 1) return 'À l’instant'
  if (diffMinutes < 60) return `${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) return `${diffHours} h`

  return `${Math.floor(diffHours / 24)} j`
}

const getTimeLeft = (dateValue) => {
  if (!dateValue) return ''

  const date = new Date(dateValue)
  const diffMinutes = Math.ceil((date.getTime() - Date.now()) / 60000)

  if (diffMinutes <= 0) return 'Expire bientôt'
  if (diffMinutes < 60) return `${diffMinutes} min restantes`

  const diffHours = Math.ceil(diffMinutes / 60)

  if (diffHours < 24) return `${diffHours} h restantes`

  return `${Math.ceil(diffHours / 24)} j restants`
}

function Dashboard({ onLogout, userProfile = {} }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const tempMarker = useRef(null)
  const markersRef = useRef([])
  const markerByIncidentId = useRef(new Map())
  const focusedIncidentId = useRef(null)

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
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

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
      try {
        geolocate.trigger()
      } catch (error) {
        console.warn('Geolocation unavailable:', error)
      }
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
    markerByIncidentId.current.clear()

    alerts.forEach(alert => {
      // Check if alert has coords and matches active filters
      const incidentId = new URLSearchParams(window.location.search).get('incident')
      const isLinkedIncident = incidentId && alert.id === incidentId

      if (
        alert.status !== 'active' ||
        (alert.expires_at && new Date(alert.expires_at) <= new Date()) ||
        !hasValidCoords(alert) ||
        (!filters.includes(alert.type) && !isLinkedIncident)
      ) return

      const type = INCIDENT_TYPES.find(t => t.id === alert.type)
      const element = createMarkerElement(alert, type)
      const popupElement = createPopupElement(alert, type)

      try {
        const marker = new maplibregl.Marker({ element })
          .setLngLat([alert.coords.lng, alert.coords.lat]) // Ensure correct array/object format
          .setPopup(new maplibregl.Popup({ offset: 35, maxWidth: '250px' }).setDOMContent(popupElement))
          .addTo(mapRef.current)

        markersRef.current.push(marker)
        markerByIncidentId.current.set(alert.id, marker)
      } catch (e) {
        console.error("Marker error:", e)
      }
    })
  }, [alerts, filters])

  useEffect(() => {
    if (!mapRef.current || alerts.length === 0) return

    const incidentId = new URLSearchParams(window.location.search).get('incident')
    if (!incidentId || focusedIncidentId.current === incidentId) return

    const target = alerts.find(alert => alert.id === incidentId)
    if (!hasValidCoords(target)) return

    focusedIncidentId.current = incidentId

    mapRef.current.flyTo({
      center: [target.coords.lng, target.coords.lat],
      zoom: 16,
      essential: true
    })

    const openPopup = () => {
      const marker = markerByIncidentId.current.get(incidentId)

      if (marker && !marker.getPopup().isOpen()) {
        marker.togglePopup()
      }
    }

    window.setTimeout(openPopup, 450)
  }, [alerts, filters])

  // 4. STEP 1: MODAL SUBMIT (OPEN PLACING MODE)
  const handleModalSubmit = (formData) => {
    if (!mapRef.current) return

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

  const focusIncident = (alert) => {
    if (!mapRef.current || !hasValidCoords(alert)) return

    mapRef.current.flyTo({
      center: [alert.coords.lng, alert.coords.lat],
      zoom: 16,
      essential: true
    })

    window.setTimeout(() => {
      const marker = markerByIncidentId.current.get(alert.id)

      if (marker && !marker.getPopup().isOpen()) {
        marker.togglePopup()
      }
    }, 450)
  }

  // 5. STEP 2: CONFIRM & SAVE TO DATABASE
  const confirm = async () => {
    if (!tempMarker.current || !pending) return

    if (!userProfile.id) {
      alert("Impossible d'identifier l'utilisateur connecté")
      return
    }

    setLoading(true)

    const coords = tempMarker.current.getLngLat()
    let uploadedImage = null

    try {
      const authorName = userProfile.prenom && userProfile.nom
        ? `${userProfile.prenom} ${userProfile.nom}`
        : userProfile.email ?? 'Anonyme'

      uploadedImage = await uploadIncidentImage(pending.image, userProfile.id)

      // INSERT INTO SUPABASE
      const { data, error } = await supabase
        .from('incidents')
        .insert([{
          type: pending.type,
          title: pending.title,
          description: pending.desc || '', // map 'desc' from modal to DB 'description'
          location: pending.location,
          image: uploadedImage?.url ?? null,
          author_id: userProfile.id,
          author_name: authorName,
          author_location: userProfile.location ?? '',
          coords: { lat: coords.lat, lng: coords.lng },
          status: 'active',
          expires_at: getExpiryDate(pending.type, pending.duration),
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

      if (uploadedImage?.path) {
        await supabase.storage
          .from(INCIDENT_IMAGES_BUCKET)
          .remove([uploadedImage.path])
      }

      alert(err.message || "Erreur lors de la sauvegarde")
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

        <aside style={styles.recentPanel}>
          <div style={styles.recentHeader}>
            <p style={styles.recentEyebrow}>En direct</p>
            <h2 style={styles.recentTitle}>Incidents récents</h2>
          </div>

          <div style={styles.recentList}>
            {alerts.length === 0 && (
              <p style={styles.emptyState}>Aucun incident actif</p>
            )}

            {alerts.slice(0, 8).map(alert => {
              const type = INCIDENT_TYPES.find(item => item.id === alert.type)

              return (
                <button
                  key={alert.id}
                  type="button"
                  style={styles.recentItem}
                  onClick={() => focusIncident(alert)}
                >
                  <span style={styles.recentIcon}>{type?.icon ?? '⚠️'}</span>
                  <span style={styles.recentContent}>
                    <strong style={styles.recentItemTitle}>{alert.title}</strong>
                    <span style={styles.recentMeta}>
                      {alert.location || 'Libreville'} · {getTimeAgo(alert.created_at)}
                    </span>
                    <span style={styles.recentExpiry}>{getTimeLeft(alert.expires_at)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

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
  recentPanel: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 320,
    maxHeight: 'calc(100vh - 36px)',
    borderRadius: 24,
    background: 'rgba(15,15,15,0.42)',
    backdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.24)',
    padding: 18,
    zIndex: 90,
    color: '#fff',
    overflow: 'hidden'
  },
  recentHeader: {
    marginBottom: 14
  },
  recentEyebrow: {
    margin: 0,
    fontSize: 10,
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.52)'
  },
  recentTitle: {
    margin: '4px 0 0',
    fontSize: 18,
    fontWeight: 800
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 'calc(100vh - 130px)',
    overflowY: 'auto'
  },
  emptyState: {
    margin: '16px 0 6px',
    fontSize: 13,
    color: 'rgba(255,255,255,0.58)'
  },
  recentItem: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff',
    borderRadius: 16,
    padding: 12,
    display: 'flex',
    gap: 12,
    textAlign: 'left',
    cursor: 'pointer'
  },
  recentIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  recentContent: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3
  },
  recentItemTitle: {
    fontSize: 13,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  recentMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.58)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  recentExpiry: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)'
  },
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
