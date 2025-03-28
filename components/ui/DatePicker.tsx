import { cn } from '@/lib/utils'
import { formatDateISO } from '@/lib/utils'
import { useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ru } from 'date-fns/locale'

interface DatePickerProps {
  selected: Date
  onChange: (date: Date | null) => void
  className?: string
  placeholderText?: string
  dateFormat?: string
  showTimeSelect?: boolean
  timeFormat?: string
  timeIntervals?: number
}

const DatePicker = ({
  selected,
  onChange,
  className,
  placeholderText = 'Выберите дату',
  dateFormat = 'dd.MM.yyyy',
  showTimeSelect = false,
  timeFormat = 'HH:mm',
  timeIntervals = 15,
}: DatePickerProps) => {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
      locale={ru}
      dateFormat={showTimeSelect ? `${dateFormat} ${timeFormat}` : dateFormat}
      placeholderText={placeholderText}
      showTimeSelect={showTimeSelect}
      timeFormat={timeFormat}
      timeIntervals={timeIntervals}
    />
  )
}

export default DatePicker 