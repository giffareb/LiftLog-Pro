import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { Loader2, User, Activity, Target } from 'lucide-react'

export function Profile() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    bodyFat: '',
    goal: '',
    diet: ''
  })

  useEffect(() => {
    if (user && user.user_metadata) {
      setFormData({
        age: user.user_metadata.age || '',
        gender: user.user_metadata.gender || '',
        height: user.user_metadata.height || '',
        weight: user.user_metadata.weight || '',
        bodyFat: user.user_metadata.bodyFat || '',
        goal: user.user_metadata.goal || '',
        diet: user.user_metadata.diet || ''
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          age: formData.age,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          bodyFat: formData.bodyFat,
          goal: formData.goal,
          diet: formData.diet
        }
      })

      if (error) throw error
      toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ")
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">ข้อมูลส่วนตัวเพื่อนำไปให้ AI ประมวลผลและให้คำแนะนำที่แม่นยำขึ้น</p>
      </div>

      <Card className="rounded-xl border-border bg-card shadow-sm">
        <CardHeader className="bg-muted/10 border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            ข้อมูลกายภาพ
          </CardTitle>
          <CardDescription>
            กรุณาระบุข้อมูลส่วนตัวปัจจุบันของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">อายุ (ปี)</label>
                <Input type="number" name="age" placeholder="เช่น 25" value={formData.age} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">เพศ</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">เลือกเพศ...</option>
                  <option value="Male">ชาย (Male)</option>
                  <option value="Female">หญิง (Female)</option>
                  <option value="Other">อื่นๆ (Other)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ส่วนสูง (ซม.)</label>
                <Input type="number" name="height" placeholder="เช่น 175" value={formData.height} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">น้ำหนัก (กก.)</label>
                <Input type="number" name="weight" placeholder="เช่น 70" value={formData.weight} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">เปอร์เซ็นต์ไขมันโดยประมาณ (%)</label>
                <Input type="number" name="bodyFat" placeholder="เช่น 15" value={formData.bodyFat} onChange={handleChange} />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-md font-semibold flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                เป้าหมาย & โภชนาการ
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">เป้าหมายหลักในตอนนี้</label>
                  <select 
                    name="goal" 
                    value={formData.goal} 
                    onChange={handleChange}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">เลือกเป้าหมาย...</option>
                    <option value="Build Muscle (Bulk)">สร้างกล้ามเนื้อ (Bulk)</option>
                    <option value="Lose Fat (Cut)">ลดไขมัน (Cut)</option>
                    <option value="Body Recomposition">ลดไขมันพร้อมสร้างกล้ามเนื้อ (Recomp)</option>
                    <option value="Maintain">รักษาน้ำหนักและสภาพร่างกาย (Maintain)</option>
                    <option value="Strength">เน้นพละกำลัง (Strength)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">การกินในปัจจุบัน (อธิบายสั้นๆ)</label>
                  <Input 
                    type="text" 
                    name="diet" 
                    placeholder="เช่น กินคลีน เน้นโปรตีนสูง หรือ ไม่ได้คุมอาหาร..." 
                    value={formData.diet} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
