import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Activity, Calendar, LayoutDashboard, LogOut, PlusCircle, Bot, User, Dumbbell, BarChart3 } from 'lucide-react'
import { Button } from '../components/ui/button'

export function AppLayout() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-8 w-8 mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading LiftLog...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-white font-black text-sm">L</div>
            LiftLog Pro
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 text-sm font-medium">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link to="/workouts" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <Calendar className="h-5 w-5" />
            My Workouts
          </Link>
          <Link to="/workouts/new" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <PlusCircle className="h-5 w-5" />
            New Workout
          </Link>
          <Link to="/exercises" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <Dumbbell className="h-5 w-5" />
            Exercises
          </Link>
          <Link to="/coach" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <Bot className="h-5 w-5" />
            AI Coach
          </Link>
          <Link to="/reports" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <BarChart3 className="h-5 w-5" />
            Monthly Reports
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <User className="h-5 w-5" />
            Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm truncate max-w-[150px]">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation - 6 items will use slightly smaller icons */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex justify-around p-2 pb-safe z-50">
        <Link to="/dashboard" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">Dash</span>
        </Link>
        <Link to="/workouts/new" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <PlusCircle className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">New</span>
        </Link>
        <Link to="/workouts" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <Calendar className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">Logs</span>
        </Link>
        <Link to="/exercises" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <Dumbbell className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">Exercises</span>
        </Link>
        <Link to="/coach" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <Bot className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">Coach</span>
        </Link>
        <Link to="/reports" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <BarChart3 className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">Report</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <User className="h-5 w-5" />
          <span className="text-[9px] mt-1 font-medium">Profile</span>
        </Link>
      </div>
    </div>
  )
}
