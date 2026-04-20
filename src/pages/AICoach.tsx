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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'สวัสดีครับ! ผมคือ LiftBot โค้ช AI ส่วนตัวของคุณ มีอะไรให้ผมช่วยแนะนำหรือวิเคราะห์จากสถิติการฝึกของคุณในช่วง 14 วันที่ผ่านมาไหมครับ?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const chatRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initChat() {
      if (!user) return
      setIsInitializing(true)
      try {
        // Fetch last 14 days of workout data
        const fourteenDaysAgo = format(subDays(new Date(), 14), 'yyyy-MM-dd')
        
        const { data: rawWorkouts, error } = await supabase
          .from('workouts')
          .select(`
            id, date, notes,
            workout_sessions (
              sets, reps, weight, is_dropset, notes,
              exercises ( name )
            )
          `)
          .eq('user_id', user.id)
          .gte('date', fourteenDaysAgo)
          .order('date', { ascending: false })

        let workoutContext = 'ยังไม่มีประวัติการออกกำลังกายในช่วง 14 วันที่ผ่านมา'
        
        if (!error && rawWorkouts && rawWorkouts.length > 0) {
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
              const setStrings = exSessions.map(s => `${s.weight}kg x ${s.reps} reps${s.is_dropset ? ' (dropset)' : ''}`)
              res += setStrings.join(', ') + '\n'
            }
            return res.trim()
          }).join('\n\n')
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
4. วิเคราะห์ข้อมูลการฝึกของ User (ย้อนหลัง 14 วัน) และ Profile เพื่อให้คำแนะนำเฉพาะบุคคล รวมถึงประเมินว่ามีการพักผ่อน(Rest) หรือความถี่ในการฝึกที่เหมาะสมหรือไม่ โดยดูจากวันที่(Date) ที่บันทึกไว้
${profileText}
ข้อมูลประวัติการออกกำลังกาย 14 วันย้อนหลังของ User:
=========================================
${workoutContext}
=========================================
อ้างอิงข้อมูลนี้เมื่อ User ถามถึงสถิติ, ความก้าวหน้า, เรื่องอาหาร(Diet), วันพัก(Rest Days), หรือขอคำแนะนำ`

        chatRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction
          }
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
  }, [user])

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
        <p className="text-muted-foreground mt-2">โค้ชส่วนตัวของคุณ พร้อมวิเคราะห์การฝึก</p>
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
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ถามเกี่ยวกับเทคนิค, อาหาร, หรือสถิติที่ผ่านมา..."
              className="flex-1"
              disabled={isLoading || isInitializing}
            />
            <Button type="submit" disabled={isLoading || !input.trim() || isInitializing}>
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
