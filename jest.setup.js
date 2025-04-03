// Импорт jest-dom добавляет пользовательские матчеры для Jest
import '@testing-library/jest-dom'

// Мокаем fetch API для тестов
global.fetch = jest.fn()

// Мокаем toast уведомления
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
})) 