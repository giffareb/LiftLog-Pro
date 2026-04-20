import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Calendar, Dumbbell, ChevronDown, ChevronUp, Trash2, Loader2, Weight, CopyPlus, Pencil } from 'lucide-react'
import { Button } from '../components/ui/button'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'

export function Workouts() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          notes,
          workout_template_id,
          workout_templates ( name ),
          workout_sessions ( 
            id, 
            sets, 
            reps, 
            weight, 
            is_dropset, 
            notes,
            exercise_id,
            exercises ( name )
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("fetch error:", error)
        throw error
      }
      return data as any[]
    },
    enabled: !!user
  })

  const deleteWorkout = useMutation({
    mutationFn: async (workoutId: string) => {
       const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
       if (error) throw error
    },
    onSuccess: () => {
       toast.success("Workout deleted successfully")
       queryClient.invalidateQueries({ queryKey: ['workouts', user?.id] })
       // Also invalidate dashboard queries so they match
       queryClient.invalidateQueries({ queryKey: ['dashboard-workouts', user?.id] })
       queryClient.invalidateQueries({ queryKey: ['recent-workouts', user?.id] })
    },
    onError: (error: any) => {
       toast.error(error.message || "Failed to delete workout")
    }
  })

  // Group sessions by exercise name for expanded view
  const groupSessionsByExercise = (sessions: any[]) => {
    if (!sessions) return {}
    const grouped: Record<string, any[]> = {}
    
    // Sort sessions by set number to ensure correct ordering
    const sortedSessions = [...sessions].sort((a, b) => (a.sets || 0) - (b.sets || 0))
    
    sortedSessions.forEach(s => {
       let key = 'Unknown Exercise'
       if (s.exercises) {
          if (Array.isArray(s.exercises)) {
              key = s.exercises[0]?.name || key
          } else {
              key = s.exercises.name || key
          }
       }
       if (!grouped[key]) grouped[key] = []
       grouped[key].push(s)
    })
    return grouped
  }

  const handleCopyWorkout = (workout: any) => {
    navigate('/workouts/new', { state: { copyWorkout: workout } })
  }

  const handleEditWorkout = (workout: any) => {
    navigate('/workouts/new', { state: { editWorkout: workout } })
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Workouts</h1>
        <p className="text-muted-foreground mt-2">Log and view your past workout sessions.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <p className="text-muted-foreground text-sm flex items-center"><Loader2 className="animate-spin w-4 h-4 mr-2"/> Loading history...</p>
        ) : workouts?.length === 0 ? (
          <Card className="rounded-xl border-dashed border-border bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
              <p>No workouts found.</p>
            </CardContent>
          </Card>
        ) : (
          workouts?.map((workout) => {
            const isExpanded = expandedId === workout.id
            const groupedSessions = groupSessionsByExercise(workout.workout_sessions)
            const exerciseKeys = Object.keys(groupedSessions)

            return (
              <Card key={workout.id} className="rounded-xl shadow-none border-border bg-card overflow-hidden">
                <CardHeader 
                  className="p-4 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-muted/20"
                  onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/20 p-2 rounded-md">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {workout.workout_templates ? (Array.isArray(workout.workout_templates) ? workout.workout_templates[0]?.name : workout.workout_templates.name) : (workout.workout_sessions?.length === 0 && workout.notes ? 'Rest Day / Journal' : 'Custom Workout')}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                        {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="mx-2">&middot;</span>
                        {workout.workout_sessions?.length || 0} Sets
                      </CardDescription>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                
                <AnimatePresence>
                  {(!isExpanded && workout.notes) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <CardContent className="p-4 py-3">
                        <p className="text-xs text-muted-foreground bg-black/20 p-2 rounded border border-border line-clamp-1">
                          {workout.notes}
                        </p>
                      </CardContent>
                    </motion.div>
                  )}

                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <CardContent className="p-4 space-y-4">
                        {workout.notes && (
                          <div className="mb-4">
                            <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Workout Notes</h4>
                            <p className="text-sm bg-black/20 p-3 rounded-lg border border-border">
                              {workout.notes}
                            </p>
                          </div>
                        )}
                        
                        {exerciseKeys.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No exercises logged for this workout.</p>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Exercises Performed</h4>
                            {exerciseKeys.map((exName, idx) => (
                              <div key={idx} className="border border-border/50 rounded-lg overflow-hidden">
                                <div className="bg-muted/5 px-3 py-2 text-sm font-semibold border-b border-border/50">
                                  {exName}
                                </div>
                                <div className="divide-y divide-border/30">
                                  {groupedSessions[exName].map((session: any, sIdx: number) => (
                                    <div key={session.id} className="p-3 text-sm flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-4 text-muted-foreground">
                                            <span className="font-mono text-xs w-12 shrink-0">Set {session.sets}</span>
                                            <div className="flex items-center gap-1 font-medium text-foreground">
                                              <Weight className="w-3.5 h-3.5" />
                                              {session.weight} kg
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span>&times;</span>
                                              <span>{session.reps} reps</span>
                                            </div>
                                          </div>
                                          {session.is_dropset && (
                                            <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-semibold border border-rose-500/20">
                                              Dropset
                                            </span>
                                          )}
                                        </div>
                                        {session.notes && (
                                          <p className="text-xs text-muted-foreground italic bg-muted/10 p-1.5 rounded-md px-2 ml-16 border-l-2 border-primary/50">
                                            "{session.notes}"
                                          </p>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-4 mt-4 border-t border-border flex flex-wrap justify-end gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none shadow-none"
                            onClick={() => handleEditWorkout(workout)}
                          >
                             <Pencil className="w-3.5 h-3.5 mr-2" />
                             Edit
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                            onClick={() => handleCopyWorkout(workout)}
                          >
                             <CopyPlus className="w-3.5 h-3.5 mr-2" />
                             Copy to New Routine
                          </Button>
                          <Button 
                            variant={confirmDeleteId === workout.id ? "destructive" : "secondary"}
                            size="sm" 
                            className={`text-xs border-none shadow-none ${confirmDeleteId === workout.id ? '' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'}`}
                            disabled={deleteWorkout.isPending}
                            onClick={() => {
                              if (confirmDeleteId === workout.id) {
                                deleteWorkout.mutate(workout.id)
                                setConfirmDeleteId(null)
                              } else {
                                setConfirmDeleteId(workout.id)
                                setTimeout(() => setConfirmDeleteId(null), 3000) // Reset after 3 seconds
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            {confirmDeleteId === workout.id ? "Confirm?" : "Delete"}
                          </Button>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
