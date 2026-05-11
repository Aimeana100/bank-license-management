import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuth } from '../../contexts/useAuth'

type LoginPageProps = {
  mode: 'login' | 'register'
}

export function LoginPage({ mode }: LoginPageProps) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { message?: string } | null
  const [names, setNames] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await login({ email, password })
        navigate('/dashboard', { replace: true })
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }

        await register({ names, email, password, confirmPassword })
        navigate('/login', {
          replace: true,
          state: { message: 'Account created. Please sign in.' },
        })
      }
    } catch {
      setError('Request failed. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-[440px]">
        <CardHeader>
          <CardTitle>{isLogin ? 'Sign in to continue' : 'Create your account'}</CardTitle>
          <CardDescription>
            {isLogin
              ? 'Use your registered account to access the portal.'
              : 'Register as an applicant to start submitting applications.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin && state?.message ? (
            <Alert className="mb-3" variant="success">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert className="mb-3" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form className="grid gap-3" onSubmit={onSubmit}>
            {!isLogin ? (
              <div className="grid gap-1.5">
                <Label htmlFor="names">Full names</Label>
                <Input
                  autoComplete="name"
                  id="names"
                  onChange={(event) => setNames(event.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                  value={names}
                />
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                id="password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>

            {!isLogin ? (
              <div className="grid gap-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  autoComplete="new-password"
                  id="confirm-password"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  type="password"
                  value={confirmPassword}
                />
              </div>
            ) : null}

            <Button className="mt-1 w-full" disabled={loading} type="submit">
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-amber-900/75">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Link
              className="font-semibold text-amber-950 underline-offset-2 hover:underline"
              to={isLogin ? '/register' : '/login'}
            >
              {isLogin ? 'Register' : 'Sign in'}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
