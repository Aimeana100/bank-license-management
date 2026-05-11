import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/useAuth'
import { getRoleBadgeClass } from '../../../utils/application.util'

const NAV_ITEMS = [
  { to: '/admin/audit', label: 'Audit Logs' },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-amber-100 bg-white px-4 py-6">
        {/* Brand */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Licensing Portal
          </p>
          <p className="mt-0.5 text-lg font-bold text-amber-950">Admin</p>
        </div>

        {/* User */}
        <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-amber-950">
            {user?.names ?? '—'}
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass(user?.role)}`}
          >
            {user?.role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-100 text-amber-950'
                    : 'text-amber-800 hover:bg-amber-50 hover:text-amber-950'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="mt-6 space-y-1 border-t border-amber-100 pt-4">
          <button
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 hover:text-amber-950"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            ← Applications
          </button>
          <button
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            type="button"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
