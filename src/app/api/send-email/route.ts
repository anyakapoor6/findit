import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../utils/supabaseClient';

const supabase = createSupabaseClient();

export async function POST(request: NextRequest) {
	try {
		const { user_id, type, message, listing_title, claim_status } = await request.json();

		// Get user email from Supabase
		const { data: userData, error: userError } = await supabase
			.from('profiles')
			.select('email')
			.eq('id', user_id)
			.single();

		if (userError || !userData?.email) {
			console.error('User not found or no email:', userError);
			return NextResponse.json({ error: 'User not found or no email' }, { status: 404 });
		}

		// For now, we'll use a simple email service like Resend or SendGrid
		// This is a placeholder implementation - you'll need to integrate with a real email service

		const emailData = {
			to: userData.email,
			subject: getEmailSubject(type, listing_title),
			html: generateEmailHTML(type, message, listing_title, claim_status),
		};

		// TODO: Replace with actual email service integration
		// Example with Resend:
		// const resend = new Resend(process.env.RESEND_API_KEY);
		// await resend.emails.send(emailData);

		console.log('Email notification would be sent:', emailData);

		// Store notification record
		await supabase
			.from('match_notifications')
			.insert({
				id: crypto.randomUUID(),
				user_id,
				notification_type: type,
				sent_via: 'email',
				sent_at: new Date().toISOString(),
				read_at: null,
				message
			});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error sending email notification:', error);
		return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
	}
}

function getEmailSubject(type: string, listing_title?: string): string {
	switch (type) {
		case 'match_found':
			return `🎯 New Match Found for "${listing_title || 'your listing'}"`;
		case 'claim_made':
			return `📝 New Claim on "${listing_title || 'your listing'}"`;
		case 'claim_approved':
			return `✅ Claim Approved for "${listing_title || 'your listing'}"`;
		case 'claim_rejected':
			return `❌ Claim Rejected for "${listing_title || 'your listing'}"`;
		default:
			return '🔔 New Notification from FindIt';
	}
}

function generateEmailHTML(type: string, message: string, listing_title?: string, claim_status?: string): string {
	const baseHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FindIt Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">FindIt</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Lost & Found Platform</p>
        </div>
        <div class="content">
          <h2 style="margin-top: 0; color: #2563eb;">${getEmailSubject(type, listing_title)}</h2>
          <p>${message}</p>
          ${listing_title ? `<p><strong>Listing:</strong> ${listing_title}</p>` : ''}
          ${claim_status ? `<p><strong>Status:</strong> ${claim_status}</p>` : ''}
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/matches" class="button">
              View Details
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This email was sent from FindIt. You can manage your notification preferences in your profile.</p>
        </div>
      </div>
    </body>
    </html>
  `;

	return baseHTML;
} 