const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Путь к приложению Next.js
  dir: './',
})

// Пользовательский конфиг Jest
const customJestConfig = {
  // Добавляем больше настроек для Jest
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  }
}

// Создаем конфиг Next.js + Jest
module.exports = createJestConfig(customJestConfig) 