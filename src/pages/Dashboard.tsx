import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Activity, Dumbbell, Flame, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, subDays, startOfWeek, isSameDay } from 'date-fns'
import React, { useMemo } from 'react'

export function Dashboard() {
  const { user } = useAuth()

  // Fetch all workouts to calculate stats
  const { data: allWorkouts = [], isLoading } = useQuery({
    queryKey: ['dashboard-workouts', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          workout_templates ( name ),
          workout_sessions ( weight, reps )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      
      if (error) throw error
      
      return data.map((w: any) => {
        const totalVolume = w.workout_sessions?.reduce((acc: number, curr: any) => acc + ((curr.weight || 0) * (curr.reps || 0)), 0) || 0
        return {
           ...w,
           totalVolume,
           dateObj: new Date(w.date)
        }
      })
    },
    enabled: !!user
  })

  // Calculate Aggregates
  const stats = useMemo(() => {
    const totalWorkouts = allWorkouts.length
    
    // Weekly Volume
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weeklyVolume = allWorkouts
      .filter(w => w.dateObj >= startOfCurrentWeek)
      .reduce((sum, w) => sum + w.totalVolume, 0)
      
    // Streak Calculation (Simplistic: consecutive days starting from today or yesterday)
    let streak = 0
    let checkDate = new Date()
    // If no workout today, check if streak continued until yesterday
    const hasWorkoutToday = allWorkouts.some(w => isSameDay(w.dateObj, checkDate))
    if (!hasWorkoutToday) checkDate = subDays(checkDate, 1)
    
    while(true) {
       const hasWorkout = allWorkouts.some(w => isSameDay(w.dateObj, checkDate))
       if (hasWorkout) {
         streak++
         checkDate = subDays(checkDate, 1)
       } else {
         break
       }
    }

    // Chart Data (Last 6 workouts pseudo-chart)
    const recent6 = [...allWorkouts].slice(0, 6).reverse()
    const maxVol = Math.max(...recent6.map(w => w.totalVolume), 1) // Prevent division by zero

    return { totalWorkouts, weeklyVolume, streak, recent6, maxVol }
  }, [allWorkouts])

  const recentWorkouts = allWorkouts.slice(0, 3)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Summary</h1>
          <p className="text-muted-foreground mt-2">Welcome back to LiftLog Pro. Keep pushing your limits.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl overflow-hidden shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border mb-4 px-4 py-4 bg-muted/5">
            <CardTitle className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Total Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground mt-1">Sessions logged</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl overflow-hidden shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border mb-4 px-4 py-4 bg-muted/5">
            <CardTitle className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Weekly Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.weeklyVolume.toLocaleString()} <span className="text-[12px] text-emerald-500 font-normal">kg</span></div>
            <p className="text-[11px] text-emerald-500 mt-1">This week's effort</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl overflow-hidden shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border mb-4 px-4 py-4 bg-muted/5">
            <CardTitle className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <p className="text-[11px] text-muted-foreground mt-1">Don't break the streak!</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl overflow-hidden shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border mb-4 px-4 py-4 bg-muted/5">
            <CardTitle className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Latest Routine</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-violet-400 truncate pr-2">
               {recentWorkouts[0]?.workout_templates?.name || 'Custom Workout'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last performed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-xl overflow-hidden shadow-none border-border flex flex-col">
          <CardHeader className="border-b border-border p-4 bg-muted/5">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Progress Tracking</CardTitle>
          </CardHeader>
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-[12px] text-muted-foreground mb-4">Volume Over Time (Last {stats.recent6.length} Workouts)</div>
            <div className="flex-1 min-h-[220px] w-full flex items-end justify-between px-4 pb-2 border-b border-border">
              {stats.recent6.map((w, i) => {
                 const heightPct = Math.max((w.totalVolume / stats.maxVol) * 100, 5) // At least 5% height
                 return (
                   <div key={i} className="w-8 flex flex-col items-center justify-end h-full gap-2">
                     <div className="w-full bg-primary opacity-70 hover:opacity-100 rounded-t transition-opacity relative group" style={{ height: `${heightPct}%` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                           {w.totalVolume.toLocaleString()} kg
                        </div>
                     </div>
                   </div>
                 )
              })}
              {stats.recent6.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>
        </Card>
        
        <Card className="col-span-3 rounded-xl overflow-hidden shadow-none border-border flex flex-col">
          <CardHeader className="border-b border-border p-4 flex flex-row items-center justify-between space-y-0 bg-muted/5">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col flex-1">
             <div className="border-b border-border px-4 py-3 flex-1 flex flex-col">
               <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 mt-2">Recent Sessions</CardTitle>
               <div className="space-y-3 flex-1">
                 {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>}
                 {!isLoading && recentWorkouts.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 border border-dashed border-border rounded-lg">
                      <Dumbbell className="w-8 h-8 opacity-20 mb-2" />
                      <p className="text-xs text-muted-foreground mt-1">You haven't logged any workouts yet.</p>
                   </div>
                 )}
                 {!isLoading && recentWorkouts.map((w: any) => {
                    const workoutDate = new Date(w.date)
                    const distText = !isNaN(workoutDate.getTime()) 
                        ? formatDistanceToNow(workoutDate, { addSuffix: true }) 
                        : 'recently'

                    return (
                        <div key={w.id} className="flex items-center justify-between bg-white/5 border border-border rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="font-semibold text-sm max-w-[120px] truncate">{w.workout_templates?.name || 'Custom Workout'}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">{distText}</p>
                          </div>
                          <div className="text-xs font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                            {w.totalVolume.toLocaleString()} kg
                          </div>
                       </div>
                    )
                 })}
               </div>
             </div>
             
             <div className="p-4 mt-auto bg-muted/5">
               <Link to="/workouts/new">
                 <button className="w-full bg-primary text-primary-foreground border-none p-3 rounded-lg font-semibold cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
                   Start New Workout
                 </button>
               </Link>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
