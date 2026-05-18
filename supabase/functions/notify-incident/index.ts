import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Incident = {
  id: string
  type: string | null
  title: string | null
  description: string | null
  location: string | null
  author_name: string | null
  coords: {
    lat?: number
    lng?: number
  } | null
}

type WebhookPayload = {
  type: 'INSERT'
  table: 'incidents'
  schema: 'public'
  record: Incident
  old_record: null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const buildIncidentUrl = (siteUrl: string, incidentId: string) => {
  const url = new URL('/', siteUrl)
  url.searchParams.set('incident', incidentId)
  return url.toString()
}

const escapeHtml = (value: string | null | undefined) =>
  (value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const buildEmailHtml = (incident: Incident, incidentUrl: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
    <h1 style="font-size: 22px; margin-bottom: 12px;">Nouveau signalement Loka</h1>
    <p><strong>${escapeHtml(incident.title || 'Signalement')}</strong></p>
    <p>${escapeHtml(incident.description)}</p>
    <p><strong>Lieu:</strong> ${escapeHtml(incident.location || 'Libreville')}</p>
    <p><strong>Signalé par:</strong> ${escapeHtml(incident.author_name || 'Anonyme')}</p>
    <p>
      <a href="${incidentUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 16px; border-radius: 8px; text-decoration: none;">
        Voir sur la carte
      </a>
    </p>
  </div>
`

const chunk = <T,>(items: T[], size: number) => {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const brevoApiKey = requiredEnv('BREVO_API_KEY')
    const senderEmail = requiredEnv('BREVO_SENDER_EMAIL')
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Loka'
    const siteUrl = requiredEnv('SITE_URL')

    const payload = await request.json() as WebhookPayload
    const incident = payload.record

    if (!incident?.id) {
      return new Response(JSON.stringify({ error: 'Missing incident record' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const recipients: string[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) throw error

      const verifiedEmails = data.users
        .filter((user) => user.email && user.email_confirmed_at)
        .map((user) => user.email as string)

      recipients.push(...verifiedEmails)

      if (data.users.length < perPage) break

      page += 1
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const incidentUrl = buildIncidentUrl(siteUrl, incident.id)
    const subject = `Nouveau signalement: ${incident.title ?? incident.location ?? 'Loka'}`
    const html = buildEmailHtml(incident, incidentUrl)
    let sent = 0
    const failed: Array<{ email: string; error: string }> = []

    for (const batch of chunk(recipients, 300)) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: senderEmail,
            name: senderName,
          },
          to: batch.map((email) => ({ email })),
          subject,
          htmlContent: html,
        }),
      })

      if (!response.ok) {
        const details = await response.text()
        console.error(`Brevo error for ${batch.length} recipients: ${details}`)
        failed.push(...batch.map((email) => ({ email, error: details })))
        continue
      }

      sent += batch.length
    }

    if (sent === 0 && failed.length > 0) {
      return new Response(JSON.stringify({ sent, failed }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(message)

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
