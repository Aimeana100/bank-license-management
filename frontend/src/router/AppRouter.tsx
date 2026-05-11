import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { useAuth } from '../contexts/useAuth'
import { LoginPage } from '../pages/auth/LoginPage'

function DashboardPlaceholder() {
  const { user, logout } = useAuth()

  return (
    <section className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-[440px]">
        <CardHeader>
          <CardTitle>Welcome, {user?.names}</CardTitle>
          <CardDescription>Logged in</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={logout}>Log out</Button>
        </CardContent>
      </Card>
    </section>
  )
}

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
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
        </Route>
        <Route path="*" element={<RouteGate />} />
      </Routes>
    </BrowserRouter>
  )
}
