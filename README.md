This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
Основные команды настройки сервера
Обновление системы:
  sudo apt update
  sudo apt upgrade -y
Установка Node.js и npm:
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
Проверка версий:
  node -v
  npm -v
Установка Git:
  sudo apt install git -y
Клонирование и настройка проекта
Создание директории и клонирование:
  mkdir -p /var/www
  cd /var/www
  git clone https://github.com/Nikolas9874/time-tracker-app.git
  cd time-tracker-app
Установка зависимостей:
  npm install
Исправление ошибки с heroicons:
  npm install @heroicons/react@2.2.0
Создание файла .env:
  cat > .env << 'EOF'
  # Prisma configuration
  DATABASE_URL="file:./dev.db"
  # Дополнительные настройки, если потребуются
  EOF
Сборка и запуск приложения
Сборка приложения:
  npm run build
Установка и настройка PM2:
  sudo npm install -g pm2
  pm2 start npm --name "time-tracker" -- start
  pm2 startup
  pm2 save
Настройка Nginx для проксирования
Установка Nginx:
  sudo apt install nginx -y
Создание конфигурации сайта:
  sudo cat > /etc/nginx/sites-available/time-tracker << 'EOF'
  server {
      listen 80;
      server_name ваш_домен_или_IP;

      location / {
          proxy_pass http://localhost:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  EOF
Активация конфигурации и перезапуск сервера:
  sudo ln -s /etc/nginx/sites-available/time-tracker /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl restart nginx
SSL-сертификат (опционально)
Установка Let's Encrypt:
  sudo apt install certbot python3-certbot-nginx -y
  sudo certbot --nginx -d ваш_домен
Резервное копирование данных
Создание скрипта резервного копирования:
  sudo cat > /etc/cron.daily/time-tracker-backup << 'EOF'
  #!/bin/bash
  DATE=$(date +"%Y-%m-%d")
  BACKUP_DIR="/var/backups/time-tracker"
  mkdir -p $BACKUP_DIR
  cp /var/www/time-tracker-app/workdays_data.json $BACKUP_DIR/workdays_data-$DATE.json
  cp /var/www/time-tracker-app/employees_data.json $BACKUP_DIR/employees_data-$DATE.json
  cp /var/www/time-tracker-app/prisma/dev.db $BACKUP_DIR/dev-$DATE.db
  EOF
  sudo chmod +x /etc/cron.daily/time-tracker-backup
Команды для обслуживания системы
Перезапуск приложения:
  pm2 restart time-tracker
Просмотр логов:
  pm2 logs time-tracker
Мониторинг процессов:
  pm2 monit
Обновление приложения:
  cd /var/www/time-tracker-app
  git pull
  npm install
  npm run build
  pm2 restart time-tracker

Проверка работы приложения:
  curl http://localhost:3000

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
