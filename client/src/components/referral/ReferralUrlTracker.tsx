"use client";

import { useEffect } from 'react';

export function ReferralUrlTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('referral');
      if (refCode) {
        localStorage.setItem('eyevengers_referred_by', refCode.toUpperCase().trim());
        // Also keep in cookie for cross-tab persistence
        document.cookie = `eyevengers_ref=${refCode.toUpperCase().trim()}; path=/; max-age=2592000`; // 30 days
      }
    } catch (e) {
      console.error("Failed to capture referral code from URL", e);
    }
  }, []);

  return null;
}
