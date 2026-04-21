import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { AppLayout } from './layouts/AppLayout'
import { Toaster } from './components/ui/sonner'

import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Workouts } from './pages/Workouts'
import { NewWorkout } from './pages/NewWorkout'
import { Exercises } from './pages/Exercises'
import { AICoach } from './pages/AICoach'
import { Profile } from './pages/Profile'
import { MonthlyReport } from './pages/MonthlyReport'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workouts/new" element={<NewWorkout />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/coach" element={<AICoach />} />
              <Route path="/reports" element={<MonthlyReport />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
