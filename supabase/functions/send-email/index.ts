import { Resend } from 'npm:resend@3.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface EmailRequest {
  to: string
  subject: string
  html: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html }: EmailRequest = await req.json()

    // Initialize Resend with API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_KnxsCkki_92AGu7A9wLGGzGDUzneBabWQ'
    const resend = new Resend(resendApiKey)

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'FarmCare <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw new Error(error.message || 'Failed to send email')
    }

    console.log('📧 Email sent successfully:', data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        recipient: to,
        emailId: data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})