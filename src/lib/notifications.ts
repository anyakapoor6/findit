import { createSupabaseClient } from '../utils/supabaseClient';
const supabase = createSupabaseClient();
import type { Match } from './types';
import type { NotificationType } from './types';

// Web notification hooks and placeholders
export class WebNotificationService {
	static async requestPermission(): Promise<boolean> {
		if (!('Notification' in window)) {
			console.warn('This browser does not support notifications');
			return false;
		}

		if (Notification.permission === 'granted') {
			return true;
		}

		if (Notification.permission === 'denied') {
			return false;
		}

		const permission = await Notification.requestPermission();
		return permission === 'granted';
	}

	static async sendMatchNotification(match: Match, userId: string): Promise<boolean> {
		try {
			const hasPermission = await this.requestPermission();
			if (!hasPermission) {
				console.log('Notification permission not granted');
				return false;
			}

			const notification = new Notification('New Match Found! 🎯', {
				body: `We found a potential match for "${match.listing_title}" with ${Math.round(match.score * 100)}% confidence.`,
				icon: '/favicon.ico',
				badge: '/favicon.ico',
				tag: `match-${match.match_id}`,
				requireInteraction: false,
				silent: false
			});

			notification.onclick = () => {
				window.focus();
				window.location.href = '/matches';
				notification.close();
			};

			// Store notification record in the existing notifications table
			await this.storeNotificationRecord({
				user_id: userId,
				type: 'match_found',
				message: `Match found for "${match.listing_title}" with ${Math.round(match.score * 100)}% confidence`,
				listing_id: match.listing_id,
				claim_id: null,
				is_read: false
			});

			return true;
		} catch (error) {
			console.error('Error sending web notification:', error);
			return false;
		}
	}

	private static async storeNotificationRecord(notification: {
		user_id: string;
		type: string;
		message: string;
		listing_id: string;
		claim_id: string | null;
		is_read: boolean;
	}): Promise<void> {
		try {
			await supabase
				.from('notifications')
				.insert(notification);
		} catch (error) {
			console.error('Error storing notification record:', error);
		}
	}
}

// Email notification hooks and placeholders
export class EmailNotificationService {
	static async sendMatchEmail(match: Match, userEmail: string): Promise<boolean> {
		try {
			// Send email via our API endpoint
			const response = await fetch('/api/send-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: match.listing_user_id,
					type: 'match_found',
					message: `We found a ${Math.round(match.score * 100)}% match for your listing "${match.listing_title}" with "${match.matched_listing_title}".`,
					listing_title: match.listing_title
				})
			});

			if (!response.ok) {
				throw new Error(`Email API returned ${response.status}`);
			}

			// Store notification record
			await this.storeNotificationRecord({
				user_id: match.listing_user_id,
				type: 'match_found',
				message: `Email sent: ${Math.round(match.score * 100)}% match for "${match.listing_title}"`,
				listing_id: match.listing_id,
				claim_id: null,
				is_read: false
			});

			return true;
		} catch (error) {
			console.error('Error sending email notification:', error);
			return false;
		}
	}

	private static generateEmailBody(match: Match): string {
		return `
      <h2>New Match Found! 🎯</h2>
      <p>We found a potential match for your listing "${match.listing_title}"</p>
      <p><strong>Match Score:</strong> ${Math.round(match.score * 100)}%</p>
      <p><strong>Matched Item:</strong> ${match.matched_listing_title}</p>
      <p><strong>Category:</strong> ${match.matched_listing_category}</p>
      <p><strong>Location:</strong> ${match.matched_listing_location}</p>
      <p><strong>Match Reasons:</strong></p>
      <ul>
        ${match.match_reasons.map(reason => `<li>${reason}</li>`).join('')}
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/matches">View Match Details</a></p>
    `;
	}

	private static async storeNotificationRecord(notification: {
		user_id: string;
		type: string;
		message: string;
		listing_id: string;
		claim_id: string | null;
		is_read: boolean;
	}): Promise<void> {
		try {
			await supabase
				.from('notifications')
				.insert(notification);
		} catch (error) {
			console.error('Error storing notification record:', error);
		}
	}
}

