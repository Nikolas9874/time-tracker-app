# Настройка VPS для Time Tracker App

Это руководство описывает процесс настройки VPS-сервера для запуска приложения Time Tracker.

## Системные требования

- Ubuntu 20.04 или новее
- Node.js 20.x
- npm 10.x
- PM2 (глобальная установка)
- Git

## Первоначальная настройка сервера

### 1. Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Установка Node.js и npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Проверка установки:
```bash
node -v  # Должно показать v20.x.x
npm -v   # Должно показать v10.x.x
```

### 3. Установка PM2

```bash
sudo npm install -g pm2
```

### 4. Настройка Git

```bash
sudo apt install -y git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Развертывание приложения

### 1. Создание директории для приложения

```bash
sudo mkdir -p /var/www/time-tracker-app
sudo chown -R $USER:$USER /var/www/time-tracker-app
```

### 2. Клонирование репозитория

```bash
cd /var/www
git clone https://github.com/username/time-tracker-app.git time-tracker-app
cd time-tracker-app
```

### 3. Установка зависимостей и сборка приложения

```bash
npm install
npm run build
```

### 4. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
cat > .env << EOF
PORT=3001
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_API_URL="http://10.40.0.122:3001/api"
JWT_SECRET="supersecretkey123456789"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
EOF
```

### 5. Запуск приложения с помощью PM2

```bash
PORT=3001 pm2 start npm --name "time-tracker" -- run start
```

### 6. Настройка автозапуска PM2

```bash
pm2 startup
# Выполните команду, которую выдаст предыдущая команда
pm2 save
```

## Обновление приложения

### Ручное обновление

```bash
cd /var/www/time-tracker-app
git pull
npm install
npm run build
pm2 restart time-tracker
```

### Автоматическое обновление с локальной машины

На локальной машине запустите скрипт деплоя:

```bash
./deploy.sh
```

## Мониторинг приложения

### Просмотр логов

```bash
pm2 logs time-tracker
```

### Мониторинг ресурсов

```bash
pm2 monit
```

### Статус приложения

```bash
pm2 status
```

## Решение проблем

### Приложение не запускается

1. Проверьте порт:
   ```bash
   sudo netstat -tulpn | grep 3001
   ```

2. Проверьте логи:
   ```bash
   pm2 logs time-tracker
   ```

3. Проверьте файл .env:
   ```bash
   cat .env
   ```

### Ошибка базы данных

1. Проверьте доступность файла базы данных:
   ```bash
   ls -la prisma/dev.db
   ```

2. Попробуйте пересоздать базу данных:
   ```bash
   npx prisma migrate reset --force
   ```

## Контакты для поддержки

При возникновении проблем обращайтесь к администратору системы. 