'use client';

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
      <Toaster position="bottom-left" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontWeight: 600 } }} />
      {!isAdmin && <Navbar />}
      <main className={!isAdmin ? "min-h-screen" : ""}>
        {children}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <ChatbotWidget />}
    </GoogleOAuthProvider>
  );
}
