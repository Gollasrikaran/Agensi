import { supabase } from './supabase';
import { showToast } from './toast';

/**
 * Gets or auto-generates a unique referral ID for the current user or guest.
 * For authenticated users, derives a unique REF- code from their user ID.
 * For guests, generates a persistent device-bound referral code in localStorage.
 */
export async function getReferralId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      // Create a clean short unique referral ID from their UUID, e.g. "REF-121F574F"
      const cleanId = session.user.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      return `REF-${cleanId}`;
    }
  } catch (e) {
    console.error("Error fetching session for referral:", e);
  }

  // Guest fallback: persistent localStorage referral ID
  if (typeof window !== 'undefined') {
    let guestRef = localStorage.getItem('bodhic_my_ref_id');
    if (!guestRef) {
      guestRef = `REF-G${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem('bodhic_my_ref_id', guestRef);
    }
    return guestRef;
  }

  return 'REF-BODHIC';
}

/**
 * Generates a full shareable URL with the user's unique referral tag.
 */
export async function getShareableUrl(path: string = ''): Promise<string> {
  const refId = await getReferralId();
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (import.meta.env.PUBLIC_API_URL || 'https://bodhicai.onrender.com');
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const separator = cleanPath.includes('?') ? '&' : '?';
  
  return `${baseUrl}${cleanPath}${separator}ref=${refId}`;
}

/**
 * Automatically captures incoming referral links from WhatsApp or social shares.
 * Should be called once on app initialization (e.g., in Navbar or core components).
 */
export function captureReferralFromUrl(): void {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    
    if (refCode && !localStorage.getItem('bodhic_referred_by_notified')) {
      localStorage.setItem('bodhic_referred_by', refCode);
      localStorage.setItem('bodhic_referred_by_notified', 'true');
      
      showToast(`🎉 Referral code ${refCode} unlocked! You will get 50 bonus credits upon signing up!`, 'success');
    }
  } catch (e) {
    console.error("Error capturing referral code:", e);
  }
}
