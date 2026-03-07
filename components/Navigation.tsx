'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAuthSession, signOut, fetchUserAttributes } from 'aws-amplify/auth'
import { Amplify } from 'aws-amplify'
import { awsConfig } from '@/lib/awsConfig'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

// Configure Amplify
Amplify.configure(awsConfig, { ssr: true });

interface UserData {
  email?: string;
  given_name?: string;
  family_name?: string;
}

export default function Navigation() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        const attributes = await fetchUserAttributes();
        setUser({
          email: attributes.email,
          given_name: attributes.given_name,
          family_name: attributes.family_name,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ global: true });
      setUser(null);
      // Clear any cached data
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (email?: string) => {
    if (!email) return '??';
    return email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.given_name && user?.family_name) {
      return `${user.given_name} ${user.family_name}`;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  if (loading) {
    return (
      <nav className="bg-cream/90 dark:bg-background-dark/95 backdrop-blur-md border-b border-cream-dark/30 dark:border-border-dark sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl">🎯</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent group-hover:from-primary-light group-hover:to-primary transition-all">
                  DevSpeak AI
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-cream/90 dark:bg-background-dark/95 backdrop-blur-md border-b border-cream-dark/30 dark:border-border-dark sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🎯</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent group-hover:from-primary-light group-hover:to-primary transition-all">
                DevSpeak AI
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white font-semibold">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-cream dark:bg-surface-dark border-cream-dark/30 dark:border-border-dark" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-foreground">{getDisplayName()}</p>
                      <p className="text-xs text-text-secondary">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cream-dark/30 dark:bg-border-dark" />
                  <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary cursor-pointer">
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-primary/10 hover:text-primary cursor-pointer">
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-cream-dark/30 dark:bg-border-dark" />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 cursor-pointer">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary text-white font-semibold px-6 rounded-full shadow-md hover:shadow-lg transition-all">
                <Link href="/login">
                  Get Started
                </Link>
              </Button>
            )}
          </div>
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
