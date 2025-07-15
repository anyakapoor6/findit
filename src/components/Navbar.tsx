'use client'

import Link from 'next/link';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getListing } from '../lib/listings';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 30;
  background: linear-gradient(to right, #eff6ff, #ffffff, #dbeafe);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #dbeafe;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
`

const Logo = styled.span`
  font-size: 2.25rem;
  font-weight: 800;
  color: #1d4ed8;
  letter-spacing: -0.025em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  cursor: pointer;
  @media (min-width: 640px) {
    font-size: 2.5rem;
  }
`

const NavLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  @media (min-width: 640px) {
    gap: 1rem;
  }
`;
const Spacer = styled.div`
  flex: 1;
`;

const NavLink = styled(Link) <{ $variant?: 'default' | 'primary' }>`
  padding: 0.75rem 1.1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 1.15rem;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: #111;
  cursor: pointer;
  ${({ $variant = 'default' }) => {
    switch ($variant) {
      case 'default':
        return `
          background: none;
          &:hover {
            background-color: rgba(59, 130, 246, 0.1);
          }
        `
      case 'primary':
        return `
          background-color: #2563eb;
          color: white;
          font-weight: 600;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          &:hover {
            background-color: #1d4ed8;
          }
        `
    }
  }}
`

const BellButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  margin-left: 1.5rem;
  display: flex;
  align-items: center;
  font-size: 1.7rem;
  color: #2563eb;
`;
const BellDot = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #dc2626;
  border-radius: 50%;
  border: 2px solid #fff;
`;
const NotifDropdown = styled.div`
  position: absolute;
  right: 0;
  top: 2.8rem;
  min-width: 320px;
  max-width: 380px;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
  border: 1.5px solid #dbeafe;
  z-index: 100;
  padding: 0.5rem 0;
`;
const NotifItem = styled.div<{ $unread?: boolean }>`
  padding: 0.85rem 1.2rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 1.05rem;
  color: #222;
  background: ${({ $unread }) => $unread ? '#f0f6ff' : '#fff'};
  font-weight: ${({ $unread }) => $unread ? 700 : 500};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  &:last-child { border-bottom: none; }
  &:hover { background: #e0e7ef; }
`;
const NotifDot = styled.span`
  width: 8px;
  height: 8px;
  background: #2563eb;
  border-radius: 50%;
  display: inline-block;
`;

export default function Navbar() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifUser, setNotifUser] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current user for notifications
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setNotifUser(data.session?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setNotifUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Real-time notification subscription
  useEffect(() => {
    if (!notifUser) return;
    // Initial fetch for unread
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', notifUser.id)
        .eq('is_read', false)
        .limit(1);
      setHasUnread(Boolean(data && data.length > 0));
    };
    fetchUnread();
    // Subscribe to new notifications
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${notifUser.id}` },
        (payload) => {
          setHasUnread(true);
        }
      )
      .subscribe();
    // Polling fallback (every 15s)
    const interval = setInterval(fetchUnread, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [notifUser]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown && notifUser) {
      setNotifLoading(true);
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', notifUser.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setNotifications(data || []);
          setNotifLoading(false);
          setHasUnread(Boolean((data || []).some(n => !n.is_read)));
        });
    }
  }, [showDropdown, notifUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  // Mark notification as read
  const markAsRead = async (notifId: string) => {
    setNotifications((prev) => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  };

  return (
    <Nav>
      <NavContainer>
        <Link href="/">
          <Logo>FindIt</Logo>
        </Link>
        <NavLinks>
          <NavLink href="/" $variant="default">Home</NavLink>
          <NavLink href="/create-listing" $variant="default">Create Listing</NavLink>
          <NavLink href="/map" $variant="default">Map</NavLink>
          <NavLink href="/matches" $variant="default">Matches</NavLink>
          <Spacer />
          <NavLink href="/profile" $variant="default">Profile</NavLink>
          <NavLink href="/contact" $variant="default">Contact</NavLink>
        </NavLinks>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <BellButton onClick={() => setShowDropdown(v => !v)} aria-label="Notifications">
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {hasUnread && <BellDot />}
          </BellButton>
          {showDropdown && (
            <NotifDropdown ref={dropdownRef}>
              {notifLoading ? (
                <div style={{ padding: '1.2rem', textAlign: 'center', color: '#888' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '1.2rem', textAlign: 'center', color: '#888' }}>No notifications</div>
              ) : notifications.map(n => (
                <NotifItem
                  key={n.id}
                  $unread={!n.is_read}
                  onClick={async () => {
                    markAsRead(n.id);
                    if (n.type === 'claim_on_listing' || n.type === 'claim_submitted') {
                      router.push('/profile?tab=claims');
                    } else if (n.type === 'claim_update' || n.type === 'claim_accepted' || n.type === 'claim_rejected') {
                      router.push('/profile?tab=userClaims');
                    }
                  }}
                >
                  {!n.is_read && <NotifDot />}
                  <span>
                    {n.message}
                    {n.listing_id && !n.message.includes('listing') && (
                      <NotifListingTitle listingId={n.listing_id} />
                    )}
                  </span>
                </NotifItem>
              ))}
            </NotifDropdown>
          )}
        </div>
      </NavContainer>
    </Nav>
  );
}

// Helper component to fetch and display listing title
function NotifListingTitle({ listingId }: { listingId: string }) {
  const [title, setTitle] = useState<string>('');
  useEffect(() => {
    getListing(listingId).then(listing => setTitle(listing.title)).catch(() => { });
  }, [listingId]);
  return title ? `: ${title}` : '';
} 