import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eakwbmwgmtfzixxyzylz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha3dibXdnbXRmeml4eHl6eWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzEzMDgsImV4cCI6MjA5MjEwNzMwOH0.K45AI12k_eIfeU4-0hDdQ3rMMEmIooU_P4UlzHO4ef8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_sessions (
        id, 
        sets, 
        reps, 
        weight, 
        exercise_id,
        exercises ( name )
      )
    `)
    .limit(5)
  console.log("Error:", error)
  console.log("Data:", JSON.stringify(data, null, 2))
}
test()
