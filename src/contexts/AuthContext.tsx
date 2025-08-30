import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Farmer } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: Farmer | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearSession: () => void
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
  const [sessionCheckAttempts, setSessionCheckAttempts] = useState(0)
  const MAX_SESSION_CHECK_ATTEMPTS = 3

  const clearSession = () => {
    setUser(null)
    setLoading(false)
    localStorage.clear()
    sessionStorage.clear()
  }

  const handleSessionError = () => {
    console.log('Session error detected, clearing session and redirecting to home')
    clearSession()
    // Force navigation to home page
    window.location.href = '/'
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    // Check for existing session
    const checkUser = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.log('Session check timeout, clearing session')
          handleSessionError()
        }, 10000) // 10 second timeout

        const { data: { session } } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        if (session?.user) {
          // Fetch farmer details
          const { data: farmer } = await supabase
            .from('farmers')
            .select('*')
            .eq('email', session.user.email)
            .single()
          
          if (farmer) {
            setUser(farmer)
            setSessionCheckAttempts(0)
          } else {
            throw new Error('Farmer data not found')
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('Session check error:', error)
        
        setSessionCheckAttempts(prev => prev + 1)
        
        if (sessionCheckAttempts >= MAX_SESSION_CHECK_ATTEMPTS) {
          console.log('Max session check attempts reached, clearing session')
          handleSessionError()
        } else {
          // Try again after a short delay
          setTimeout(() => {
            if (sessionCheckAttempts < MAX_SESSION_CHECK_ATTEMPTS) {
              checkUser()
            }
          }, 2000)
        }
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          const { data: farmer, error } = await supabase
            .from('farmers')
            .select('*')
            .eq('email', session.user.email)
            .single()
          
          if (error || !farmer) {
            console.error('Error fetching farmer data:', error)
            handleSessionError()
            return
          }
          
          setUser(farmer)
          setSessionCheckAttempts(0)
        } else {
          setUser(null)
        }
        setLoading(false)
      } catch (error) {
        console.error('Auth state change error:', error)
        handleSessionError()
      }
    })

    // Handle page visibility changes and beforeunload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden (tab switch, minimize, etc.)
        // Don't clear session here, just log it
        console.log('Page visibility changed to hidden')
      }
    }

    const handleBeforeUnload = () => {
      // Page is being unloaded (refresh, close, navigate away)
      console.log('Page is being unloaded')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
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
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error during sign out:', error)
    } finally {
      clearSession()
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    clearSession
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}