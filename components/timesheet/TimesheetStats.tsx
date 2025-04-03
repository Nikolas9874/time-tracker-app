import React from 'react'
import { WorkDay } from '@/types/workday'

interface TimesheetStatsProps {
  workDays: WorkDay[]
}

const TimesheetStats: React.FC<TimesheetStatsProps> = ({ 
  workDays
}) => {
  // Вычисление статистики
  const totalWorkDays = workDays.filter(wd => wd.dayType === 'WORK_DAY').length
  const totalVacationDays = workDays.filter(wd => wd.dayType === 'VACATION').length
  const totalSickDays = workDays.filter(wd => wd.dayType === 'SICK_LEAVE').length
  const totalDayOff = workDays.filter(wd => wd.dayType === 'DAY_OFF').length
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-500 mb-1">Рабочих дней</div>
        <div className="text-2xl font-bold">{totalWorkDays}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-500 mb-1">Отпускных дней</div>
        <div className="text-2xl font-bold">{totalVacationDays}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-500 mb-1">Больничных дней</div>
        <div className="text-2xl font-bold">{totalSickDays}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-500 mb-1">Выходных дней</div>
        <div className="text-2xl font-bold">{totalDayOff}</div>
      </div>
    </div>
  )
}

export default TimesheetStats 