# Документация по компонентам

## UI-компоненты

### Button

Базовый компонент кнопки, используемый во всем приложении.

#### Пропсы

| Имя | Тип | По умолчанию | Описание |
|-----|-----|-------------|----------|
| `variant` | `'primary' \| 'outline' \| 'destructive' \| 'ghost'` | `'primary'` | Вариант стиля кнопки |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер кнопки |
| `className` | `string` | `undefined` | Дополнительные CSS-классы |
| `disabled` | `boolean` | `false` | Флаг отключения кнопки |
| `children` | `React.ReactNode` | — | Содержимое кнопки |

#### Пример использования

```tsx
import Button from '@/components/ui/Button'

function Example() {
  return (
    <div>
      <Button>Стандартная кнопка</Button>
      <Button variant="outline">Кнопка с контуром</Button>
      <Button variant="destructive">Кнопка удаления</Button>
      <Button size="sm">Маленькая кнопка</Button>
      <Button disabled>Отключенная кнопка</Button>
    </div>
  )
}
```

### DatePicker

Компонент для выбора даты.

#### Пропсы

| Имя | Тип | По умолчанию | Описание |
|-----|-----|-------------|----------|
| `value` | `string` | — | Текущая дата в формате YYYY-MM-DD |
| `onChange` | `(date: string) => void` | — | Функция обратного вызова при изменении даты |
| `disabled` | `boolean` | `false` | Флаг отключения компонента |

#### Пример использования

```tsx
import DatePicker from '@/components/ui/DatePicker'
import { useState } from 'react'

function Example() {
  const [date, setDate] = useState('2025-04-01')
  
  return (
    <DatePicker 
      value={date} 
      onChange={setDate} 
    />
  )
}
```

## Компоненты для табеля

### TimesheetTable

Основной компонент для отображения и редактирования табеля рабочего времени.

#### Пропсы

| Имя | Тип | По умолчанию | Описание |
|-----|-----|-------------|----------|
| `workDays` | `WorkDay[]` | — | Массив рабочих дней |
| `currentDate` | `string` | — | Текущая выбранная дата в формате YYYY-MM-DD |
| `isLoading` | `boolean` | — | Флаг загрузки данных |
| `onSave` | `(workDay: WorkDayCreateRequest \| WorkDayUpdateRequest) => Promise<boolean>` | — | Функция сохранения рабочего дня |
| `onDelete` | `(workDayId: string) => Promise<boolean>` | — | Функция удаления рабочего дня |

#### Пример использования

```tsx
import TimesheetTable from '@/components/timesheet/TimesheetTable'

function TimesheetPage() {
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  const [currentDate, setCurrentDate] = useState('2025-04-01')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSave = async (workDay) => {
    // Логика сохранения
    return true
  }
  
  const handleDelete = async (id) => {
    // Логика удаления
    return true
  }
  
  return (
    <TimesheetTable 
      workDays={workDays}
      currentDate={currentDate}
      isLoading={isLoading}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  )
}
```

### DateNavigation

Компонент для навигации по датам.

#### Пропсы

| Имя | Тип | По умолчанию | Описание |
|-----|-----|-------------|----------|
| `currentDate` | `string` | — | Текущая выбранная дата в формате YYYY-MM-DD |
| `onDateChange` | `(date: string) => void` | — | Функция обратного вызова при изменении даты |
| `disabled` | `boolean` | `false` | Флаг отключения компонента |

#### Пример использования

```tsx
import DateNavigation from '@/components/timesheet/DateNavigation'
import { useState } from 'react'

function Example() {
  const [date, setDate] = useState('2025-04-01')
  
  return (
    <DateNavigation 
      currentDate={date} 
      onDateChange={setDate} 
    />
  )
}
```

### TimesheetChart

Компонент для отображения графиков по рабочему времени.

#### Пропсы

| Имя | Тип | По умолчанию | Описание |
|-----|-----|-------------|----------|
| `workDays` | `WorkDay[]` | — | Массив рабочих дней |

#### Пример использования

```tsx
import TimesheetChart from '@/components/timesheet/TimesheetChart'

function Example() {
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  
  return (
    <TimesheetChart workDays={workDays} />
  )
}
```

### TimesheetStats

Компонент для отображения статистики по рабочему времени.

#### Пропсы

| Имя | Тип | По умолчанию | Описание |
|-----|-----|-------------|----------|
| `workDays` | `WorkDay[]` | — | Массив рабочих дней |

#### Пример использования

```tsx
import TimesheetStats from '@/components/timesheet/TimesheetStats'

function Example() {
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  
  return (
    <TimesheetStats workDays={workDays} />
  )
}
```

## Навигация и макет

### Navbar

Компонент главной навигационной панели.

#### Пример использования

```tsx
import Navbar from '@/components/ui/Navbar'

function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
```

### Layout

Компонент макета для всего приложения.

#### Пример использования

```tsx
import Layout from '@/components/layout'

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
``` 