// SMS notification hooks and placeholders
export class SMSNotificationService {
	static async sendMatchSMS(match: Match, phoneNumber: string): Promise<boolean> {
		try {
			// TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
			console.log('SMS notification placeholder:', {
				to: phoneNumber,
				message: this.generateSMSMessage(match),
				match
			});

			// Store notification record
			await this.storeNotificationRecord({
				user_id: match.listing_user_id,
				type: 'match_found',
				message: `SMS sent: ${Math.round(match.score * 100)}% match for "${match.listing_title}"`,
				listing_id: match.listing_id,
				claim_id: null,
				is_read: false
			});

			return true;
		} catch (error) {
			console.error('Error sending SMS notification:', error);
			return false;
		}
	}

	private static generateSMSMessage(match: Match): string {
		return `FindIt: New ${Math.round(match.score * 100)}% match found for "${match.listing_title}". View at ${process.env.NEXT_PUBLIC_APP_URL}/matches`;
	}

	private static async storeNotificationRecord(notification: {
		user_id: string;
		type: string;
		message: string;
		listing_id: string;
		claim_id: string | null;
		is_read: boolean;
	}): Promise<void> {
		try {
			await supabase
				.from('notifications')
				.insert(notification);
		} catch (error) {
			console.error('Error storing notification record:', error);
		}
	}
}

// Main notification orchestrator
export class NotificationOrchestrator {
	static async sendMatchNotifications(match: Match, userPreferences: {
		email?: string;
		phone?: string;
		webNotifications?: boolean;
		emailNotifications?: boolean;
		smsNotifications?: boolean;
	}): Promise<void> {
		const promises: Promise<boolean>[] = [];

		// Web notifications
		if (userPreferences.webNotifications) {
			promises.push(WebNotificationService.sendMatchNotification(match, match.listing_user_id));
		}

		// Email notifications
		if (userPreferences.emailNotifications && userPreferences.email) {
			promises.push(EmailNotificationService.sendMatchEmail(match, userPreferences.email));
		}

		// SMS notifications
		if (userPreferences.smsNotifications && userPreferences.phone) {
			promises.push(SMSNotificationService.sendMatchSMS(match, userPreferences.phone));
		}

		try {
			await Promise.allSettled(promises);
		} catch (error) {
			console.error('Error sending match notifications:', error);
		}
	}
}

// Utility to send email notification via our API endpoint
export async function sendEmailNotification({
	user_id,
	type,
	message,
	listing_title,
	claim_status
}: {
	user_id: string;
	type: NotificationType;
	message: string;
	listing_title?: string;
	claim_status?: string;
}) {
	try {
		const response = await fetch('/api/send-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ user_id, type, message, listing_title, claim_status }),
		});

		if (!response.ok) {
			console.error('Failed to send email notification:', response.statusText);
		}
	} catch (error) {
		console.error('Error sending email notification:', error);
		// Don't throw the error to prevent breaking the claim action
	}
}

// Function to get notifications for a user
export async function getUserNotifications(userId: string) {
	const { data, error } = await supabase
		.from('notifications')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching notifications:', error);
		return [];
	}

	return data || [];
}

// Function to mark notification as read
export async function markNotificationAsRead(notificationId: string) {
	const { error } = await supabase
		.from('notifications')
		.update({ is_read: true })
		.eq('id', notificationId);

	if (error) {
		console.error('Error marking notification as read:', error);
	}
}

// Function to get unread notification count
export async function getUnreadNotificationCount(userId: string) {
	const { count, error } = await supabase
		.from('notifications')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('is_read', false);

	if (error) {
		console.error('Error getting unread count:', error);
		return 0;
	}

	return count || 0;
} 