#!/bin/bash

# Скрипт для миграции базы данных с SQLite на PostgreSQL

set -e

# Проверяем наличие переменных окружения
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "Ошибка: необходимо установить переменные окружения DB_USER, DB_PASSWORD и DB_NAME"
  echo "Пример:"
  echo "export DB_USER=timetracker_user"
  echo "export DB_PASSWORD=ваш_пароль"
  echo "export DB_NAME=timetracker"
  exit 1
fi

echo "🔄 Начинаем миграцию базы данных на PostgreSQL..."

# Сохраняем старый DATABASE_URL, если он существует
if [ -f .env ]; then
  OLD_DB_URL=$(grep DATABASE_URL .env || echo "")
  echo "📋 Сохранен текущий URL базы данных: $OLD_DB_URL"
  # Создаем резервную копию .env файла
  cp .env .env.backup
  echo "📑 Создана резервная копия .env файла (.env.backup)"
fi

# Создаем базу данных и пользователя в PostgreSQL
echo "🔧 Настраиваем базу данных PostgreSQL..."
echo "💾 Создаем базу данных и пользователя..."

sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

# Обновляем .env файл с новым URL
NEW_DB_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo "DATABASE_URL=\"$NEW_DB_URL\"" > .env.production

echo "✅ Создана база данных PostgreSQL и пользователь"
echo "✅ Создан файл .env.production с новым URL базы данных"

# Генерируем клиент Prisma с новой схемой
echo "🔧 Генерируем клиент Prisma..."
npx prisma generate

# Предлагаем реальные варианты миграции
echo ""
echo "⚠️ ВАЖНО: Выберите способ миграции данных:"
echo "1) Создать новую базу данных без данных (создаст только схему)"
echo "2) Выполнить полную миграцию данных из SQLite в PostgreSQL (требуется дополнительная настройка)"
echo ""
read -p "Выберите вариант (1/2): " migration_option

if [ "$migration_option" = "1" ]; then
  # Простое создание схемы без данных
  echo "🔧 Создаем новую схему базы данных..."
  DATABASE_URL="$NEW_DB_URL" npx prisma migrate deploy
  echo "✅ Схема базы данных создана успешно"
elif [ "$migration_option" = "2" ]; then
  # Полная миграция данных
  echo "⚠️ Для полной миграции данных требуется дополнительная настройка."
  echo "📋 Выполните следующие шаги вручную:"
  echo "1. Убедитесь, что у вас есть резервная копия базы данных SQLite"
  echo "2. Используйте инструмент pgloader для миграции данных:"
  echo "   - Установите pgloader: sudo apt-get install pgloader"
  echo "   - Создайте файл миграции и выполните миграцию"
  echo ""
  echo "📄 Пример команды для pgloader:"
  echo "pgloader sqlite:./prisma/dev.db postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
else
  echo "❌ Неверный выбор. Миграция отменена."
  exit 1
fi

echo ""
echo "✅ Миграция базы данных завершена"
echo ""
echo "📝 Следующие шаги:"
echo "1. Проверьте файл .env.production и скопируйте его содержимое в .env"
echo "2. Соберите приложение: npm run build"
echo "3. Перезапустите сервер: pm2 restart time-tracker-app"
echo "" 