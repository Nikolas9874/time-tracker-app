'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/setup')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка настройки')
      }
      
      const data = await response.json()
      setResult(data)
      
      // Перенаправляем на главную через 3 секунды
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      console.error('Ошибка настройки:', err.message)
      setError(err.message || 'Произошла ошибка при настройке приложения')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Настройка приложения</h1>
        
        <p className="text-gray-600 mb-6 text-center">
          Эта страница поможет быстро настроить приложение для отслеживания рабочего времени, 
          создав тестовых сотрудников и рабочие дни.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {result && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Настройка завершена успешно!</p>
            <p>{result.message}</p>
            {result.employeesCreated && (
              <p>Создано сотрудников: {result.employeesCreated}</p>
            )}
            {result.workDaysCreated && (
              <p>Создано рабочих дней: {result.workDaysCreated}</p>
            )}
            <p className="mt-2 text-sm">Перенаправление на главную страницу...</p>
          </div>
        )}
        
        <div className="flex justify-center">
          <Button
            onClick={handleSetup}
            disabled={isLoading}
          >
            {isLoading ? 'Настройка...' : 'Настроить приложение'}
          </Button>
        </div>
      </div>
    </div>
  )
} 