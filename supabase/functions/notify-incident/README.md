# Incident email notifications

This Edge Function sends an email to every Supabase Auth user with a confirmed email when a new incident is inserted.

## Required secrets

Set these in Supabase before deploying:

```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set INCIDENT_MAIL_FROM="Loka <loka@luminae.ga>"
supabase secrets set SITE_URL="https://your-domain.com"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available automatically in deployed Supabase Edge Functions.

## Deploy

```bash
supabase functions deploy notify-incident --no-verify-jwt
```

## Connect to incident inserts

In Supabase Dashboard, create a Database Webhook:

- Table: `public.incidents`
- Event: `Insert`
- Type: `Supabase Edge Function`
- Function: `notify-incident`

The email link points to:

```txt
/dashboard?incident=INCIDENT_ID
```

Your React dashboard already reads that query param and opens the incident on the map.
