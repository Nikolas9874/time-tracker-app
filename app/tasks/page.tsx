'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Todo, { TodoItem } from '@/components/ui/Todo'

export default function TasksPage() {
  const [tasks, setTasks] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Имитация загрузки задач из API
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true)
      
      try {
        // В реальном приложении здесь был бы запрос к API
        // const response = await fetch('/api/tasks')
        // const data = await response.json()
        
        // Демо данные для отображения
        const demoTasks: TodoItem[] = [
          {
            id: '1',
            title: 'Заполнить табель рабочего времени',
            completed: false,
            priority: 'high',
            dueDate: new Date().toISOString().split('T')[0]
          },
          {
            id: '2',
            title: 'Проверить статистику по отчетам',
            completed: true,
            priority: 'medium',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
          },
          {
            id: '3',
            title: 'Добавить нового сотрудника',
            completed: false,
            priority: 'low',
            dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
          }
        ]
        
        // Имитация задержки сети
        setTimeout(() => {
          setTasks(demoTasks)
          setIsLoading(false)
        }, 800)
        
      } catch (error) {
        console.error('Ошибка загрузки задач:', error)
        toast.error('Не удалось загрузить задачи')
        setIsLoading(false)
      }
    }
    
    loadTasks()
  }, [])
  
  const handleTasksChange = (updatedTasks: TodoItem[]) => {
    setTasks(updatedTasks)
    
    // В реальном приложении здесь был бы запрос на сохранение в API
    // Например:
    // fetch('/api/tasks', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updatedTasks)
    // })
    
    toast.success('Задачи обновлены')
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Управление задачами</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-4 w-4 text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Загрузка задач...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-4">Активные задачи</h2>
            <Todo 
              initialTodos={tasks} 
              onChange={handleTasksChange}
            />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Приоритетность задач</h2>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-medium">Высокий приоритет</span>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tasks.filter(task => task.priority === 'high' && !task.completed).length}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-medium">Средний приоритет</span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tasks.filter(task => task.priority === 'medium' && !task.completed).length}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-medium">Низкий приоритет</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tasks.filter(task => task.priority === 'low' && !task.completed).length}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Завершенные задачи</span>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {tasks.filter(task => task.completed).length}
                  </span>
                </div>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mt-6 mb-4">Завершенные задачи</h2>
            <Todo 
              initialTodos={tasks.filter(task => task.completed)} 
              readOnly={true}
            />
          </div>
        </div>
      )}
    </div>
  )
} 