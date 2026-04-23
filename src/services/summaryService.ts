import { supabase } from '../lib/supabase/client'
import { GoogleGenAI } from '@google/genai'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Database } from '../types/db'

type MonthlySummary = Database['public']['Tables']['monthly_summaries']['Row']

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : 'MISSING_API_KEY');
const genAI = new GoogleGenAI({ apiKey })

export async function generateMonthlySummary(userId: string, targetDate: Date = new Date()) {
  const previousMonth = subMonths(targetDate, 1)
  const monthString = format(previousMonth, 'yyyy-MM')
  
  // 1. Check if already exists
  const { data: existing } = await supabase
    .from('monthly_summaries')
    .select('id')
    .eq('user_id', userId)
    .eq('month', monthString)
    .single()
    
  if (existing) return null

  // 2. Fetch logs for that month
  const start = format(startOfMonth(previousMonth), 'yyyy-MM-dd')
  const end = format(endOfMonth(previousMonth), 'yyyy-MM-dd')
  
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select(`
      date, notes,
      workout_sessions (
        reps, weight, is_dropset, notes,
        exercises ( name )
      )
    `)
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })

  if (error || !workouts || workouts.length === 0) return null

  // 3. Prepare data for Gemini
  const workoutData = (workouts as any[]).map(w => {
    let res = `Date: ${w.date}\n`
    const grouped: Record<string, any[]> = {}
    if (w.workout_sessions) {
      w.workout_sessions.forEach((s: any) => {
        const name = s.exercises?.name || 'Unknown'
        if (!grouped[name]) grouped[name] = []
        grouped[name].push(s)
      })
    }
    for (const [name, sessions] of Object.entries(grouped)) {
      res += `- ${name}: ${sessions.map(s => `${s.weight}kg x ${s.reps}${s.notes ? ` {${s.notes}}` : ''}`).join(', ')}\n`
    }
    return res
  }).join('\n\n')

  // 4. Call Gemini
  const response = await genAI.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are LiftBot, an expert fitness analyst. 
Please analyze these workout logs for the month ${monthString} and provide a concise monthly summary in Thai.
Format your response in Markdown with these sections:
## 📊 ภาพรวมรายเดือน (${monthString})
- สรุปจำนวนวันที่เข้าฝึก
- คาดการณ์ Volume รวมโดยประมาณ
- ท่าที่ทำได้ดีที่สุด (Best Progression)

## 💡 วิเคราะห์และแนะนำ
- วิเคราะห์จุดแข็งในเดือนนี้
- สิ่งที่ควรโฟกัสในเดือนถัดไป

Workout Logs:
${workoutData}`,
  })
  
  const text = response.text || "ขออภัย ไม่สามารถสร้างสรุปได้ในขณะนี้"

  // 5. Save to DB
  const { data: saved } = await supabase
    .from('monthly_summaries')
    .insert({
      user_id: userId,
      month: monthString,
      summary_text: text,
      stats_json: { workout_count: workouts.length }
    } as any)
    .select()
    .single()

  return saved as MonthlySummary | null
}
