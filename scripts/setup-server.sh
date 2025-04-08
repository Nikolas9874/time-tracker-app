#!/bin/bash

# Скрипт для установки и настройки приложения на сервере

set -e

echo "🚀 Начинаем установку и настройку приложения time-tracker-app..."

# Проверяем наличие необходимых инструментов
command -v node >/dev/null 2>&1 || { echo "❌ Node.js не установлен. Пожалуйста, установите Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm не установлен. Пожалуйста, установите npm"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "⚠️ PM2 не установлен. Рекомендуется установить PM2 для управления процессами: npm install -g pm2"; }

# Установка зависимостей
echo "📦 Устанавливаем зависимости..."
npm install

# Генерация клиента Prisma
echo "🔧 Генерируем клиент Prisma..."
npx prisma generate

# Проверяем конфигурацию базы данных
if [ ! -f .env ]; then
  echo "⚠️ Файл .env не найден. Создаем стандартный файл .env..."
  echo "DATABASE_URL=\"file:./prisma/dev.db\"" > .env
  echo "NEXTAUTH_SECRET=\"ваш_секретный_ключ\"" >> .env
  echo "NEXTAUTH_URL=\"http://localhost:3001\"" >> .env
  echo "✅ Файл .env создан. Рекомендуется обновить значения для рабочей среды."
else
  echo "✅ Файл .env найден."
fi

# Сборка приложения
echo "🏗️ Собираем приложение..."
npm run build

# Предлагаем запустить приложение с PM2, если он установлен
if command -v pm2 >/dev/null 2>&1; then
  echo ""
  echo "🚀 Рекомендуется запустить приложение с помощью PM2:"
  echo "pm2 start npm --name \"time-tracker-app\" -- start"
  echo ""
  read -p "Запустить сейчас? (y/n): " start_now
  if [ "$start_now" = "y" ]; then
    pm2 start npm --name "time-tracker-app" -- start
    echo "✅ Приложение запущено с PM2. Вы можете проверить его статус с помощью 'pm2 status'."
  else
    echo "⚠️ Приложение не запущено. Вы можете запустить его позже с помощью 'npm start' или 'pm2 start npm --name \"time-tracker-app\" -- start'."
  fi
else
  echo ""
  echo "🚀 Вы можете запустить приложение с помощью команды:"
  echo "npm start"
  echo ""
fi

echo ""
echo "✅ Установка и настройка завершены!"
echo "🌐 Приложение должно быть доступно по адресу: http://localhost:3001"
echo "" 