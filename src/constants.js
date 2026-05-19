export const GABON_LOCATIONS = [
  "Libreville - Nzeng Ayong", "Libreville - Louis", "Libreville - Glass",
  "Libreville - Oloumi", "Libreville - Petit Paris", "Libreville - Montagne Sainte",
  "Akanda - Cap Estérias", "Owendo - Alénakiri",
  "Port-Gentil - Centre Ville", "Franceville - Poto-Poto",
  "Oyem", "Bitam", "Lambaréné", "Mouila", "Tchibanga"
].sort()

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

export const INCIDENT_DURATION_OPTIONS = [
  { id: '30m', label: '30 min', minutes: 30 },
  { id: '1h', label: '1 h', minutes: 60 },
  { id: '3h', label: '3 h', minutes: 180 },
  { id: '12h', label: '12 h', minutes: 720 },
  { id: '1d', label: '1 jour', minutes: 1440 },
  { id: '2d', label: '2 jours', minutes: 2880 },
  { id: 'unknown', label: 'Je ne sais pas', minutes: null }
]

export const DEFAULT_INCIDENT_DURATION_MINUTES = {
  accident: 120,
  traffic: 60,
  police: 120,
  pothole: 43200,
  protest: 720,
  roadblock: 1440,
  power: 360,
  water: 360
}
