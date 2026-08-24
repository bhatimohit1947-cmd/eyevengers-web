"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SideDrawer } from "@/components/layout/SideDrawer";
import { LoginModal } from "@/components/layout/LoginModal";
import { GoogleOAuthProvider } from '@react-oauth/google';

export function ClientLayoutRenderer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <main className="flex-1 min-h-full flex flex-col">{children}</main>;
  }

  // Use the env variable or a dummy one if not provided so the app doesn't crash
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock_google_client_id';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <SideDrawer />
      <LoginModal />
    </GoogleOAuthProvider>
  );
}
