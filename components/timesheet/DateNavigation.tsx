import { formatDateLocale, formatWeekday, getNextDay, getPreviousDay } from '@/lib/utils'
import Button from '../ui/Button'
import DatePicker from '../ui/DatePicker'

interface DateNavigationProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
}

const DateNavigation = ({ currentDate, setCurrentDate }: DateNavigationProps) => {
  const handlePrevDay = () => {
    setCurrentDate(getPreviousDay(currentDate))
  }
  
  const handleNextDay = () => {
    setCurrentDate(getNextDay(currentDate))
  }
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setCurrentDate(date)
    }
  }
  
  const getDayPercentage = () => {
    const day = currentDate.getDay() === 0 ? 7 : currentDate.getDay()
    return `${(day / 7) * 100}%`
  }
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handlePrevDay} 
            variant="outline"
            aria-label="Предыдущий день"
            className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Button>
          
          <DatePicker
            selected={currentDate}
            onChange={handleDateChange}
            className="w-36 text-sm"
          />
          
          <Button 
            onClick={handleNextDay} 
            variant="outline"
            aria-label="Следующий день"
            className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Button>
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">
            {formatDateLocale(currentDate)}
          </div>
          <div className="text-gray-500 text-xs">
            {formatWeekday(currentDate)}
          </div>
        </div>
      </div>
      
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-in-out" 
          style={{ width: getDayPercentage() }}
        ></div>
      </div>
    </div>
  )
}

export default DateNavigation 