const express = require('express');
const next = require('next');
const path = require('path');
const cors = require('cors');

const port = parseInt(process.env.PORT || '3001', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

console.log(`Server starting in ${dev ? 'development' : 'production'} mode`);
console.log(`Port: ${port}`);

app.prepare()
  .then(() => {
    const server = express();
    
    // Включаем CORS
    server.use(cors());
    
    // Добавляем логирование запросов
    server.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
    
    // Обслуживаем статические файлы
    server.use('/_next', express.static(path.join(__dirname, '.next')));
    server.use('/public', express.static(path.join(__dirname, 'public')));
    
    // Добавляем простой health endpoint
    server.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });
    
    // Все остальные запросы обрабатываем через Next.js
    server.all('*', (req, res) => {
      return handle(req, res);
    });
    
    server.listen(port, (err) => {
      if (err) {
        console.error('Error starting server:', err);
        throw err;
      }
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
  }); 