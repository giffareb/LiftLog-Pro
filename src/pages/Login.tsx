import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Activity } from 'lucide-react'
import { toast } from 'sonner'

export function Login() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseConfigured()) {
      toast.error("Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings first.")
      return
    }

    setLoading(true)
    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        toast.success("Registration successful! You are now logged in.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success("Welcome back!")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-none rounded-xl border-border bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-white font-black text-2xl">
              L
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">LiftLog Pro</CardTitle>
          <CardDescription className="text-muted-foreground">
            {isRegistering ? "Create a new account" : "Sign in to track your workouts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <Button className="w-full font-semibold" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isRegistering ? "Sign Up" : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border py-4 mt-2">
          <Button 
            variant="link" 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
