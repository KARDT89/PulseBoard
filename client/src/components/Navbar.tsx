import { Link, useRouterState } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/api/auth-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth.api'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  IconLayoutDashboard,
  IconPlus,
  IconLogout,
  IconUser,
  IconMenu2,
  IconX,
  IconChartBar,
} from '@tabler/icons-react'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { to: '/polls/create', label: 'New Poll', icon: IconPlus },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout()
      queryClient.clear()
      toast.success('Logged out')
      navigate({ to: '/login' })
    },
    onError: () => toast.error('Failed to logout'),
  })

  if (!user) return null

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900" />

        {/* Red accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px">
          <div className="h-full bg-gradient-to-r from-transparent via-red-800/40 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-500 transition-colors">
                <IconChartBar size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold tracking-[0.15em] text-white uppercase">
                Pollify
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const isActive = currentPath === to || currentPath.startsWith(to + '/')
                return (
                  <Link key={to} to={to}>
                    <motion.div
                      className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-zinc-800 rounded-lg border border-zinc-700/60"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon size={14} className="relative z-10 shrink-0" />
                      <span className="relative z-10 font-medium">{label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* User menu — desktop */}
              <div className="hidden sm:block relative">
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase">
                      {user.name?.[0] ?? '?'}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-400 max-w-[120px] truncate">{user.name}</span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      {/* Click-away */}
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl shadow-black/40 z-20 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-zinc-900">
                          <p className="text-xs text-zinc-600 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm text-white font-medium mt-0.5 truncate">{user.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              logoutMutation.mutate()
                            }}
                            disabled={logoutMutation.isPending}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          >
                            <IconLogout size={14} />
                            {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((p) => !p)}
                className="sm:hidden p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                {mobileOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative sm:hidden border-t border-zinc-900 bg-zinc-950 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                  const isActive = currentPath === to
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-zinc-800 text-white border border-zinc-700/50'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                      }`}>
                        <Icon size={15} />
                        <span className="font-medium">{label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Mobile user section */}
              <div className="border-t border-zinc-900 px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <span className="text-xs font-bold text-zinc-300 uppercase">
                      {user.name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    logoutMutation.mutate()
                  }}
                  disabled={logoutMutation.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  <IconLogout size={14} />
                  {logoutMutation.isPending ? 'Logging out…' : 'Log out'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}