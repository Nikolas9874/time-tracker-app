'use client'

import React, { useState, useEffect } from 'react'
import Button from './Button'

export interface TodoItem {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
}

interface TodoProps {
  initialTodos?: TodoItem[]
  onChange?: (todos: TodoItem[]) => void
  readOnly?: boolean
}

const Todo = ({ initialTodos = [], onChange, readOnly = false }: TodoProps) => {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newTodoDueDate, setNewTodoDueDate] = useState('')

  useEffect(() => {
    if (onChange) {
      onChange(todos)
    }
  }, [todos, onChange])

  const handleAddTodo = () => {
    if (newTodoTitle.trim() === '' || readOnly) return

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: newTodoTitle,
      completed: false,
      priority: newTodoPriority,
      dueDate: newTodoDueDate || undefined
    }

    setTodos([...todos, newTodo])
    setNewTodoTitle('')
    setNewTodoPriority('medium')
    setNewTodoDueDate('')
  }

  const handleToggleTodo = (id: string) => {
    if (readOnly) return
    
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const handleDeleteTodo = (id: string) => {
    if (readOnly) return
    
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const getPriorityClass = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="rounded-md border border-gray-200 overflow-hidden bg-white">
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Задачи</h3>
      </div>

      {!readOnly && (
        <div className="p-3 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              className="w-full rounded border-gray-300 text-xs"
              placeholder="Добавить новую задачу..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <select
                  className="w-full rounded text-xs border-gray-300"
                  value={newTodoPriority}
                  onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              
              <div className="flex-1">
                <input
                  type="date"
                  className="w-full rounded border-gray-300 text-xs"
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleAddTodo}
                size="sm"
                className="px-3 py-1 h-7 text-xs"
              >
                Добавить
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {todos.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-xs">
            Нет задач
          </div>
        ) : (
          todos.map(todo => (
            <div key={todo.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className={`text-xs ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {todo.title}
                </div>
                <span className={`text-2xs px-1.5 py-0.5 rounded-full ${getPriorityClass(todo.priority)}`}>
                  {todo.priority === 'low' ? 'Низкий' : todo.priority === 'medium' ? 'Средний' : 'Высокий'}
                </span>
                {todo.dueDate && (
                  <span className="text-2xs text-gray-500">
                    {new Date(todo.dueDate).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
              
              {!readOnly && (
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Удалить
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Todo 