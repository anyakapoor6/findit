// index.ts
import { serve } from 'std/server'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { user_id, type, message, listing_title, claim_status } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Special handling for contact form
  if (type === 'contact') {
    const subject = 'FindIt: New Contact Form Submission';
    const html = `<p>New contact form message:</p><pre>${message}</pre>`;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FindIt <noreply@findit.com>',
        to: 'finditcontact6@gmail.com',
        subject,
        html
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Failed to send contact email: ${errorText}`, { status: 500 });
    }
    return new Response('Contact email sent', { status: 200 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('email, notify_claims, notify_matches, notify_nearby')
    .eq('id', user_id)
    .single()

  if (error || !user) return new Response('User not found', { status: 404 })

  if (
    (type === 'claim' && !user.notify_claims) ||
    (type === 'claim_update' && !user.notify_claims) ||
    (type === 'match' && !user.notify_matches) ||
    (type === 'nearby' && !user.notify_nearby)
  ) {
    return new Response('Preference off', { status: 200 })
  }

  // Compose subject and body
  let subject = ''
  let html = ''
  let title = listing_title ? `"${listing_title}"` : 'your listing'
  let siteUrl = 'https://yourdomain.com' // TODO: update with your real domain

  if (type === 'claim') {
    subject = `FindIt: A new claim was submitted for your found item ${title}`
    html = `<p>A new claim was submitted for your found item <b>${title}</b>.</p>
      <p><a href="${siteUrl}">View the claim and respond</a> in your FindIt dashboard.</p>
      <p>Please review the claim and accept or reject it as appropriate.</p>`
  } else if (type === 'claim_update') {
    subject = `FindIt: Your claim for ${title} was ${claim_status}!`
    html = `<p>Your claim for <b>${title}</b> was <b>${claim_status}</b>.</p>
      <p><a href="${siteUrl}">View the listing and your claim status</a> in your FindIt dashboard.</p>`
  } else if (type === 'match') {
    subject = `FindIt: 🎉 We found a match for your listing ${title}`
    html = `<p>🎉 We found a match for your listing <b>${title}</b>!</p>
      <p><a href="${siteUrl}">View your matches</a> in your FindIt dashboard.</p>`
  } else if (type === 'nearby') {
    subject = `FindIt: A new lost/found item ${title} was posted near you!`
    html = `<p>A new lost/found item <b>${title}</b> was posted near you!</p>
      <p><a href="${siteUrl}">See what's nearby</a> on FindIt.</p>`
  } else {
    subject = `FindIt: ${message}`
    html = `<p>${message}</p><p><a href="${siteUrl}">Go to FindIt</a></p>`
  }

  // Send email using Resend REST API
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'FindIt <noreply@findit.com>',
      to: user.email,
      subject,
      html
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    return new Response(`Failed to send email: ${errorText}`, { status: 500 })
  }

  return new Response('Email sent', { status: 200 })
})
