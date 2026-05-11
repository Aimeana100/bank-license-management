import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { useAuth } from '../contexts/useAuth'
import { ApplicationDetailsPage } from '../pages/applications/ApplicationDetailsPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'

function RouteGate() {
  const { isAuthenticated } = useAuth()
  return <Navigate replace to={isAuthenticated ? '/dashboard' : '/login'} />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RouteGate />} />
        <Route path="/login" element={<LoginPage mode="login" />} />
        <Route path="/register" element={<LoginPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailsPage />} />
        </Route>
        <Route path="*" element={<RouteGate />} />
      </Routes>
    </BrowserRouter>
  )
}
