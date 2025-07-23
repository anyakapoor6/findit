import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Gmail API setup
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Create OAuth2 client
function createOAuth2Client() {
	const clientId = process.env.GMAIL_CLIENT_ID;
	const clientSecret = process.env.GMAIL_CLIENT_SECRET;
	const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

	if (!clientId || !clientSecret || !refreshToken) {
		throw new Error('Missing Gmail API credentials');
	}

	const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
	oauth2Client.setCredentials({
		refresh_token: refreshToken,
	});

	return oauth2Client;
}

// Create Gmail API client
function createGmailClient() {
	const oauth2Client = createOAuth2Client();
	return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Encode email content for Gmail API
function encodeEmail(to: string, subject: string, text: string, html?: string) {
	const emailLines = [
		`To: ${to}`,
		`Subject: ${subject}`,
		'MIME-Version: 1.0',
		'Content-Type: multipart/alternative; boundary="boundary"',
		'',
		'--boundary',
		'Content-Type: text/plain; charset=UTF-8',
		'',
		text,
	];

	if (html) {
		emailLines.push(
			'--boundary',
			'Content-Type: text/html; charset=UTF-8',
			'',
			html
		);
	}

	emailLines.push('--boundary--');

	const email = emailLines.join('\r\n');
	return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

// Send email using Gmail API
export async function sendGmailEmail({
	to,
	subject,
	text,
	html
}: {
	to: string;
	subject: string;
	text: string;
	html?: string;
}) {
	try {
		const gmail = createGmailClient();
		const raw = encodeEmail(to, subject, text, html);

		const response = await gmail.users.messages.send({
			userId: 'me',
			requestBody: {
				raw: raw,
			},
		});

		console.log('Email sent successfully:', response.data.id);
		return { success: true, messageId: response.data.id };
	} catch (error) {
		console.error('Gmail API error:', error);
		throw error;
	}
}

// Test Gmail API connection
export async function testGmailConnection() {
	try {
		const gmail = createGmailClient();
		const profile = await gmail.users.getProfile({ userId: 'me' });
		console.log('Gmail API connected successfully');
		console.log('Email address:', profile.data.emailAddress);
		return { success: true, email: profile.data.emailAddress };
	} catch (error) {
		console.error('Gmail API connection failed:', error);
		throw error;
	}
} 