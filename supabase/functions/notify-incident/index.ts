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

const buildAssetUrl = (siteUrl: string, path: string) =>
  new URL(path, siteUrl).toString()

const escapeHtml = (value: string | null | undefined) =>
  (value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const buildEmailHtml = (
  incident: Incident,
  incidentUrl: string,
  siteUrl: string,
) => {
  const backgroundUrl = buildAssetUrl(siteUrl, '/lbv.png')
  const logoUrl = buildAssetUrl(siteUrl, '/loka.png')

  return `
  <div style="margin:0;padding:0;background:#050505;font-family:Inter,Arial,sans-serif;color:#ffffff;">
    <div style="padding:38px 16px;background-image:linear-gradient(rgba(0,0,0,0.56),rgba(0,0,0,0.78)),url('${backgroundUrl}');background-size:cover;background-position:center;">
      <div style="max-width:560px;margin:0 auto;border-radius:28px;overflow:hidden;background:rgba(8,8,8,0.78);border:1px solid rgba(255,255,255,0.14);box-shadow:0 24px 70px rgba(0,0,0,0.34);">
        <div style="padding:34px 28px 30px;text-align:center;">
          <div style="width:86px;height:86px;margin:0 auto 22px;border-radius:26px;background:#ffffff;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(0,0,0,0.26);">
            <img src="${logoUrl}" alt="Loka" style="display:block;width:58px;height:auto;margin:14px auto;" />
          </div>

          <p style="margin:0 0 10px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.68);font-weight:700;">
            Libreville en direct
          </p>

          <h1 style="margin:0 0 14px;font-size:30px;line-height:1.1;font-weight:800;color:#ffffff;">
            Nouveau signalement
          </h1>

          <p style="margin:0 auto 26px;max-width:420px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.74);">
            Un incident vient d’être partagé sur Loka. Ouvre la carte pour voir sa position exacte.
          </p>

          <div style="margin:0 0 26px;padding:18px;border-radius:20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);text-align:left;">
            <p style="margin:0 0 8px;font-size:18px;line-height:1.35;font-weight:800;color:#ffffff;">
              ${escapeHtml(incident.title || 'Signalement')}
            </p>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:rgba(255,255,255,0.74);">
              ${escapeHtml(incident.description)}
            </p>
            <p style="margin:0 0 6px;font-size:13px;line-height:1.4;color:rgba(255,255,255,0.7);">
              <strong style="color:#ffffff;">Lieu:</strong> ${escapeHtml(incident.location || 'Libreville')}
            </p>
            <p style="margin:0;font-size:13px;line-height:1.4;color:rgba(255,255,255,0.7);">
              <strong style="color:#ffffff;">Signalé par:</strong> ${escapeHtml(incident.author_name || 'Anonyme')}
            </p>
          </div>

          <a href="${incidentUrl}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:15px 24px;border-radius:14px;font-size:15px;font-weight:800;">
            Voir sur la carte
          </a>

          <p style="margin:24px 0 0;font-size:11px;line-height:1.5;color:rgba(255,255,255,0.46);">
            Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur:<br />
            <span style="color:rgba(255,255,255,0.66);">${incidentUrl}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
`
}

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
    const html = buildEmailHtml(incident, incidentUrl, siteUrl)
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
