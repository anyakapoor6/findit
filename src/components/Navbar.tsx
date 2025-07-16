'use client'

import Link from 'next/link';
import styled from 'styled-components';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { createSupabaseClient } from '../utils/supabaseClient';
const supabase = createSupabaseClient();
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

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    flex-direction: row;
    gap: 0.5rem;
  }
  
  @media (max-width: 640px) {
    padding: 0.5rem 1rem;
    flex-direction: column;
    gap: 0.75rem;
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
  justify-content: center;
  
  @media (min-width: 640px) {
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    gap: 0.25rem;
  }
`;
const Spacer = styled.div`
  flex: 1;
`;

const NavLink = styled(Link) <{ $variant?: 'default' | 'primary'; $isActive?: boolean }>`
  padding: 0.75rem 1.1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 1.15rem;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: #111;
  cursor: pointer;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
  }
  
  ${({ $variant = 'default', $isActive }) => {
    switch ($variant) {
      case 'default':
        return `
          background: ${$isActive ? 'rgba(37, 99, 235, 0.1)' : 'none'};
          color: ${$isActive ? '#2563eb' : '#111'};
          font-weight: ${$isActive ? '600' : '500'};
          border: ${$isActive ? '1px solid rgba(37, 99, 235, 0.2)' : 'none'};
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
  
  @media (max-width: 768px) {
    right: -1rem;
    min-width: 280px;
    max-width: calc(100vw - 2rem);
  }
  
  @media (max-width: 640px) {
    right: -0.5rem;
    min-width: 260px;
    max-width: calc(100vw - 1rem);
    top: 2.5rem;
  }
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
  flex-direction: column;
  gap: 0.3rem;
  &:last-child { border-bottom: none; }
  &:hover { background: #e0e7ef; }
`;

const NotifContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
`;

const NotifText = styled.div`
  flex: 1;
  line-height: 1.4;
`;

const NotifTime = styled.div`
  font-size: 0.8rem;
  color: #888;
  font-weight: 400;
`;
const NotifDot = styled.span`
  width: 8px;
  height: 8px;
  background: #2563eb;
  border-radius: 50%;
  display: inline-block;
`;

// FIXED: Added loading skeleton for navbar
const NavSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 2.5rem;
`;

const SkeletonLink = styled.div`
  width: 80px;
  height: 2rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 0.5rem;
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function Navbar() {
  const router = useRouter();
  // FIXED: Client-side only pathname state with better initialization
  const [pathname, setPathname] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifUser, setNotifUser] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // FIXED: Client-side only effect to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  // FIXED: Reset state when pathname changes to prevent corruption
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    // Reset dropdown and other state when navigating
    setShowDropdown(false);

    // Get initial pathname
    setPathname(window.location.pathname);

    // Listen for route changes using popstate
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        const newPathname = window.location.pathname;
        setPathname(newPathname);
        // Reset state on navigation
        setShowDropdown(false);
      }
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handleRouteChange);

    // Also listen for pushState/replaceState changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleRouteChange);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      }
    };
  }, [isClient]);

  // FIXED: Auth check effect with proper loading state and guards
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setNotifUser(data.session?.user || null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setNotifUser(null);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setNotifUser(session?.user || null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [isClient]);

  // FIXED: Force reset state on window focus to handle edge cases
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    const handleFocus = () => {
      // Reset state when window regains focus (e.g., after modal interactions)
      setShowDropdown(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Reset dropdown if clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isClient]);

  // FIXED: Cleanup effect to reset state on unmount
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setShowDropdown(false);
      setNotifications([]);
      setHasUnread(false);
    };
  }, []);

  // Real-time notification subscription
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    if (notifUser) {
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
    }
  }, [notifUser, isClient]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    if (showDropdown && notifUser) {
      setNotifLoading(true);
      supabase
        .from('notifications')
        .select(`
          id,
          type,
          message,
          created_at,
          is_read,
          listing_id,
          claim_id
        `)
        .eq('user_id', notifUser.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setNotifications(data || []);
          setNotifLoading(false);
          setHasUnread(Boolean((data || []).some(n => !n.is_read)));
        });
    }
  }, [showDropdown, notifUser, isClient]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown, isClient]);

  // Mark notification as read
  const markAsRead = async (notifId: string) => {
    setNotifications((prev) => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
  };

  // Get notification message based on type
  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'match_found':
        return '🎯 New match found for your listing!';
      case 'match_updated':
        return '📝 A match for your listing has been updated.';
      case 'claim_submitted':
        return '📋 New claim submitted for your listing!';
      case 'claim_accepted':
        return '✅ Your claim was accepted!';
      default:
        return notification.message || '🔔 You have a new notification.';
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp: string) => {
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

  // FIXED: Helper function to check if a link is active
  const isActiveLink = (href: string) => {
    if (!isClient || !pathname || typeof window === 'undefined') return false;

    // Handle exact matches and special cases
    if (href === '/') {
      return pathname === '/';
    }

    // Handle other routes
    return pathname.startsWith(href);
  };

  // FIXED: Don't render anything until client-side hydration is complete
  if (!isClient || isLoading) {
    return (
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
            FindIt
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '20px', background: '#f3f4f6', borderRadius: '4px' }}></div>
            <div style={{ width: '80px', height: '20px', background: '#f3f4f6', borderRadius: '4px' }}></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <Nav>
      <NavContainer>
        <Link href="/">
          <Logo>FindIt</Logo>
        </Link>
        <NavLinks>
          <NavLink
            href="/"
            $variant="default"
            $isActive={isActiveLink('/')}
          >
            Home
          </NavLink>
          <NavLink
            href="/create-listing"
            $variant="default"
            $isActive={isActiveLink('/create-listing')}
          >
            Create Listing
          </NavLink>
          <NavLink
            href="/map"
            $variant="default"
            $isActive={isActiveLink('/map')}
          >
            Map
          </NavLink>
          <NavLink
            href="/matches"
            $variant="default"
            $isActive={isActiveLink('/matches')}
          >
            Matches
          </NavLink>
          <Spacer />
          <NavLink
            href="/profile"
            $variant="default"
            $isActive={isActiveLink('/profile')}
          >
            Profile
          </NavLink>
          <NavLink
            href="/contact"
            $variant="default"
            $isActive={isActiveLink('/contact')}
          >
            Contact
          </NavLink>
        </NavLinks>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <BellButton
            onClick={() => {
              console.log('Bell clicked, current dropdown state:', showDropdown);
              setShowDropdown(!showDropdown);
            }}
            aria-label="Notifications"
          >
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
                    if (n.type === 'match_found' || n.type === 'match_updated') {
                      router.push('/matches');
                    }
                  }}
                >
                  {!n.is_read && <NotifDot />}
                  <NotifContent>
                    <NotifText>
                      {getNotificationMessage(n)}
                      {n.listing_id && !getNotificationMessage(n).includes('listing') && (
                        <NotifListingTitle listingId={n.listing_id} />
                      )}
                    </NotifText>
                    <NotifTime>{formatNotificationTime(n.created_at)}</NotifTime>
                  </NotifContent>
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