import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DateNavigation from '@/components/timesheet/DateNavigation'

// Мокаем функцию formatDate из utils
jest.mock('@/lib/utils', () => ({
  formatDate: jest.fn().mockImplementation((date) => {
    return new Date(date).toLocaleDateString('ru-RU')
  })
}))

describe('DateNavigation компонент', () => {
  const mockOnDateChange = jest.fn()
  const currentDate = '2025-04-15'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('рендерит компонент с текущей датой', () => {
    render(
      <DateNavigation 
        currentDate={currentDate} 
        onDateChange={mockOnDateChange}
      />
    )
    
    expect(screen.getByText('15.04.2025')).toBeInTheDocument()
    expect(screen.getByText('Пред. день')).toBeInTheDocument()
    expect(screen.getByText('Сегодня')).toBeInTheDocument()
    expect(screen.getByText('След. день')).toBeInTheDocument()
  })

  test('вызывает onDateChange с предыдущим днем при нажатии на "Пред. день"', () => {
    render(
      <DateNavigation 
        currentDate={currentDate} 
        onDateChange={mockOnDateChange}
      />
    )
    
    fireEvent.click(screen.getByText(/Пред. день/))
    expect(mockOnDateChange).toHaveBeenCalledWith('2025-04-14')
  })

  test('вызывает onDateChange со следующим днем при нажатии на "След. день"', () => {
    render(
      <DateNavigation 
        currentDate={currentDate} 
        onDateChange={mockOnDateChange}
      />
    )
    
    fireEvent.click(screen.getByText(/След. день/))
    expect(mockOnDateChange).toHaveBeenCalledWith('2025-04-16')
  })

  test('вызывает onDateChange с сегодняшней датой при нажатии на "Сегодня"', () => {
    // Мокируем текущую дату
    const mockDate = new Date('2025-05-01T12:00:00')
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
    
    render(
      <DateNavigation 
        currentDate={currentDate} 
        onDateChange={mockOnDateChange}
      />
    )
    
    fireEvent.click(screen.getByText('Сегодня'))
    expect(mockOnDateChange).toHaveBeenCalledWith('2025-05-01')
    
    // Восстанавливаем оригинальную реализацию Date
    jest.restoreAllMocks()
  })

  test('отключает кнопки, когда disabled=true', () => {
    render(
      <DateNavigation 
        currentDate={currentDate} 
        onDateChange={mockOnDateChange}
        disabled={true}
      />
    )
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })
}) 