# Миграция на PostgreSQL

## Предварительные требования
1. Установленный PostgreSQL на сервере:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

## Шаги миграции

### 1. Подготовка на сервере
1. Остановите приложение перед началом миграции:
   ```bash
   pm2 stop time-tracker-app
   ```

2. Сделайте резервную копию базы данных (SQLite):
   ```bash
   cp prisma/dev.db prisma/dev.db.backup
   ```

3. Установите необходимые переменные окружения:
   ```bash
   export DB_USER=timetracker_user
   export DB_PASSWORD=ваш_надежный_пароль
   export DB_NAME=timetracker
   ```

### 2. Миграция данных
1. Запустите скрипт миграции:
   ```bash
   npm run migrate-to-postgres
   ```

2. Скрипт предложит два варианта миграции:
   - Вариант 1: Создать новую пустую базу данных со схемой (без данных)
   - Вариант 2: Выполнить полную миграцию данных с использованием pgloader

3. Если вы выбрали вариант 2 (полная миграция), установите pgloader:
   ```bash
   sudo apt-get install pgloader
   ```

   И выполните миграцию данных:
   ```bash
   pgloader sqlite:./prisma/dev.db postgresql://timetracker_user:ваш_надежный_пароль@localhost:5432/timetracker
   ```

### 3. Применение изменений
1. Проверьте файл .env.production и скопируйте его содержимое в .env:
   ```bash
   cp .env.production .env
   ```

2. Соберите приложение:
   ```bash
   npm run build
   ```

3. Перезапустите приложение:
   ```bash
   pm2 restart time-tracker-app
   ```

## Отладка и проверка
1. Проверьте логи приложения на предмет ошибок:
   ```bash
   pm2 logs time-tracker-app
   ```

2. Проверьте доступность базы данных PostgreSQL:
   ```bash
   sudo -u postgres psql -c "SELECT current_database(), current_user"
   ```

3. Проверьте содержимое базы данных:
   ```bash
   sudo -u postgres psql -d timetracker -c "SELECT COUNT(*) FROM \"Employee\""
   ```

## Откат изменений (при необходимости)
1. Восстановите файл .env из резервной копии:
   ```bash
   cp .env.backup .env
   ```

2. Восстановите базу данных SQLite:
   ```bash
   cp prisma/dev.db.backup prisma/dev.db
   ```

3. Соберите приложение и перезапустите:
   ```bash
   npm run build
   pm2 restart time-tracker-app
   ``` 