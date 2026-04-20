import React, { useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Pencil, Check, X, Dumbbell } from 'lucide-react'

type Exercise = { id: string; name: string; category: string; user_id?: string }

const CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body', 'Other']

export function Exercises() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      // Fetch both global exercises (user_id is null) and user's custom exercises
      const { data, error } = await supabase.from('exercises').select('*').order('name')
      if (error) throw error
      return data as Exercise[]
    }
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('exercises').insert({ 
        name: newName, 
        category: newCategory,
        user_id: user?.id 
      } as never)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("เพิ่มท่าออกกำลังกายเรียบร้อย")
      setNewName('')
      setIsAdding(false)
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
    onError: (err: any) => toast.error("ไม่สามารถเพิ่มได้ " + err.message)
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').update({ name: editName, category: editCategory } as never).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("อัปเดตท่าออกกำลังกายเรียบร้อย")
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
    onError: (err: any) => toast.error("ไม่สามารถอัปเดตได้ " + err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("ลบท่าออกกำลังกายเรียบร้อย")
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
    onError: (err: any) => toast.error("ไม่สามารถลบได้ อาจเนื่องจากท่านี้ถูกนำไปใช้ในบันทึกออกกำลังกายของคุณแล้ว")
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    addMutation.mutate()
  }

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id)
    setEditName(ex.name)
    setEditCategory(ex.category || CATEGORIES[0])
  }

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return
    updateMutation.mutate(id)
  }

  const groupedExercises = exercises?.reduce((acc, ex) => {
    const cat = ex.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ex)
    return acc
  }, {} as Record<string, Exercise[]>) || {}

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="text-muted-foreground mt-2">จัดการเพิ่ม/ลด/แก้ไขรายชื่อท่าออกกำลังกายของคุณ</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="w-full sm:w-auto">
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? "ยกเลิก" : "เพิ่มท่าใหม่"}
        </Button>
      </div>

      {isAdding && (
        <Card className="rounded-xl border-border bg-card shadow-sm">
          <CardContent className="p-4 focus-within:ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl transition-shadow">
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 items-end">
              <div className="space-y-2 w-full md:w-1/2">
                <label className="text-sm font-medium">ชื่อท่า (Exercise Name)</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="เช่น Barbell Bench Press" autoFocus />
              </div>
              <div className="space-y-2 w-full md:w-1/3">
                <label className="text-sm font-medium">หมวดหมู่กล้ามเนื้อ (Category)</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Button type="submit" disabled={addMutation.isPending || !newName.trim()} className="w-full md:w-auto">
                {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                บันทึกท่าใหม่
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground flex items-center justify-center p-10"><Loader2 className="animate-spin w-5 h-5 mr-2"/>กำลังโหลดรายชื่อท่า...</p>
      ) : Object.keys(groupedExercises).length === 0 ? (
        <Card className="rounded-xl border-dashed border-border bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
            <p>ยังไม่มีท่าออกกำลังกายในระบบ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 mt-4">
          {Object.keys(groupedExercises).sort().map(category => (
            <div key={category} className="space-y-3 relative">
              <h3 className="font-semibold text-lg flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1">
                <Dumbbell className="w-4 h-4 text-primary" /> {category}
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{groupedExercises[category].length}</span>
              </h3>
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {groupedExercises[category].map((ex: Exercise) => (
                  <Card key={ex.id} className="rounded-lg shadow-none border-border overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between group">
                      {editingId === ex.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <Input className="h-8 text-sm px-2 bg-black/10" value={editName} onChange={e => setEditName(e.target.value)} />
                          <select 
                            className="h-8 text-sm px-2 rounded-md border border-input bg-black/10 text-foreground"
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="flex justify-end gap-2 mt-1">
                            <Button size="sm" variant="ghost" className="h-7 px-3 text-muted-foreground" onClick={() => setEditingId(null)}>
                              ยกเลิก <X className="w-3.5 h-3.5 ml-1" />
                            </Button>
                            <Button size="sm" className="h-7 px-3" disabled={updateMutation.isPending || !editName.trim()} onClick={() => handleUpdate(ex.id)}>
                              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>บันทึก <Check className="w-3.5 h-3.5 ml-1" /></>}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium truncate pr-2">{ex.name}</span>
                          {(ex.user_id === user?.id) && (
                            <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors" onClick={() => startEdit(ex)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant={confirmDeleteId === ex.id ? "destructive" : "ghost"} 
                                size="icon" 
                                className={`h-7 w-7 transition-colors ${confirmDeleteId === ex.id ? '' : 'text-muted-foreground hover:text-destructive'}`}
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                  if (confirmDeleteId === ex.id) {
                                    deleteMutation.mutate(ex.id)
                                    setConfirmDeleteId(null)
                                  } else {
                                    setConfirmDeleteId(ex.id)
                                    setTimeout(() => setConfirmDeleteId(null), 3000)
                                  }
                                }}
                              >
                                {deleteMutation.isPending && confirmDeleteId === ex.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
