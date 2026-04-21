import React, { useState, useRef, useEffect } from 'react'
import { GoogleGenAI } from '@google/genai'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Send, Bot, User, Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import Markdown from 'react-markdown'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../hooks/useAuth'
import { format, subDays } from 'date-fns'

type Message = {
  id: string
  role: 'user' | 'model'
  content: string
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : 'MISSING_API_KEY');
const ai = new GoogleGenAI({ apiKey })

export function AICoach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [resetTrigger, setResetTrigger] = useState(0)
  const chatRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const initialGreeting: Message = {
    id: '1',
    role: 'model',
    content: 'สวัสดีครับ! ผมคือ LiftBot โค้ช AI ส่วนตัวของคุณ มีอะไรให้ผมช่วยแนะนำหรือวิเคราะห์จากสถิติการฝึกของคุณในช่วง 14 วันที่ผ่านมาไหมครับ?'
  }

  useEffect(() => {
    async function initChat() {
      if (!user) return
      setIsInitializing(true)
      
      const storageKey = `liftlog_ai_messages_${user.id}`
      const saved = localStorage.getItem(storageKey)
      let loadedMessages: Message[] = [initialGreeting]
      if (saved) {
        try {
          loadedMessages = JSON.parse(saved)
        } catch(e) {}
      }
      setMessages(loadedMessages)
      
      try {
        // Fetch last 30 days of workout data for better progression analysis
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
        
        const { data: rawWorkouts, error: workoutError } = await supabase
          .from('workouts')
          .select(`
            id, date, notes,
            workout_sessions (
              sets, reps, weight, is_dropset, notes,
              exercises ( name )
            )
          `)
          .eq('user_id', user.id)
          .gte('date', thirtyDaysAgo)
          .order('date', { ascending: false })

        // Fetch last 12 monthly summaries for long-term context
        const { data: summaries, error: summaryError } = await supabase
          .from('monthly_summaries')
          .select('month, summary_text')
          .eq('user_id', user.id)
          .order('month', { ascending: false })
          .limit(12)

        let workoutContext = 'ยังไม่มีประวัติการออกกำลังกายในช่วง 30 วันที่ผ่านมา'
        
        if (!workoutError && rawWorkouts && rawWorkouts.length > 0) {
          workoutContext = rawWorkouts.map((w: any) => {
            let res = `วันที่: ${w.date} ${w.notes ? `(บันทึก: ${w.notes})` : ''}\n`
            
            const sessions: any[] = w.workout_sessions || []
            const grouped: Record<string, any[]> = {}
            
            sessions.forEach(s => {
              const exName = s.exercises?.name || 'Unknown'
              if (!grouped[exName]) grouped[exName] = []
              grouped[exName].push(s)
            })

            for (const [exName, exSessions] of Object.entries(grouped)) {
              res += `- ท่า ${exName}: `
              const setStrings = exSessions.map(s => {
                let sStr = `${s.weight}kg x ${s.reps} reps${s.is_dropset ? ' (dropset)' : ''}`
                if (s.notes) sStr += ` {บันทึก: ${s.notes}}`
                return sStr
              })
              res += setStrings.join(', ') + '\n'
            }
            return res.trim()
          }).join('\n\n')
        }

        let summaryContext = 'ยังไม่มีประวัติรายงานรายเดือน'
        if (!summaryError && summaries && summaries.length > 0) {
          summaryContext = summaries.map(s => `[Month: ${s.month}]\n${s.summary_text}`).join('\n\n')
        }

        const profileText = user.user_metadata ? `
ข้อมูลส่วนตัวผู้ใช้ (Profile):
- อายุ: ${user.user_metadata.age || 'ไม่ระบุ'} ปี
- เพศ: ${user.user_metadata.gender || 'ไม่ระบุ'}
- ส่วนสูง: ${user.user_metadata.height || 'ไม่ระบุ'} ซม.
- น้ำหนักปัจจุบัน: ${user.user_metadata.weight || 'ไม่ระบุ'} กก.
- เปอร์เซ็นต์ไขมันโดยประมาณ: ${user.user_metadata.bodyFat ? user.user_metadata.bodyFat + '%' : 'ไม่ระบุ'}
- เป้าหมายปัจจุบัน: ${user.user_metadata.goal || 'ไม่ระบุ'}
- การกินอาหารปัจจุบัน: ${user.user_metadata.diet || 'ไม่ระบุ'}
` : 'ข้อมูลส่วนตัวผู้ใช้ (Profile): ผู้ใช้ยังไม่ได้ระบุข้อมูลส่วนตัว\n';

        const systemInstruction = `คุณคือ AI Fitness Coach ชื่อ LiftBot ประจำแอป LiftLog Pro
คุณมีความเชี่ยวชาญด้านการฝึกเวทเทรนนิ่ง ฟิตเนส การสร้างกล้ามเนื้อ และลดไขมัน
เงื่อนไขสำคัญ: 
1. คุณต้องตอบสนองเป็น "ภาษาไทย" เสมอ ไม่ว่าจะได้รับคำถามภาษาอะไร
2. ให้คำแนะนำที่กระชับ ปฏิบัติได้จริง ให้กำลังใจและเป็นกันเอง ไม่เกริ่นนำยาวเกินไป
3. รูปแบบการตอบ: ใช้ Markdown headers, ตัวหนา, และลิสต์เพื่อทำให้คำแนะนำอ่านง่าย
4. วิเคราะห์ข้อมูลการฝึกของ User จาก 2 แหล่งข้อมูล:
   - รายละเอียดรายวัน (ย้อนหลัง 30 วัน): สำหรับดูความสดใหม่และความล้าปัจจุบัน
   - สรุปรายงานรายเดือน (ย้อนหลังสูงสุด 12 เดือน): สำหรับดูแนวโน้มและพัฒนาการระยะยาวทั้งปี
5. ผู้ใช้กรอกน้ำหนักโดยยึด "ตัวเลขบนอุปกรณ์ 1 ชิ้น/ข้าง" เป็นหลัก ในโน้ตอาจจะมีแท็กบอกรูปแบบการยก ให้คุณตีความปริมาณโหลดยังไง:
   - ไม่มีแท็ก (Standard): อุปกรณ์ชิ้นเดียว เล่นรวม (เช่น Barbell)
   - [Dumbbell คู่]: ถือสองข้างและยกพร้อมกัน (หมายถึง น้ำหนักที่กรอกคือข้างเดียว น้ำหนักรวม=คูณสอง)
   - [Bodyweight]: ใช้แค่น้ำหนักตัว (Weight จะเป็น 0)
   และในเซต/แถวใดที่มีติ๊ก [L] หรือ [R] หมายถึงการเล่นแบบแยกข้าง (Isolate) ให้คุณวิเคราะห์ความหนักตามความเหมาะสมของท่าทาง
   ให้นำบริบทนี้ไปคำนวณ ความหนัก(Volume) และความอ่อนล้าให้ถูกต้อง
${profileText}
ข้อมูลประวัติรายงานรายเดือน (High-level History - 12 Months):
=========================================
${summaryContext}
=========================================
ข้อมูลประวัติการออกกำลังกาย 30 วันล่าสุด (Recent Detailed Logs):
=========================================
${workoutContext}
=========================================
อ้างอิงข้อมูลทั้งหมดนี้เมื่อ User ถามถึงสถิติ, ความก้าวหน้าทั้งปี, เรื่องอาหาร, วันพัก, หรือขอคำแนะนำ`

        const history = loadedMessages
          .filter(m => m.id !== '1') // Skip the local initial greeting in the API history
          .map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          }))

        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction
          },
          history: history.length > 0 ? history : undefined
        })
      } catch (err) {
        console.error("Failed to fetch context, falling back to default", err)
        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: { 
            systemInstruction: 'คุณคือ AI Coach ประจำแอป LiftLog Pro ต้องตอบเป็นภาษาไทยเสมอ' 
          }
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initChat()
  }, [user, resetTrigger])

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    // Save to local storage
    if (user && messages.length > 0) {
      localStorage.setItem(`liftlog_ai_messages_${user.id}`, JSON.stringify(messages))
    }
  }, [messages, user])

  const clearChat = () => {
    if (!user) return
    localStorage.removeItem(`liftlog_ai_messages_${user.id}`)
    setMessages([initialGreeting])
    setResetTrigger(prev => prev + 1)
    toast.success("ล้างประวัติการสนทนาแล้ว")
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }])
    setIsLoading(true)

    try {
      if (!chatRef.current) {
         throw new Error("Chat not initialized")
      }
      const response = await chatRef.current.sendMessage({ message: userText })
      
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'model', content: response.text }
      ])
    } catch (err: any) {
      toast.error('Failed to get response from AI coach')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
          <p className="text-muted-foreground mt-2">โค้ชส่วนตัวของคุณ พร้อมวิเคราะห์การฝึก</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat} className="text-xs border-border mt-1 text-muted-foreground hover:text-white">
          เคลียร์แชท
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-none rounded-xl relative">
        {isInitializing ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Activity className="w-8 h-8 animate-pulse text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-muted-foreground">กำลังเรียกดูประวัติ 14 วันล่าสุดของคุณ...</p>
          </div>
        ) : null}
        
        <ScrollArea messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
        
        <div className="p-3 border-t border-border bg-card">
          <form onSubmit={sendMessage} className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!isLoading && input.trim() && !isInitializing) {
                    sendMessage(e as any)
                  }
                }
              }}
              placeholder="ถามโค้ช... (Shift+Enter ขึ้นบรรทัดใหม่)"
              className="flex-1 bg-transparent border border-input rounded-md px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:border-primary min-h-[40px] max-h-[150px] resize-none"
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
              disabled={isLoading || isInitializing}
            />
            <Button type="submit" disabled={isLoading || !input.trim() || isInitializing} className="h-10 shrink-0">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

function ScrollArea({ messages, isLoading, scrollRef }: { messages: Message[], isLoading: boolean, scrollRef: any }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
      {messages.map((message) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={message.id} 
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          )}
          
          <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border text-foreground'}`}>
            {message.role === 'user' ? (
              <div className="whitespace-pre-wrap text-[15px]">{message.content}</div>
            ) : (
              <div className="markdown-body text-[15px] leading-relaxed">
                <Markdown>{message.content}</Markdown>
              </div>
            )}
          </div>
        </motion.div>
      ))}
      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted/50 border border-border flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">กำลังพิมพ์...</span>
          </div>
        </div>
      )}
    </div>
  )
}
