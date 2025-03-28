'use client';

import React from 'react';
import { WorkDay, DayType, DAY_TYPE_LABELS } from '@/lib/types';
import Select from '../ui/Select';
import TimeInput from '../ui/TimeInput';
import Button from '../ui/Button';

interface MobileTimesheetCardProps {
  workDay: WorkDay;
  employeeData: {
    dayType: DayType;
    startTime: string;
    endTime: string;
    lunchStartTime: string;
    lunchEndTime: string;
    tasksCompleted: string;
    connectionsEstablished: string;
    comment: string;
  };
  index: number;
  isSaving: boolean;
  netDuration: string;
  totalWorkTime: string;
  onDayTypeChange: (employeeId: string, dayType: DayType) => void;
  onChange: (employeeId: string, field: string, value: string) => void;
  onSave: (workDay: WorkDay) => void;
}

const MobileTimesheetCard: React.FC<MobileTimesheetCardProps> = ({
  workDay,
  employeeData,
  index,
  isSaving,
  netDuration,
  totalWorkTime,
  onDayTypeChange,
  onChange,
  onSave
}) => {
  // Преобразуем типы дня в опции для селекта
  const dayTypeOptions = Object.entries(DAY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  if (!workDay || !workDay.employeeId) {
    return null;
  }

  return (
    <div className="card bg-white shadow-sm mb-3 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 font-medium mr-2">
            {index + 1}
          </span>
          <div>
            <div className="font-medium text-gray-900">{workDay.employee?.name || 'Сотрудник'}</div>
            <div className="text-xs text-gray-500">{workDay.employee?.position || 'Должность'}</div>
          </div>
        </div>
      </div>
      
      <div className="px-3 py-3 space-y-3">
        {/* Тип дня */}
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="text-xs font-medium text-gray-700">Тип дня:</div>
          <div className="col-span-2">
            <Select
              options={dayTypeOptions}
              value={employeeData.dayType}
              onChange={(e) => onDayTypeChange(workDay.employeeId, e.target.value as DayType)}
              className="text-xs h-8 w-full"
              disabled={isSaving}
            />
          </div>
        </div>
        
        {/* Времена (показываем только для рабочего дня) */}
        {employeeData.dayType === 'WORK_DAY' && (
          <>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Начало работы:</div>
              <div className="col-span-2">
                <TimeInput
                  value={employeeData.startTime}
                  onChange={(e) => onChange(workDay.employeeId, 'startTime', e.target.value)}
                  className="h-8 text-xs w-full"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Конец работы:</div>
              <div className="col-span-2">
                <TimeInput
                  value={employeeData.endTime}
                  onChange={(e) => onChange(workDay.employeeId, 'endTime', e.target.value)}
                  className="h-8 text-xs w-full"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Начало обеда:</div>
              <div className="col-span-2">
                <TimeInput
                  value={employeeData.lunchStartTime}
                  onChange={(e) => onChange(workDay.employeeId, 'lunchStartTime', e.target.value)}
                  className="h-8 text-xs w-full"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Конец обеда:</div>
              <div className="col-span-2">
                <TimeInput
                  value={employeeData.lunchEndTime}
                  onChange={(e) => onChange(workDay.employeeId, 'lunchEndTime', e.target.value)}
                  className="h-8 text-xs w-full"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Рабочее время:</div>
              <div className="col-span-2 flex space-x-2">
                <div className="bg-gray-50 rounded px-3 py-1 text-xs flex-1 text-center">
                  <div className="text-gray-500 mb-1">Всего</div>
                  <div className="font-medium">{totalWorkTime}</div>
                </div>
                <div className="bg-gray-50 rounded px-3 py-1 text-xs flex-1 text-center">
                  <div className="text-gray-500 mb-1">Чистое</div>
                  <div className="font-medium text-indigo-600">{netDuration}</div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Показатели и комментарий */}
        {employeeData.dayType === 'WORK_DAY' && (
          <>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Выполнено задач:</div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  value={employeeData.tasksCompleted}
                  onChange={(e) => onChange(workDay.employeeId, 'tasksCompleted', e.target.value)}
                  className="w-full h-8 text-xs rounded border-gray-300"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">Подключений:</div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  value={employeeData.connectionsEstablished}
                  onChange={(e) => onChange(workDay.employeeId, 'connectionsEstablished', e.target.value)}
                  className="w-full h-8 text-xs rounded border-gray-300"
                  disabled={isSaving}
                />
              </div>
            </div>
          </>
        )}
        
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">Комментарий:</div>
          <input
            type="text"
            placeholder="Комментарий..."
            value={employeeData.comment}
            onChange={(e) => onChange(workDay.employeeId, 'comment', e.target.value)}
            className="w-full h-8 text-xs rounded border-gray-300"
            disabled={isSaving}
          />
        </div>
      </div>
      
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
        <Button 
          onClick={() => onSave(workDay)}
          disabled={isSaving}
          className="h-8 text-xs"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
};

export default MobileTimesheetCard; 