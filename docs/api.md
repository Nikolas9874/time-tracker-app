# Документация по API

## Аутентификация

### POST /api/auth

Авторизация пользователя в системе.

#### Запрос

```json
{
  "username": "admin",
  "password": "secretpassword"
}
```

#### Ответ

```json
{
  "user": {
    "id": "1",
    "username": "admin",
    "role": "ADMIN"
  },
  "token": "jwt-token-here"
}
```

### GET /api/auth/me

Получение информации о текущем пользователе.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "id": "1",
  "username": "admin",
  "role": "ADMIN",
  "name": "Admin User"
}
```

### POST /api/auth/register

Регистрация нового пользователя (только для администраторов).

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "username": "newuser",
  "password": "userpassword",
  "role": "USER",
  "name": "New User"
}
```

#### Ответ

```json
{
  "success": true,
  "user": {
    "id": "2",
    "username": "newuser",
    "role": "USER",
    "name": "New User"
  }
}
```

### POST /api/auth/change-password

Изменение пароля текущего пользователя.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### Ответ

```json
{
  "success": true
}
```

## Сотрудники

### GET /api/employees

Получение списка всех сотрудников.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `search` | `string` | Нет | Поиск по имени или должности |
| `department` | `string` | Нет | Фильтр по отделу |

#### Ответ

```json
[
  {
    "id": "1",
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "position": "Разработчик",
    "department": "IT"
  },
  {
    "id": "2",
    "name": "Мария Петрова",
    "email": "maria@example.com",
    "position": "Дизайнер",
    "department": "Дизайн"
  }
]
```

### GET /api/employees/:id

Получение информации о конкретном сотруднике.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "id": "1",
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "position": "Разработчик",
  "department": "IT"
}
```

### POST /api/employees

Создание нового сотрудника.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "name": "Новый Сотрудник",
  "email": "new@example.com",
  "position": "Менеджер",
  "department": "Продажи"
}
```

#### Ответ

```json
{
  "id": "3",
  "name": "Новый Сотрудник",
  "email": "new@example.com",
  "position": "Менеджер",
  "department": "Продажи"
}
```

### PUT /api/employees/:id

Обновление информации о сотруднике.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "name": "Обновленное Имя",
  "email": "updated@example.com",
  "position": "Старший разработчик",
  "department": "IT"
}
```

#### Ответ

```json
{
  "id": "1",
  "name": "Обновленное Имя",
  "email": "updated@example.com",
  "position": "Старший разработчик",
  "department": "IT"
}
```

### DELETE /api/employees/:id

Удаление сотрудника.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "success": true
}
```

## Рабочие дни

### GET /api/workdays

Получение списка рабочих дней.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `date` | `string` | Нет | Дата в формате YYYY-MM-DD |
| `employeeId` | `string` | Нет | ID сотрудника |
| `from` | `string` | Нет | Начальная дата периода в формате YYYY-MM-DD |
| `to` | `string` | Нет | Конечная дата периода в формате YYYY-MM-DD |

#### Ответ

```json
[
  {
    "id": "1",
    "employeeId": "1",
    "employee": {
      "id": "1",
      "name": "Иван Иванов",
      "position": "Разработчик"
    },
    "date": "2025-04-01",
    "dayType": "WORK_DAY",
    "timeEntry": {
      "startTime": "2025-04-01T09:00:00.000Z",
      "endTime": "2025-04-01T18:00:00.000Z",
      "lunchStartTime": "2025-04-01T13:00:00.000Z",
      "lunchEndTime": "2025-04-01T14:00:00.000Z"
    },
    "comment": "Работа над проектом"
  },
  {
    "id": "2",
    "employeeId": "2",
    "employee": {
      "id": "2",
      "name": "Мария Петрова",
      "position": "Дизайнер"
    },
    "date": "2025-04-01",
    "dayType": "VACATION",
    "timeEntry": null,
    "comment": "Отпуск"
  }
]
```

### POST /api/workdays

Создание нового рабочего дня.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "employeeId": "1",
  "date": "2025-04-02",
  "dayType": "WORK_DAY",
  "timeEntry": {
    "startTime": "2025-04-02T09:00:00.000Z",
    "endTime": "2025-04-02T18:00:00.000Z",
    "lunchStartTime": "2025-04-02T13:00:00.000Z",
    "lunchEndTime": "2025-04-02T14:00:00.000Z"
  },
  "comment": "Обычный рабочий день"
}
```

#### Ответ

```json
{
  "id": "3",
  "employeeId": "1",
  "employee": {
    "id": "1",
    "name": "Иван Иванов",
    "position": "Разработчик"
  },
  "date": "2025-04-02",
  "dayType": "WORK_DAY",
  "timeEntry": {
    "startTime": "2025-04-02T09:00:00.000Z",
    "endTime": "2025-04-02T18:00:00.000Z",
    "lunchStartTime": "2025-04-02T13:00:00.000Z",
    "lunchEndTime": "2025-04-02T14:00:00.000Z"
  },
  "comment": "Обычный рабочий день"
}
```

### PUT /api/workdays

Обновление рабочего дня.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "id": "1",
  "dayType": "SICK_LEAVE",
  "timeEntry": null,
  "comment": "Больничный"
}
```

#### Ответ

```json
{
  "id": "1",
  "employeeId": "1",
  "employee": {
    "id": "1",
    "name": "Иван Иванов",
    "position": "Разработчик"
  },
  "date": "2025-04-01",
  "dayType": "SICK_LEAVE",
  "timeEntry": null,
  "comment": "Больничный"
}
```

### DELETE /api/workdays?id=:id

Удаление рабочего дня.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `id` | `string` | Да | ID рабочего дня |

#### Ответ

```json
{
  "success": true
}
```

## Резервное копирование

### GET /api/backup

Создание резервной копии данных.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "success": true,
  "backupId": "backup_20250401120000",
  "fileName": "backup_20250401120000.json",
  "timestamp": "2025-04-01T12:00:00.000Z"
}
```

### POST /api/backup

Восстановление из резервной копии.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Запрос

```json
{
  "backupId": "backup_20250401120000"
}
```

#### Ответ

```json
{
  "success": true,
  "message": "Данные успешно восстановлены"
}
```

## Обновление

### GET /api/update

Проверка наличия обновлений.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "hasUpdate": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "changes": [
    "Исправлены ошибки",
    "Добавлены новые функции",
    "Улучшена производительность"
  ]
}
```

### POST /api/update

Установка обновления.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "success": true,
  "message": "Обновление успешно установлено",
  "newVersion": "1.1.0"
}
```

### POST /api/update/rollback

Откат обновления.

#### Заголовки

```
Authorization: Bearer jwt-token-here
```

#### Ответ

```json
{
  "success": true,
  "message": "Обновление успешно отменено",
  "version": "1.0.0"
}
```

## Системная информация

### GET /api/health

Проверка состояния приложения.

#### Ответ

```json
{
  "status": "ok",
  "timestamp": "2025-04-01T12:00:00.000Z",
  "version": "1.1.0",
  "env": "production"
}
``` 