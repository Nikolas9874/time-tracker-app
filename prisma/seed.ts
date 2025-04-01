import { PrismaClient } from '@prisma/client'
import { formatDateISO } from '../lib/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('Начинаем заполнение базы данных тестовыми данными...')

  // Проверяем наличие сотрудников
  const existingEmployeesCount = await prisma.employee.count()
  
  if (existingEmployeesCount === 0) {
    console.log('Создаем тестовых сотрудников...')
    
    const employees = [
      {
        name: 'Иванов Иван',
        position: 'Разработчик',
        department: 'ИТ',
        email: 'ivanov@example.com'
      },
      {
        name: 'Петрова Анна',
        position: 'Дизайнер',
        department: 'ИТ',
        email: 'petrova@example.com'
      },
      {
        name: 'Сидоров Алексей',
        position: 'Менеджер проекта',
        department: 'Управление',
        email: 'sidorov@example.com'
      },
      {
        name: 'Смирнова Екатерина',
        position: 'Тестировщик',
        department: 'ИТ',
        email: 'smirnova@example.com'
      },
      {
        name: 'Козлов Дмитрий',
        position: 'Системный администратор',
        department: 'ИТ',
        email: 'kozlov@example.com'
      }
    ]
    
    // Добавляем сотрудников
    for (const employee of employees) {
      await prisma.employee.create({
        data: employee
      })
    }
    
    console.log(`Создано ${employees.length} тестовых сотрудников`)
  } else {
    console.log(`В базе уже есть ${existingEmployeesCount} сотрудников, пропускаем создание тестовых данных`)
  }

  // Получаем созданных сотрудников
  const dbEmployees = await prisma.employee.findMany()

  // Создаем рабочие дни за последние 30 дней
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - 30)

  // Для каждого сотрудника создаем рабочие дни
  for (const employee of dbEmployees) {
    let currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
      const dayType = isWeekend ? 'DAY_OFF' : 'WORK_DAY'
      
      const formattedDate = formatDateISO(currentDate)
      
      // Проверяем, существует ли уже запись
      const existingRecord = await prisma.workDay.findFirst({
        where: {
          employeeId: employee.id,
          date: currentDate
        }
      })
      
      if (!existingRecord) {
        if (dayType === 'WORK_DAY') {
          // Создаем рабочий день с временем
          const startTime = new Date(currentDate)
          startTime.setHours(9, 0, 0, 0)
          
          const endTime = new Date(currentDate)
          endTime.setHours(18, 0, 0, 0)
          
          const lunchStartTime = new Date(currentDate)
          lunchStartTime.setHours(13, 0, 0, 0)
          
          const lunchEndTime = new Date(currentDate)
          lunchEndTime.setHours(14, 0, 0, 0)
          
          const timeEntry = {
            startTime,
            endTime,
            lunchStartTime,
            lunchEndTime
          }
          
          // Генерируем случайное количество задач
          const tasksCount = Math.floor(Math.random() * 5) + 1
          const tasks = Array.from({ length: tasksCount }, (_, i) => ({
            id: `task-${i}-${formattedDate}-${employee.id}`,
            name: `Задача ${i + 1}`,
            description: `Описание задачи ${i + 1}`
          }))
          
          // Генерируем случайное количество связей
          const connectionsCount = Math.floor(Math.random() * 3)
          const connections = Array.from({ length: connectionsCount }, (_, i) => ({
            id: `conn-${i}-${formattedDate}-${employee.id}`,
            name: `Связь ${i + 1}`,
            duration: Math.floor(Math.random() * 60) + 30
          }))
          
          await prisma.workDay.create({
            data: {
              employeeId: employee.id,
              date: currentDate,
              dayType: dayType,
              timeEntry: JSON.stringify(timeEntry),
              tasks: JSON.stringify(tasks),
              connections: JSON.stringify(connections),
              comment: `Рабочий день ${formattedDate}`
            }
          })
        } else {
          // Создаем нерабочий день
          await prisma.workDay.create({
            data: {
              employeeId: employee.id,
              date: currentDate,
              dayType: dayType,
              comment: `Выходной день ${formattedDate}`
            }
          })
        }
      }
      
      // Переходим к следующему дню
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  // Создаем пользователя для авторизации
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // В реальном приложении пароли должны быть хешированы
      email: 'admin@example.com',
      role: 'admin'
    }
  })

  console.log('Seed завершен успешно!')
}

main()
  .catch((e) => {
    console.error('Ошибка во время seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 