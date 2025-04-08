# Инструкция по установке Time Tracker App

## Требования
- Node.js (версия 18+)
- npm (версия 8+)
- PostgreSQL или SQLite
- PM2 (опционально, для управления процессами)

## Быстрая установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/Nikolas9874/time-tracker-app.git
cd time-tracker-app
```

### 2. Запуск скрипта установки
Мы создали скрипт, который автоматизирует процесс установки:
```bash
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

Скрипт выполнит следующие действия:
- Установит зависимости
- Сгенерирует клиент Prisma
- Проверит наличие файла .env и создаст его при необходимости
- Соберет приложение
- Предложит запустить приложение с помощью PM2

## Ручная установка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env` в корне проекта со следующими переменными:

#### Для SQLite (по умолчанию):
```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="ваш_секретный_ключ"
NEXTAUTH_URL="http://ваш_домен:3001"
```

#### Для PostgreSQL:
```
DATABASE_URL="postgresql://пользователь:пароль@хост:5432/имя_базы"
NEXTAUTH_SECRET="ваш_секретный_ключ"
NEXTAUTH_URL="http://ваш_домен:3001"
```

### 3. Генерация клиента Prisma и инициализация базы данных
```bash
npx prisma generate
npx prisma db push
```

### 4. Сборка приложения
```bash
npm run build
```

### 5. Запуск приложения
#### Без PM2:
```bash
npm start
```

#### С PM2 (рекомендуется для production):
```bash
pm2 start npm --name "time-tracker-app" -- start
```

## Миграция с SQLite на PostgreSQL

Если вам нужно мигрировать с SQLite на PostgreSQL, выполните:

```bash
# Установите PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Выполните миграцию
export DB_USER=timetracker_user
export DB_PASSWORD=ваш_надежный_пароль
export DB_NAME=timetracker
npm run migrate-to-postgres
```

Следуйте инструкциям в [MIGRATION.md](MIGRATION.md) для получения дополнительной информации.

## Устранение неполадок

### Проблемы с зависимостями
Если возникли проблемы с зависимостями, попробуйте:
```bash
rm -rf node_modules
rm -rf .next
npm install
npx prisma generate
npm run build
```

### Проблемы с базой данных
Убедитесь, что у вас правильно настроен файл `.env` с корректным URL базы данных.

### Проблемы с портом
По умолчанию приложение использует порт 3001. Если порт занят, измените его в файле `.env` и `package.json`:
```
# В .env
PORT=3002
NEXTAUTH_URL="http://ваш_домен:3002"

# В package.json обновите скрипты dev и start:
"dev": "PORT=3002 next dev",
"start": "PORT=3002 next start"
```

## Дополнительная информация
Смотрите [README.md](README.md) для получения информации о функциональности приложения. 