import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { WorkDay, DayType } from '@/types/workday'

// Регистрируем компоненты Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface TimesheetChartProps {
  workDays: WorkDay[]
  currentDate: string
}

// Преобразование типов дней в понятные надписи
const dayTypeLabels: Record<DayType, string> = {
  'WORK_DAY': 'Рабочий день',
  'DAY_OFF': 'Выходной',
  'VACATION': 'Отпуск',
  'SICK_LEAVE': 'Больничный',
  'ABSENCE': 'Отсутствие',
  'UNPAID_LEAVE': 'Отпуск за свой счет'
}

// Цвета для разных типов дней
const dayTypeColors: Record<DayType, string> = {
  'WORK_DAY': 'rgba(54, 162, 235, 0.7)',
  'DAY_OFF': 'rgba(255, 206, 86, 0.7)',
  'VACATION': 'rgba(75, 192, 192, 0.7)',
  'SICK_LEAVE': 'rgba(255, 99, 132, 0.7)',
  'ABSENCE': 'rgba(255, 159, 64, 0.7)',
  'UNPAID_LEAVE': 'rgba(153, 102, 255, 0.7)'
}

export default function TimesheetChart({
  workDays,
  currentDate
}: TimesheetChartProps) {
  const [dayTypeData, setDayTypeData] = useState<{ 
    labels: string[], 
    datasets: any[] 
  }>({
    labels: [],
    datasets: []
  })
  
  const [workTimeData, setWorkTimeData] = useState<{
    labels: string[],
    datasets: any[]
  }>({
    labels: [],
    datasets: []
  })

  useEffect(() => {
    if (!workDays || workDays.length === 0) {
      return
    }

    // Данные по типам рабочих дней
    const dayTypeCounts: Record<string, number> = {}
    const validDayTypes = Object.keys(dayTypeLabels) as DayType[]
    
    validDayTypes.forEach(type => {
      dayTypeCounts[type] = 0
    })
    
    workDays.forEach(day => {
      if (validDayTypes.includes(day.dayType)) {
        dayTypeCounts[day.dayType]++
      }
    })
    
    setDayTypeData({
      labels: validDayTypes
        .filter(type => dayTypeCounts[type] > 0)
        .map(type => dayTypeLabels[type]),
      datasets: [
        {
          data: validDayTypes
            .filter(type => dayTypeCounts[type] > 0)
            .map(type => dayTypeCounts[type]),
          backgroundColor: validDayTypes
            .filter(type => dayTypeCounts[type] > 0)
            .map(type => dayTypeColors[type]),
          borderColor: validDayTypes
            .filter(type => dayTypeCounts[type] > 0)
            .map(type => dayTypeColors[type].replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    })

    // Данные по рабочему времени сотрудников
    const employeeWorkTimes: Record<string, number> = {}
    
    workDays.forEach(day => {
      if (day.dayType === 'WORK_DAY' && day.timeEntry && day.employee) {
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
            const diffHours = diffMinutes / 60
            employeeWorkTimes[day.employee.name] = diffHours
          }
        }
      }
    })
    
    // Берем только топ-5 сотрудников с наибольшим рабочим временем
    const sortedEmployees = Object.keys(employeeWorkTimes)
      .sort((a, b) => employeeWorkTimes[b] - employeeWorkTimes[a])
      .slice(0, 5)
    
    setWorkTimeData({
      labels: sortedEmployees,
      datasets: [
        {
          label: 'Часы работы',
          data: sortedEmployees.map(name => employeeWorkTimes[name]),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    })
  }, [workDays])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      <h2 className="text-lg font-semibold mb-3">Визуализация данных</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium mb-2 text-center">Распределение по типам дней</h3>
          <div className="h-64">
            {dayTypeData.labels.length > 0 ? (
              <Pie 
                data={dayTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-2 text-center">Топ-5 сотрудников по рабочим часам</h3>
          <div className="h-64">
            {workTimeData.labels.length > 0 ? (
              <Bar
                data={workTimeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed.y
                          return `${value.toFixed(1)} ч`
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Часы'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 