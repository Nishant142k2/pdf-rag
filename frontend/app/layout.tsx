import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import {JSX} from 'react'
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PDF RAG',
  description: 'PDF RAG is a web application that allows you to upload PDF documents and query them using natural language processing.',
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>): JSX.Element {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}>
          {/* Header - Only show on authenticated pages */}
          <SignedIn>
            <header className="flex justify-between items-center p-4 gap-4 h-16 bg-gray-800 border-b border-gray-700">
              <h1 className="text-xl font-bold text-white">PDF RAG</h1>
              <div className="flex items-center gap-4">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "bg-gray-800 border-gray-700",
                      userButtonPopoverActionButton: "hover:bg-gray-700",
                    }
                  }}
                />
              </div>
            </header>
          </SignedIn>
          
          {/* Main Content */}
          <main className="min-h-screen">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}