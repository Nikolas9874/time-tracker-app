'use client';

import React, { useState } from 'react';
import { formatTime } from '@/lib/utils';
import { DayType, WorkDay, TimeEntry } from '@/types/workday';
import Button from '@/components/ui/Button';

interface MobileTimesheetCardProps {
  workDay: WorkDay;
  onSave: (workDay: any) => Promise<boolean>;
  onDelete: (workDayId: string) => Promise<boolean>;
}

// Константы для типов дней
const DAY_TYPE_LABELS: Record<string, string> = {
  'WORK_DAY': 'Рабочий день',
  'DAY_OFF': 'Выходной',
  'VACATION': 'Отпуск',
  'SICK_LEAVE': 'Больничный',
  'ABSENCE': 'Отсутствие',
  'UNPAID_LEAVE': 'Отпуск за свой счет'
};

export default function MobileTimesheetCard({
  workDay,
  onSave,
  onDelete
}: MobileTimesheetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingData, setEditingData] = useState<{
    dayType: DayType;
    timeEntry: TimeEntry | null;
    comment: string;
  }>({
    dayType: workDay.dayType,
    timeEntry: workDay.timeEntry || null,
    comment: workDay.comment || ''
  });

  // Значения по умолчанию для времени
  const defaultStartTime = '09:00';
  const defaultEndTime = '18:00';
  const defaultLunchStartTime = '13:00';
  const defaultLunchEndTime = '14:00';

  // Обработчик изменения типа дня
  const handleDayTypeChange = (dayType: string) => {
    setEditingData(prev => ({
      ...prev,
      dayType: dayType as DayType,
      timeEntry: dayType === 'WORK_DAY' 
        ? {
            startTime: new Date(`${workDay.date}T${defaultStartTime}`),
            endTime: new Date(`${workDay.date}T${defaultEndTime}`),
            lunchStartTime: new Date(`${workDay.date}T${defaultLunchStartTime}`),
            lunchEndTime: new Date(`${workDay.date}T${defaultLunchEndTime}`)
          }
        : null
    }));
  };

  // Обработчик изменения времени
  const handleTimeChange = (field: keyof TimeEntry, timeValue: string) => {
    if (!timeValue) return;
    
    setEditingData(prev => {
      // Создаем новый объект timeEntry, если его нет
      const prevTimeEntry = prev.timeEntry || {
        startTime: new Date(`${workDay.date}T${defaultStartTime}`),
        endTime: new Date(`${workDay.date}T${defaultEndTime}`)
      };
      
      const dateObj = new Date(`${workDay.date}T${timeValue}:00`);
      
      return {
        ...prev,
        timeEntry: {
          ...prevTimeEntry,
          [field]: dateObj
        }
      };
    });
  };

  // Обработчик изменения комментария
  const handleCommentChange = (comment: string) => {
    setEditingData(prev => ({
      ...prev,
      comment
    }));
  };

  // Сохранение данных
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const success = await onSave({
        id: workDay.id,
        employeeId: workDay.employeeId,
        date: workDay.date,
        ...editingData
      });
      
      if (success) {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    setEditingData({
      dayType: workDay.dayType,
      timeEntry: workDay.timeEntry || null,
      comment: workDay.comment || ''
    });
    setIsEditing(false);
  };

  // Переключение режима редактирования
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Обработчик удаления
  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      await onDelete(workDay.id);
    }
  };

  // Форматирование времени для отображения
  const displayTime = (time: Date | null | undefined) => {
    try {
      return time ? formatTime(time) : '--:--'
    } catch (e) {
      console.error('Ошибка отображения времени:', e)
      return '--:--'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-medium">{workDay.employee?.name || 'Сотрудник'}</h3>
          <p className="text-sm text-gray-500">{workDay.employee?.position || ''}</p>
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                onClick={handleCancel}
                disabled={isSaving}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Отмена
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleEdit}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Редактировать
              </button>
              <button 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Удалить
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Тип дня:</div>
        {isEditing ? (
          <select
            value={editingData.dayType}
            onChange={(e) => handleDayTypeChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mb-2"
            disabled={isSaving}
          >
            {Object.entries(DAY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-gray-100 rounded-md px-3 py-2 text-sm">
            {DAY_TYPE_LABELS[workDay.dayType] || workDay.dayType}
          </div>
        )}
      </div>
      
      {(editingData.dayType === 'WORK_DAY' || (!isEditing && workDay.dayType === 'WORK_DAY')) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-sm font-medium mb-1">Начало:</div>
            {isEditing ? (
              <input
                type="time"
                value={editingData.timeEntry ? formatTime(editingData.timeEntry.startTime) : '09:00'}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              />
            ) : (
              <div className="bg-gray-100 rounded-md px-3 py-2 text-sm">
                {displayTime(workDay.timeEntry?.startTime)}
              </div>
            )}
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Конец:</div>
            {isEditing ? (
              <input
                type="time"
                value={editingData.timeEntry ? formatTime(editingData.timeEntry.endTime) : '18:00'}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              />
            ) : (
              <div className="bg-gray-100 rounded-md px-3 py-2 text-sm">
                {displayTime(workDay.timeEntry?.endTime)}
              </div>
            )}
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Обед (начало):</div>
            {isEditing ? (
              <input
                type="time"
                value={editingData.timeEntry && editingData.timeEntry.lunchStartTime ? formatTime(editingData.timeEntry.lunchStartTime) : '13:00'}
                onChange={(e) => handleTimeChange('lunchStartTime', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              />
            ) : (
              <div className="bg-gray-100 rounded-md px-3 py-2 text-sm">
                {displayTime(workDay.timeEntry?.lunchStartTime)}
              </div>
            )}
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Обед (конец):</div>
            {isEditing ? (
              <input
                type="time"
                value={editingData.timeEntry && editingData.timeEntry.lunchEndTime ? formatTime(editingData.timeEntry.lunchEndTime) : '14:00'}
                onChange={(e) => handleTimeChange('lunchEndTime', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isSaving}
              />
            ) : (
              <div className="bg-gray-100 rounded-md px-3 py-2 text-sm">
                {displayTime(workDay.timeEntry?.lunchEndTime)}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div>
        <div className="text-sm font-medium mb-1">Комментарий:</div>
        {isEditing ? (
          <input
            type="text"
            value={editingData.comment || ''}
            onChange={(e) => handleCommentChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Комментарий"
            disabled={isSaving}
          />
        ) : (
          <div className="bg-gray-100 rounded-md px-3 py-2 text-sm min-h-[40px]">
            {workDay.comment || <span className="text-gray-400">Нет комментария</span>}
          </div>
        )}
      </div>
    </div>
  );
} 