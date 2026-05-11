import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { useAuth } from '../contexts/useAuth'
import { ApplicationDetailsPage } from '../pages/applications/ApplicationDetailsPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { DashboardPage } from '../pages/reviewer-dashboard/DashboardPage'
import { AdminLayout } from '../pages/admin/layout/AdminLayout'
import { AuditLogsPage } from '../pages/admin/AuditLogsPage'

function RouteGate() {
  const { isAuthenticated } = useAuth()
  return <Navigate replace to={isAuthenticated ? '/dashboard' : '/login'} />
}

function AdminRoute() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
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

        {/* Admin section — ADMIN role only, shared layout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/audit" element={<AuditLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<RouteGate />} />
      </Routes>
    </BrowserRouter>
  )
}
