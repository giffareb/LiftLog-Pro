import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { FileText, Calendar, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Database } from '../types/db'

type MonthlySummary = Database['public']['Tables']['monthly_summaries']['Row']

export function MonthlyReport() {
  const { user } = useAuth()

  const { data: summaries, isLoading } = useQuery({
    queryKey: ['monthly_summaries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .order('month', { ascending: false })
      if (error) throw error
      return data as MonthlySummary[]
    },
    enabled: !!user
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Monthly Reports</h1>
        <p className="text-muted-foreground">
          สรุปพัฒนาการรายเดือนอัตโนมัติโดย AI Coach
        </p>
      </div>

      {!summaries || summaries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              เมื่อครบเดือน ระบบจะทำการสรุปพัฒนาการให้คุณอัตโนมัติ (หรือจะเริ่มเห็นสรุปของเดือนที่ผ่านมาในเร็วๆ นี้)
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {summaries.map((summary) => (
            <Card key={summary.id} className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="border-b border-border/50 bg-card/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{summary.month}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    AI Generated
                  </div>
                </div>
                <CardDescription>
                  วิเคราะห์โดย LiftBot เมื่อ {new Date(summary.created_at).toLocaleDateString('th-TH')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-primary">
                  <ReactMarkdown>{summary.summary_text}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
