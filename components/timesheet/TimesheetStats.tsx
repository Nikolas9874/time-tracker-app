import React, { useState, useEffect } from 'react'
import { formatTime, calculateDuration } from '@/lib/utils'
import { WorkDay } from '@/types/workday'

interface TimesheetStatsProps {
  workDays: WorkDay[]
  currentDate: string
}

export default function TimesheetStats({
  workDays,
  currentDate
}: TimesheetStatsProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentEmployees: 0,
    absentEmployees: 0,
    avgWorkHours: '--:--',
    totalWorkHours: '--:--'
  })

  useEffect(() => {
    if (!workDays || workDays.length === 0) {
      return
    }

    const totalEmployees = workDays.length
    const presentEmployees = workDays.filter(day => 
      day.dayType === 'WORK_DAY' && day.timeEntry
    ).length
    const absentEmployees = totalEmployees - presentEmployees

    // Расчет средней и общей продолжительности рабочего дня
    let totalMinutes = 0
    let workdaysWithTime = 0

    workDays.forEach(day => {
      if (day.dayType === 'WORK_DAY' && day.timeEntry) {
        const { startTime, endTime, lunchStartTime, lunchEndTime } = day.timeEntry
        
        if (startTime && endTime) {
          const start = new Date(startTime)
          const end = new Date(endTime)
          
          let diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
          
          // Вычитаем время обеда, если оно указано
          if (lunchStartTime && lunchEndTime) {
            const lunchStart = new Date(lunchStartTime)
            const lunchEnd = new Date(lunchEndTime)
            const lunchMinutes = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60)
            diffMinutes -= lunchMinutes
          }
          
          if (diffMinutes > 0) {
            totalMinutes += diffMinutes
            workdaysWithTime++
          }
        }
      }
    })

    const avgMinutes = workdaysWithTime > 0 ? Math.round(totalMinutes / workdaysWithTime) : 0
    const avgHours = Math.floor(avgMinutes / 60)
    const avgMinutesRemainder = avgMinutes % 60
    
    const totalHours = Math.floor(totalMinutes / 60)
    const totalMinutesRemainder = Math.round(totalMinutes % 60)

    setStats({
      totalEmployees,
      presentEmployees,
      absentEmployees,
      avgWorkHours: `${avgHours.toString().padStart(2, '0')}:${avgMinutesRemainder.toString().padStart(2, '0')}`,
      totalWorkHours: `${totalHours.toString().padStart(2, '0')}:${totalMinutesRemainder.toString().padStart(2, '0')}`
    })
  }, [workDays])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Статистика за день</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center">
          <span className="text-xs text-blue-600 font-medium uppercase">Всего сотрудников</span>
          <span className="text-2xl font-bold text-blue-700">{stats.totalEmployees}</span>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center">
          <span className="text-xs text-green-600 font-medium uppercase">На работе</span>
          <span className="text-2xl font-bold text-green-700">{stats.presentEmployees}</span>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3 flex flex-col items-center">
          <span className="text-xs text-red-600 font-medium uppercase">Отсутствуют</span>
          <span className="text-2xl font-bold text-red-700">{stats.absentEmployees}</span>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 flex flex-col items-center">
          <span className="text-xs text-purple-600 font-medium uppercase">Среднее время</span>
          <span className="text-2xl font-bold text-purple-700">{stats.avgWorkHours}</span>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-3 flex flex-col items-center">
          <span className="text-xs text-indigo-600 font-medium uppercase">Общее время</span>
          <span className="text-2xl font-bold text-indigo-700">{stats.totalWorkHours}</span>
        </div>
      </div>
    </div>
  )
} 