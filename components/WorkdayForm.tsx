import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const WorkdayForm: React.FC = () => {
  const [workday, setWorkday] = useState<Workday | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formValues, setFormValues] = useState<WorkdayFormValues>({
    employeeId: "",
    date: "",
    dayType: "WORK_DAY",
    timeEntry: {
      startTime: null,
      endTime: null
    },
    tasks: [],
    connections: [],
    comment: ""
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (workday) {
      // Преобразование даты из строки в объект Date для startTime и endTime
      let formattedWorkday = { ...workday };
      
      if (workday.timeEntry) {
        formattedWorkday.timeEntry = {
          ...workday.timeEntry,
          startTime: workday.timeEntry.startTime ? new Date(workday.timeEntry.startTime) : null,
          endTime: workday.timeEntry.endTime ? new Date(workday.timeEntry.endTime) : null
        };
      }
      
      setFormValues(formattedWorkday);
    } else {
      setFormValues({
        employeeId: employee?.id || "",
        date: currentDate,
        dayType: "WORK_DAY",
        timeEntry: {
          startTime: null,
          endTime: null
        },
        tasks: [],
        connections: [],
        comment: ""
      });
    }
  }, [workday, employee, currentDate]);

  // Обработчик изменения типа дня
  const handleDayTypeChange = (type: string) => {
    setFormValues({
      ...formValues,
      dayType: type as DayType,
      timeEntry: type === "WORK_DAY" ? formValues.timeEntry : null
    });
  };

  // Обработчик изменения времени
  const handleTimeChange = (field: "startTime" | "endTime", timeString: string) => {
    if (!timeString) return;
    
    const date = new Date(`${formValues.date}T${timeString}:00`);
    
    setFormValues({
      ...formValues,
      timeEntry: {
        ...formValues.timeEntry!,
        [field]: date
      }
    });
  };

  // Обработчик сохранения формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formValues.dayType === "WORK_DAY" && 
        (!formValues.timeEntry?.startTime || !formValues.timeEntry?.endTime)) {
      toast.error("Для рабочего дня необходимо указать время начала и окончания");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Создаем копию данных для отправки
      const dataToSave = { ...formValues };
      
      // Если есть ID, включаем его (для обновления существующей записи)
      if (workday?.id) {
        dataToSave.id = workday.id;
      }
      
      const success = await onSave(dataToSave);
      
      if (success) {
        toast.success("Данные сохранены");
        onClose();
      } else {
        toast.error("Не удалось сохранить данные");
      }
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      toast.error("Не удалось сохранить данные");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Render your form components here */}
    </div>
  );
};

export default WorkdayForm; 