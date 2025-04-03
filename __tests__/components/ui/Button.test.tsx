import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button компонент', () => {
  test('рендерит текст кнопки', () => {
    render(<Button>Тест кнопки</Button>)
    expect(screen.getByText('Тест кнопки')).toBeInTheDocument()
  })

  test('применяет класс primary по умолчанию', () => {
    render(<Button>Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')
  })

  test('применяет класс outline при соответствующем варианте', () => {
    render(<Button variant="outline">Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-gray-300')
  })

  test('применяет класс destructive при соответствующем варианте', () => {
    render(<Button variant="destructive">Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-600')
  })

  test('применяет класс size sm при указании размера sm', () => {
    render(<Button size="sm">Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')
  })

  test('применяет класс size lg при указании размера lg', () => {
    render(<Button size="lg">Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-12')
  })

  test('добавляет дополнительные классы через className', () => {
    render(<Button className="test-class">Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('test-class')
  })

  test('вызывает onClick при клике', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Тест кнопки</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('отключается при disabled=true', () => {
    render(<Button disabled>Тест кнопки</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
}) 