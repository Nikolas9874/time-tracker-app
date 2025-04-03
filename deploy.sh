#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying time-tracker-app to VPS...${NC}"

# Проверка наличия изменений в Git
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}Uncommitted changes detected.${NC}"
  read -p "Do you want to commit these changes before deploying? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Committing changes...${NC}"
    git add .
    read -p "Enter commit message: " commitMessage
    git commit -m "$commitMessage"
  fi
fi

# Обновление репозитория
echo -e "${GREEN}Pushing changes to GitHub...${NC}"
git push

# Подключение к VPS и выполнение команд
echo -e "${GREEN}Connecting to VPS...${NC}"
ssh nikvl@10.40.0.122 << 'EOF'
  cd /var/www/time-tracker-app
  echo "Pulling changes from Git..."
  git pull
  
  echo "Installing dependencies..."
  npm install
  
  echo "Building the application..."
  npm run build
  
  echo "Restarting the application..."
  # Останавливаем текущий процесс приложения
  pm2 stop time-tracker || true
  
  # Запускаем новую версию приложения
  PORT=3001 pm2 start npm --name "time-tracker" -- run start
  
  echo "Deployment completed!"
EOF

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  echo -e "${GREEN}Application is now running at http://10.40.0.122:3001${NC}"
else
  echo -e "${RED}Deployment failed!${NC}"
fi 