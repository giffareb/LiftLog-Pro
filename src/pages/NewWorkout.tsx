import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Checkbox } from '../components/ui/checkbox'
import { Plus, Trash2, Save, Dumbbell, Loader2, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

type Exercise = { id: string; name: string; category: string }
type Template = { id: string; name: string; description: string }
type SetInput = { reps: number | ''; weight: number | ''; is_dropset: boolean; side_l: boolean; side_r: boolean }
type ExerciseGroup = { 
  exercise_id: string; 
  sets: SetInput[]; 
  notes: string;
  style?: 'standard' | 'dual' | 'bodyweight'
}

export function NewWorkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [workoutGroups, setWorkoutGroups] = useState<ExerciseGroup[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editWorkoutId, setEditWorkoutId] = useState<string | null>(null)
  const isEditMode = !!editWorkoutId
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])

  // Fetch exercises
  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').order('name')
      if (error) throw error
      return data as Exercise[]
    }
  })

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('workout_templates').select('*').order('name')
      if (error) throw error
      return data as Template[]
    }
  })

  // Initialize from copied or edited workout if provided via navigation state
  useEffect(() => {
    const cw = location.state?.copyWorkout || location.state?.editWorkout
    if (cw && exercises.length > 0) {
      if (location.state?.editWorkout) {
        setEditWorkoutId(cw.id)
        if (cw.date) {
            setWorkoutDate(cw.date)
        }
      }
      
      setSelectedTemplateId(cw.workout_template_id || null)
      setWorkoutNotes(cw.notes || '')
      
      if (cw.workout_sessions && cw.workout_sessions.length > 0) {
        const newGroups: ExerciseGroup[] = []
        const groupedByExId: Record<string, any[]> = {}
        
        // Sort original sessions by sequence/set number to preserve order
        const sortedSessions = [...cw.workout_sessions].sort((a, b) => (a.sets || 0) - (b.sets || 0))
        
        sortedSessions.forEach(s => {
          const eid = s.exercise_id
          if (eid) {
            if (!groupedByExId[eid]) groupedByExId[eid] = []
            groupedByExId[eid].push(s)
          }
        })
        
        for (const eid of Object.keys(groupedByExId)) {
          const sessions = groupedByExId[eid]
          const notes = sessions[0]?.notes || ''
          
          let style: 'standard' | 'dual' | 'bodyweight' = 'standard'
          if (notes.includes('[Dumbbell คู่]')) style = 'dual'
          else if (notes.includes('[Bodyweight]')) style = 'bodyweight'
          
          const sets = sessions.map(s => {
            const setNotes = s.notes || ''
            return {
              reps: s.reps || '',
              weight: s.weight || '',
              is_dropset: s.is_dropset || false,
              side_l: setNotes.includes('[L,R]') || setNotes.includes('[L]'),
              side_r: setNotes.includes('[L,R]') || setNotes.includes('[R]')
            }
          })

          const cleanNotes = notes
            .replace(/\[Dumbbell คู่\]/g, '')
            .replace(/\[Bodyweight\]/g, '')
            .replace(/\[Isolate ทีละข้าง\]/g, '')
            .replace(/\[Isolate\]/g, '')
            .replace(/\[Alt\. สลับซ้ายขวา\]/g, '')
            .replace(/\[สลับข้าง\]/g, '')
            .replace(/\[ทีละข้าง\]/g, '')
            .replace(/\[L,R\]/g, '')
            .replace(/\[L\]/g, '')
            .replace(/\[R\]/g, '')
            .trim()
          
          newGroups.push({
            exercise_id: eid,
            sets: sets,
            notes: cleanNotes,
            style: style
          })
        }
        
        setWorkoutGroups(newGroups)
      }
      
      // Clear location state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title)
    }
  }, [location.state, exercises.length])

  // Add a new exercise to the workout
  const addExercise = () => {
    if (exercises.length === 0) return toast.error("No exercises found in database.")
    setWorkoutGroups([...workoutGroups, { 
      exercise_id: exercises[0].id, 
      sets: [{ reps: '', weight: '', is_dropset: false, side_l: false, side_r: false }], 
      notes: '',
      style: 'standard'
    }])
  }

  // Remove an exercise
  const removeExercise = (groupIndex: number) => {
    setWorkoutGroups(workoutGroups.filter((_, i) => i !== groupIndex))
  }

  // Add a set to an exercise
  const addSet = (groupIndex: number) => {
    const newGroups = [...workoutGroups]
    newGroups[groupIndex].sets.push({ reps: '', weight: '', is_dropset: false, side_l: false, side_r: false })
    setWorkoutGroups(newGroups)
  }

  // Remove a set
  const removeSet = (groupIndex: number, setIndex: number) => {
    const newGroups = [...workoutGroups]
    newGroups[groupIndex].sets = newGroups[groupIndex].sets.filter((_, i) => i !== setIndex)
    setWorkoutGroups(newGroups)
  }

  // Update set details
  const updateSet = (groupIndex: number, setIndex: number, field: keyof SetInput, value: any) => {
    const newGroups = [...workoutGroups]
    newGroups[groupIndex].sets[setIndex] = { ...newGroups[groupIndex].sets[setIndex], [field]: value }
    setWorkoutGroups(newGroups)
  }

  // Update exercise selection
  const updateExercise = (groupIndex: number, exerciseId: string) => {
    const newGroups = [...workoutGroups]
    newGroups[groupIndex].exercise_id = exerciseId
    setWorkoutGroups(newGroups)
  }

  const updateExerciseNotes = (groupIndex: number, notes: string) => {
    const newGroups = [...workoutGroups]
    newGroups[groupIndex].notes = notes
    setWorkoutGroups(newGroups)
  }

  const updateExerciseStyle = (groupIndex: number, style: 'standard' | 'dual' | 'bodyweight') => {
    const newGroups = [...workoutGroups]
    newGroups[groupIndex].style = style
    setWorkoutGroups(newGroups)
  }

  // Save Workout
  const saveWorkout = async () => {
    if (!user) return
    if (workoutGroups.length === 0 && !workoutNotes.trim()) {
      return toast.error("Please add at least one exercise or write some notes for today.")
    }
    
    // Validate
    for (const group of workoutGroups) {
      for (const set of group.sets) {
        if (set.reps === '' || set.weight === '') return toast.error("Please fill in all sets and reps in " + (exercises.find(e => e.id === group.exercise_id)?.name || 'An Exercise'))
      }
    }

    setIsSaving(true)
    try {
      let workoutData = null
      
      if (isEditMode && editWorkoutId) {
        // ... (update workout logic)
        const { data: updatedData, error: workoutError } = await supabase
          .from('workouts')
          .update({ 
            workout_template_id: selectedTemplateId,
            notes: workoutNotes
          } as never)
          .eq('id', editWorkoutId)
          .select()
          .single()
        
        if (workoutError) throw workoutError
        workoutData = updatedData
        
        // Delete old sessions to replace them
        const { error: deleteSessionsError } = await supabase
          .from('workout_sessions')
          .delete()
          .eq('workout_id', editWorkoutId)
          
        if (deleteSessionsError) throw deleteSessionsError
        
        // Also update the date of the workout since it could have been changed
        const { error: updateDateError } = await supabase
          .from('workouts')
          .update({ date: workoutDate } as never)
          .eq('id', editWorkoutId)
          
        if (updateDateError) throw updateDateError

      } else {
        // Create Workout Record
        const { data: newWorkoutData, error: workoutError } = await supabase
          .from('workouts')
          .insert({ 
            user_id: user.id, 
            date: workoutDate,
            workout_template_id: selectedTemplateId,
            notes: workoutNotes
          } as any)
          .select()
          .single()
        
        if (workoutError) throw workoutError
        workoutData = newWorkoutData
      }

      if (!workoutData) throw new Error("Failed to process workout record.")

      // 2. Prepare Sessions (Sets)
      const sessionsToInsert = []
      for (const group of workoutGroups) {
        let styleNote = ""
        if (group.style === 'dual') styleNote = "[Dumbbell คู่] "
        if (group.style === 'bodyweight') styleNote = "[Bodyweight] "

        for (let idx = 0; idx < group.sets.length; idx++) {
          const set = group.sets[idx]
          
          let sideTags = ""
          if (set.side_l && set.side_r) sideTags = "[L,R] "
          else if (set.side_l) sideTags = "[L] "
          else if (set.side_r) sideTags = "[R] "

          let firstSetNote = idx === 0 ? `${styleNote}${group.notes}`.trim() : ""
          let combinedNotes = `${firstSetNote} ${sideTags}`.trim()

          sessionsToInsert.push({
            workout_id: workoutData.id,
            exercise_id: group.exercise_id,
            sets: idx + 1, // Store as set number
            reps: Number(set.reps),
            weight: Number(set.weight),
            is_dropset: set.is_dropset,
            notes: combinedNotes ? combinedNotes : null
          })
        }
      }

      // 3. Insert Sessions
      const { error: sessionError } = await supabase.from('workout_sessions').insert(sessionsToInsert as any)
      if (sessionError) throw sessionError

      toast.success(isEditMode ? "Workout updated successfully!" : "Workout saved successfully!")
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message || "Failed to save workout")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditMode ? "Edit Workout" : "New Workout"}</h1>
          <p className="text-muted-foreground mt-2">Log your sets, reps, and weights.</p>
        </div>
        <Button onClick={saveWorkout} disabled={isSaving || (workoutGroups.length === 0 && !workoutNotes.trim())} className="font-semibold">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isEditMode ? "Save Changes" : "Finish"}
        </Button>
      </div>

      <Card className="rounded-xl overflow-hidden shadow-none border-border">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
            <span>Workout Setup</span>
            <input 
              type="date" 
              className="px-2 py-1 bg-black/20 border border-border rounded text-xs font-mono focus:outline-none focus:border-primary text-foreground"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
            />
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1 text-xs">Select plan & add daily notes.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {!loadingTemplates && templates.map(t => (
              <Button 
                key={t.id} 
                variant={selectedTemplateId === t.id ? "default" : "outline"}
                className={`border-border font-semibold ${selectedTemplateId === t.id ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
                onClick={() => setSelectedTemplateId(t.id)}
              >
                {t.name}
              </Button>
            ))}
            <Button 
               variant={selectedTemplateId === null ? "default" : "outline"}
               className={`border-border font-semibold ${selectedTemplateId === null ? 'bg-primary text-primary-foreground' : 'hover:bg-white/5'}`}
               onClick={() => setSelectedTemplateId(null)}
            >
              Custom
            </Button>
          </div>
          <textarea
            className="w-full bg-black/20 border border-border rounded-md p-3 text-sm text-foreground focus:outline-none focus:border-primary min-h-[80px]"
            placeholder="How's your body feeling? (e.g., Rest day, slept 6h, walked 10k, ate TDEE)"
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
          />
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {workoutGroups.length === 0 && (
          <Card className="rounded-xl border-dashed border-border bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
              <p>Your workout is empty.</p>
              <p className="text-xs mt-2 max-w-sm">
                You can save this without exercises as a <b>"Rest Day / Journal"</b> using the notes above, or add an exercise below to start tracking weights.
              </p>
              <Button variant="outline" className="mt-5 border-border" onClick={addExercise}>
                <Plus className="w-4 h-4 mr-2" /> Add First Exercise
              </Button>
            </CardContent>
          </Card>
        )}

        {workoutGroups.map((group, groupIdx) => (
          <Card key={groupIdx} className="rounded-xl overflow-hidden shadow-none border-border">
            <CardHeader className="border-b border-border p-4 bg-muted/20 flex flex-col space-y-3">
              <div className="flex flex-row items-center justify-between">
                <select 
                  className="bg-transparent text-sm font-semibold p-1 outline-none w-full max-w-[250px]"
                  value={group.exercise_id}
                  onChange={(e) => updateExercise(groupIdx, e.target.value)}
                  disabled={loadingExercises}
                >
                  {exercises.map(ex => (
                    <option key={ex.id} value={ex.id} className="bg-card text-foreground">{ex.name}</option>
                  ))}
                </select>
                <Button variant="ghost" size="icon" onClick={() => removeExercise(groupIdx)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-start bg-black/20 rounded p-2 border border-border">
                <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 mr-2 shrink-0" />
                <input 
                  type="text" 
                  className="bg-transparent border-none text-xs text-muted-foreground w-full focus:outline-none placeholder:text-muted-foreground/50" 
                  placeholder="Notes (e.g., Tempo 3 sec, Focus on peak contraction)"
                  value={group.notes}
                  onChange={(e) => updateExerciseNotes(groupIdx, e.target.value)}
                />
              </div>
              <div className="flex gap-1 flex-wrap mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-7 px-2 text-[10px] uppercase font-bold border-border/50 ${(!group.style || group.style === 'standard') ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground'}`}
                  onClick={() => updateExerciseStyle(groupIdx, 'standard')}
                  title="ใช้อุปกรณ์ 1 ชิ้นรวมกัน เช่น บาร์เบล หรือ แมชชีน"
                >
                  Standard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-7 px-2 text-[10px] uppercase font-bold border-border/50 ${group.style === 'dual' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'text-muted-foreground'}`}
                  onClick={() => updateExerciseStyle(groupIdx, 'dual')}
                  title="ถือดัมเบลสองข้างพร้อมกัน และเล่นพร้อมกัน"
                >
                  Dumbbell คู่
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-7 px-2 text-[10px] uppercase font-bold border-border/50 ${group.style === 'bodyweight' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : 'text-muted-foreground'}`}
                  onClick={() => {
                    updateExerciseStyle(groupIdx, 'bodyweight')
                    // Automatically set weights to 0 for BW
                    const newGroups = [...workoutGroups]
                    newGroups[groupIdx].sets = newGroups[groupIdx].sets.map(s => ({ ...s, weight: 0 }))
                    setWorkoutGroups(newGroups)
                  }}
                  title="ใช้น้ำหนักตัวในการฝึก (ไม่ต้องใส่น้ำหนัก)"
                >
                  Bodyweight
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-[30px_1fr_1fr_40px_70px_40px] gap-2 p-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <div>Set</div>
                <div>Weight (kg)</div>
                <div>Reps</div>
                <div className="text-center">DS</div>
                <div className="text-center">L / R</div>
                <div></div>
              </div>
              
              <div className="flex flex-col">
                {group.sets.map((set, setIdx) => (
                  <div key={setIdx} className={`grid grid-cols-[30px_1fr_1fr_40px_70px_40px] gap-2 p-3 items-center border-b border-border/50 last:border-0 ${set.is_dropset ? 'bg-primary/5' : ''}`}>
                    <div className="text-center font-mono text-xs text-muted-foreground flex items-center justify-center">
                      <span className="w-5 h-5 rounded-full bg-border/50 flex items-center justify-center">{setIdx + 1}</span>
                    </div>
                    <div>
                      <Input type="number" 
                        className="h-8 bg-black/20 border-border font-mono text-sm px-2" 
                        placeholder="0" 
                        value={set.weight} 
                        onChange={(e) => updateSet(groupIdx, setIdx, 'weight', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Input type="number" 
                        className="h-8 bg-black/20 border-border font-mono text-sm px-2" 
                        placeholder="0" 
                        value={set.reps} 
                        onChange={(e) => updateSet(groupIdx, setIdx, 'reps', e.target.value)} 
                      />
                    </div>
                    <div className="flex justify-center items-center">
                      <Checkbox 
                        checked={set.is_dropset} 
                        onCheckedChange={(c) => updateSet(groupIdx, setIdx, 'is_dropset', !!c)} 
                        className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex justify-center items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium">L</span>
                        <Checkbox 
                          checked={set.side_l} 
                          onCheckedChange={(c) => updateSet(groupIdx, setIdx, 'side_l', !!c)} 
                          className="w-3.5 h-3.5 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-medium">R</span>
                        <Checkbox 
                          checked={set.side_r} 
                          onCheckedChange={(c) => updateSet(groupIdx, setIdx, 'side_r', !!c)} 
                          className="w-3.5 h-3.5 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeSet(groupIdx, setIdx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-muted/10 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-white/5" onClick={() => addSet(groupIdx)}>
                  <Plus className="w-3 h-3 mr-2" /> Add Set
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {workoutGroups.length > 0 && (
          <Button variant="outline" className="w-full border-dashed border-border" onClick={addExercise}>
            <Plus className="w-4 h-4 mr-2" /> Add Exercise
          </Button>
        )}
      </div>
    </div>
  )
}
