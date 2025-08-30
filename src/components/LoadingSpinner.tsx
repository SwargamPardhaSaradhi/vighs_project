import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const LoadingSpinner: React.FC = () => {
  const { clearSession } = useAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    // Show timeout message after 8 seconds
    const timeoutId = setTimeout(() => {
      setShowTimeout(true)
    }, 8000)

    // Force redirect after 12 seconds
    const forceRedirectId = setTimeout(() => {
      console.log('Loading timeout reached, clearing session and redirecting')
      clearSession()
      window.location.href = '/'
    }, 12000)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(forceRedirectId)
    }
  }, [clearSession])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        {showTimeout && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Taking longer than expected? You'll be redirected to the home page shortly.
            </p>
            <button
              onClick={() => {
                clearSession()
                window.location.href = '/'
              }}
              className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              Go to home page now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}