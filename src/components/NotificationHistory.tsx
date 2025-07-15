'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createSupabaseClient } from '../utils/supabaseClient';
import type { MatchNotification } from '../lib/types';

const supabase = createSupabaseClient();

const Container = styled.div`
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #dbeafe;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111;
`;

const NotificationItem = styled.div<{ $read: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  background: ${({ $read }) => $read ? '#f9fafb' : '#eff6ff'};
  border: 1px solid ${({ $read }) => $read ? '#e5e7eb' : '#dbeafe'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ $read }) => $read ? '#f3f4f6' : '#dbeafe'};
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const NotificationTitle = styled.div`
  font-weight: 600;
  color: #111;
  font-size: 1rem;
`;

const NotificationTime = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const NotificationContent = styled.div`
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const NotificationType = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $type }) =>
		$type === 'match_found' ? '#dbeafe' : '#fef3c7'
	};
  color: ${({ $type }) =>
		$type === 'match_found' ? '#1e40af' : '#92400e'
	};
  margin-bottom: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const EmptyStateTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111;
`;

const EmptyStateText = styled.p`
  font-size: 0.875rem;
  color: #666;
`;

const MarkAllReadButton = styled.button`
  background: #2563eb;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  &:hover {
    background: #1d4ed8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface NotificationHistoryProps {
	userId: string;
}

export default function NotificationHistory({ userId }: NotificationHistoryProps) {
	const [notifications, setNotifications] = useState<MatchNotification[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadNotifications = async () => {
			try {
				const { data, error } = await supabase
					.from('match_notifications')
					.select('*')
					.eq('user_id', userId)
					.order('sent_at', { ascending: false })
					.limit(50);

				if (error) {
					console.error('Error loading notifications:', error);
					return;
				}

				setNotifications(data || []);
			} catch (error) {
				console.error('Error loading notifications:', error);
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			loadNotifications();
		}
	}, [userId]);

	const markAsRead = async (notificationId: string) => {
		try {
			const { error } = await supabase
				.from('match_notifications')
				.update({ read_at: new Date().toISOString() })
				.eq('id', notificationId);

			if (error) {
				console.error('Error marking notification as read:', error);
				return;
			}

			setNotifications(prev =>
				prev.map(notification =>
					notification.id === notificationId
						? { ...notification, read_at: new Date().toISOString() }
						: notification
				)
			);
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	};

	const markAllAsRead = async () => {
		try {
			const { error } = await supabase
				.from('match_notifications')
				.update({ read_at: new Date().toISOString() })
				.eq('user_id', userId)
				.is('read_at', null);

			if (error) {
				console.error('Error marking all notifications as read:', error);
				return;
			}

			setNotifications(prev =>
				prev.map(notification => ({
					...notification,
					read_at: notification.read_at || new Date().toISOString()
				}))
			);
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			return 'Just now';
		} else if (diffInHours < 24) {
			return `${Math.floor(diffInHours)}h ago`;
		} else {
			return date.toLocaleDateString();
		}
	};

	const getNotificationMessage = (notification: MatchNotification) => {
		switch (notification.notification_type) {
			case 'match_found':
				return 'We found a potential match for your listing!';
			case 'match_updated':
				return 'A match for your listing has been updated.';
			default:
				return 'You have a new notification.';
		}
	};

	const unreadCount = notifications.filter(n => !n.read_at).length;

	if (loading) {
		return <Container>Loading notifications...</Container>;
	}

	return (
		<Container>
			<Title>Notifications ({notifications.length})</Title>

			{unreadCount > 0 && (
				<MarkAllReadButton onClick={markAllAsRead}>
					Mark all as read ({unreadCount})
				</MarkAllReadButton>
			)}

			{notifications.length === 0 ? (
				<EmptyState>
					<EmptyStateTitle>No notifications yet</EmptyStateTitle>
					<EmptyStateText>
						You'll see notifications here when we find matches for your listings.
					</EmptyStateText>
				</EmptyState>
			) : (
				notifications.map(notification => (
					<NotificationItem
						key={notification.id}
						$read={!!notification.read_at}
						onClick={() => !notification.read_at && markAsRead(notification.id)}
					>
						<NotificationHeader>
							<NotificationTitle>
								{getNotificationMessage(notification)}
							</NotificationTitle>
							<NotificationTime>
								{formatTime(notification.sent_at)}
							</NotificationTime>
						</NotificationHeader>

						<NotificationType $type={notification.notification_type}>
							{notification.notification_type.replace('_', ' ')}
						</NotificationType>

						<NotificationContent>
							Sent via {notification.sent_via}
						</NotificationContent>
					</NotificationItem>
				))
			)}
		</Container>
	);
} 