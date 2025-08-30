import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Farmer } from '../lib/supabase'

interface AuthContextType {
  user: Farmer | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Fetch farmer details
          const { data: farmer } = await supabase
            .from('farmers')
            .select('*')
            .eq('email', session.user.email)
            .single()
          setUser(farmer)
        }
        setLoading(false)
      } catch (error) {
        // If there's any session issue, redirect to home page
        console.error('Session check error:', error)
        setUser(null)
        setLoading(false)
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: farmer } = await supabase
          .from('farmers')
          .select('*')
          .eq('email', session.user.email)
          .single()
        setUser(farmer)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: any) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Insert farmer data
    const { error: insertError } = await supabase
      .from('farmers')
      .insert([{ email, password, ...userData }])
    
    if (insertError) throw insertError
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}