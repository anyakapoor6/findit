import { NextRequest, NextResponse } from 'next/server';
import { testGmailConnection, sendGmailEmail } from '../../../lib/gmail';

export async function GET(request: NextRequest) {
	try {
		// Test Gmail API connection
		const connectionResult = await testGmailConnection();

		return NextResponse.json({
			success: true,
			message: 'Gmail API connection successful',
			email: connectionResult.email
		});
	} catch (error) {
		console.error('Gmail API test failed:', error);
		return NextResponse.json({
			success: false,
			error: 'Gmail API connection failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const { to, subject, text } = await request.json();

		// Send a test email
		const result = await sendGmailEmail({
			to: to || 'finditcontact6@gmail.com',
			subject: subject || 'Test Email from FindIt',
			text: text || 'This is a test email from the FindIt contact form system.'
		});

		return NextResponse.json({
			success: true,
			message: 'Test email sent successfully',
			messageId: result.messageId
		});
	} catch (error) {
		console.error('Test email failed:', error);
		return NextResponse.json({
			success: false,
			error: 'Failed to send test email',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
} 