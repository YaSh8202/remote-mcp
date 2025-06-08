import { Link } from '@tanstack/react-router'
import { signOut, useSession } from '../lib/auth-client'
import { Button } from './ui/button'

export default function Header() {
  const { data: session, isPending } = useSession()

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        {session?.user && (
          <div className="px-2 font-bold">
            <Link to="/dashboard">Dashboard</Link>
          </div>
        )}

        <div className="px-2 font-bold">
          <Link to="/demo/neon">Neon</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/sentry/testing">Sentry</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/server-funcs">Start - Server Functions</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/api-request">Start - API Request</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/tanstack-query">TanStack Query</Link>
        </div>
      </nav>
      
      <div className="flex items-center gap-2">
        {isPending ? (
          <div>Loading...</div>
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">Hello, {session.user.name}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <Button variant="default" size="sm">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
