'use client'

import React, { useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { WorkDay, DayType } from '@/types/workday'
import { Employee } from '@/types/employee'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface WorkdayStatsProps {
  workDays: WorkDay[]
  employees: Employee[]
}

type MetricType = 'hours' | 'tasks' | 'connections' | 'days'

export default function WorkdayStats({ workDays, employees }: WorkdayStatsProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | 'all'>('all')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('hours')

  // Фильтрация данных по выбранному сотруднику
  const filteredWorkDays = selectedEmployeeId === 'all' 
    ? workDays 
    : workDays.filter(day => day.employeeId === selectedEmployeeId)

  // Данные для круговой диаграммы типов дней
  const dayTypeData = {
    labels: ['Рабочий день', 'Выходной', 'Отпуск', 'Больничный', 'Отсутствие', 'Отпуск за свой счет'],
    datasets: [
      {
        data: [
          filteredWorkDays.filter(day => day.dayType === 'WORK_DAY').length,
          filteredWorkDays.filter(day => day.dayType === 'DAY_OFF').length,
          filteredWorkDays.filter(day => day.dayType === 'VACATION').length,
          filteredWorkDays.filter(day => day.dayType === 'SICK_LEAVE').length,
          filteredWorkDays.filter(day => day.dayType === 'ABSENCE').length,
          filteredWorkDays.filter(day => day.dayType === 'UNPAID_LEAVE').length
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
        borderWidth: 1,
      },
    ],
  }

  // Функция для расчета часов между двумя временами
  const calculateHours = (startTime: string | null, endTime: string | null, lunchStart?: string | null, lunchEnd?: string | null) => {
    if (!startTime || !endTime) return 0

    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
    
    if (lunchStart && lunchEnd) {
      const [lunchStartHours, lunchStartMinutes] = lunchStart.split(':').map(Number)
      const [lunchEndHours, lunchEndMinutes] = lunchEnd.split(':').map(Number)
      const lunchMinutes = (lunchEndHours * 60 + lunchEndMinutes) - (lunchStartHours * 60 + lunchStartMinutes)
      totalMinutes -= Math.max(0, lunchMinutes)
    }
    
    return Math.max(0, totalMinutes / 60)
  }

  // Функция для форматирования времени из объекта Date
  const formatTime = (date: Date | null | undefined) => {
    if (!date) return null
    
    try {
      // Проверяем, является ли date строкой
      if (typeof date === 'string') {
        date = new Date(date)
      }
      
      // Проверяем, валидный ли объект Date
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null
      }
      
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      console.error('Ошибка форматирования времени:', error)
      return null
    }
  }

  // Подготовка данных для графика по сотрудникам
  const getEmployeeData = () => {
    // Группировка по сотрудникам
    const employeeStats = employees.map(emp => {
      const empDays = workDays.filter(day => day.employeeId === emp.id)
      const workingDays = empDays.filter(day => day.dayType === 'WORK_DAY')

      let totalHours = 0
      let totalTasks = 0
      let totalConnections = 0

      workingDays.forEach(day => {
        if (day.timeEntry) {
          const startTime = formatTime(day.timeEntry.startTime)
          const endTime = formatTime(day.timeEntry.endTime)
          const lunchStartTime = formatTime(day.timeEntry.lunchStartTime)
          const lunchEndTime = formatTime(day.timeEntry.lunchEndTime)

          totalHours += calculateHours(startTime, endTime, lunchStartTime, lunchEndTime)
        }

        if (day.tasks) {
          totalTasks += day.tasks.length
        }

        if (day.connections) {
          totalConnections += day.connections.length
        }
      })

      return {
        name: emp.name,
        hours: totalHours,
        tasks: totalTasks,
        connections: totalConnections,
        days: workingDays.length
      }
    })

    let metricLabel: string
    let metricData: number[]
    let bgColor = 'rgba(54, 162, 235, 0.6)'
    let borderColor = 'rgba(54, 162, 235, 1)'

    switch (selectedMetric) {
      case 'hours':
        metricLabel = 'Часы'
        metricData = employeeStats.map(stat => Number(stat.hours.toFixed(1)))
        bgColor = 'rgba(54, 162, 235, 0.6)'
        borderColor = 'rgba(54, 162, 235, 1)'
        break
      case 'tasks':
        metricLabel = 'Задачи'
        metricData = employeeStats.map(stat => stat.tasks)
        bgColor = 'rgba(75, 192, 192, 0.6)'
        borderColor = 'rgba(75, 192, 192, 1)'
        break
      case 'connections':
        metricLabel = 'Связи'
        metricData = employeeStats.map(stat => stat.connections)
        bgColor = 'rgba(153, 102, 255, 0.6)'
        borderColor = 'rgba(153, 102, 255, 1)'
        break
      case 'days':
        metricLabel = 'Рабочие дни'
        metricData = employeeStats.map(stat => stat.days)
        bgColor = 'rgba(255, 159, 64, 0.6)'
        borderColor = 'rgba(255, 159, 64, 1)'
        break
    }

    return {
      labels: employeeStats.map(stat => stat.name),
      datasets: [
        {
          label: metricLabel,
          data: metricData,
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 1,
        }
      ]
    }
  }

  // Опции для столбчатой диаграммы
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Статистика по сотрудникам (${selectedMetric === 'hours' ? 'часы' : 
          selectedMetric === 'tasks' ? 'задачи' : 
          selectedMetric === 'connections' ? 'связи' : 'дни'})`,
      },
    },
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Статистика и графики</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сотрудник
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">Все сотрудники</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Метрика для графика
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="hours">Часы</option>
            <option value="tasks">Задачи</option>
            <option value="connections">Связи</option>
            <option value="days">Рабочие дни</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Распределение типов дней</h3>
          <div className="h-64">
            <Pie data={dayTypeData} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Статистика по сотрудникам</h3>
          <div className="h-64">
            <Bar options={barOptions} data={getEmployeeData()} />
          </div>
        </div>
      </div>
    </div>
  )
} 