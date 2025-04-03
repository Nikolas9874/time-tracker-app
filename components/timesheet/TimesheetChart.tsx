'use client'

import React, { useEffect, useState } from 'react'
import { WorkDay } from '@/types/workday'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

// Регистрируем компоненты для Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface TimesheetChartProps {
  workDays: WorkDay[]
}

const TimesheetChart: React.FC<TimesheetChartProps> = ({ 
  workDays
}) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  })

  // Подготовка данных для графика при изменении workDays
  useEffect(() => {
    if (!workDays || workDays.length === 0) {
      return
    }

    // Анализируем данные для построения графика
    const dayTypes = {
      'WORK_DAY': 0,
      'DAY_OFF': 0,
      'VACATION': 0,
      'SICK_LEAVE': 0,
      'ABSENCE': 0,
      'UNPAID_LEAVE': 0
    }

    // Подсчитываем количество для каждого типа
    workDays.forEach(day => {
      if (day.dayType && day.dayType in dayTypes) {
        dayTypes[day.dayType]++
      }
    })

    // Преобразуем данные для графика
    setChartData({
      labels: ['Рабочий день', 'Выходной', 'Отпуск', 'Больничный', 'Отсутствие', 'Неоплачиваемый'],
      datasets: [
        {
          label: 'Количество дней',
          data: [
            dayTypes['WORK_DAY'],
            dayTypes['DAY_OFF'],
            dayTypes['VACATION'],
            dayTypes['SICK_LEAVE'],
            dayTypes['ABSENCE'],
            dayTypes['UNPAID_LEAVE']
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }
      ]
    })
  }, [workDays])

  // Настройки графика
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Распределение типов дней'
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <Bar options={options} data={chartData} />
    </div>
  )
}

export default TimesheetChart 