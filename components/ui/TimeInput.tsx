import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface TimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="mb-1 text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          type="time"
          className={cn(
            'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

TimeInput.displayName = 'TimeInput'

export default TimeInput 