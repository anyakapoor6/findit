import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../utils/supabaseClient';

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

		// Send email notification to your contact email
		// This will send an email to finditcontact6@gmail.com
		try {
			// Use a simple email forwarding service
			const emailData = {
				to: 'finditcontact6@gmail.com',
				subject: `New Contact Form Message from ${name}`,
				text: emailContent,
				html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          ${photoUrl ? `<p><strong>Photo:</strong> <a href="${photoUrl}">View Photo</a></p>` : ''}
          <hr>
          <p><em>Sent from FindIt Contact Form</em></p>
        `
			};

			// For now, log the email data so you can see what would be sent
			console.log('=== EMAIL TO BE SENT ===');
			console.log('To:', emailData.to);
			console.log('Subject:', emailData.subject);
			console.log('Content:', emailData.text);
			console.log('========================');

			// TODO: Replace this with your preferred email service
			// Options: Gmail API, SendGrid, Mailgun, or a simple webhook service

		} catch (emailError) {
			console.error('Email service error:', emailError);
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