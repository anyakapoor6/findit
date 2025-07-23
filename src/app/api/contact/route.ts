import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../utils/supabaseClient';
import { sendGmailEmail } from '../../../lib/gmail';

const supabase = createSupabaseClient();

export async function POST(request: NextRequest) {
	try {
		const { name, email, message, photoUrl } = await request.json();

		// Validate required fields
		if (!name?.trim() || !email?.trim() || !message?.trim()) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Store in notifications table
		await supabase
			.from('notifications')
			.insert({
				user_id: 'contact-form',
				type: 'contact',
				message: `Contact form message from ${name} (${email}):\n${message}${photoUrl ? `\nPhoto: ${photoUrl}` : ''}`,
				listing_id: null,
				claim_id: null,
				is_read: false
			});

		// Send email using a simple email service
		const emailContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message: ${message}
${photoUrl ? `Photo: ${photoUrl}` : ''}

---
Sent from FindIt Contact Form
    `;

		// Send email using Gmail API
		try {
			const htmlContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        ${photoUrl ? `<p><strong>Photo:</strong> <a href="${photoUrl}">View Photo</a></p>` : ''}
        <hr>
        <p><em>Sent from FindIt Contact Form</em></p>
      `;

			await sendGmailEmail({
				to: 'finditcontact6@gmail.com',
				subject: `New Contact Form Message from ${name}`,
				text: emailContent,
				html: htmlContent
			});

			console.log('✅ Email sent successfully to finditcontact6@gmail.com');
		} catch (emailError) {
			console.error('❌ Gmail API error:', emailError);
			// Still continue since we stored the message in the database
		}

		return NextResponse.json({ success: true });

	} catch (error) {
		console.error('Contact form error:', error);
		return NextResponse.json(
			{ error: 'Failed to process contact form' },
			{ status: 500 }
		);
	}
} 