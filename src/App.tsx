import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoadingSpinner } from './components/LoadingSpinner'
import { HomePage } from './pages/HomePage'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { CropDiagnosis } from './pages/CropDiagnosis'
import { Crops } from './pages/Crops'
import { Schedules } from './pages/Schedules'
import { Pesticides } from './pages/Pesticides'
import { Profile } from './pages/Profile'

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={!user ? <HomePage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/auth" 
          element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crop-diagnosis" 
          element={
            <ProtectedRoute>
              <Layout>
                <CropDiagnosis />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crops" 
          element={
            <ProtectedRoute>
              <Layout>
                <Crops />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedules" 
          element={
            <ProtectedRoute>
              <Layout>
                <Schedules />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pesticides" 
          element={
            <ProtectedRoute>
              <Layout>
                <Pesticides />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App