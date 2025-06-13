import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const fredoka = Fredoka({ subsets: ["latin"], display: "swap", variable: '--font-sans' });

export const metadata: Metadata = {
  title: "GameGen AI - No-Code Game Maker",
  description: "Create custom games with AI - No coding required!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fredoka.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
