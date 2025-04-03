import { Employee } from '@/lib/types'
import Button from '../ui/Button'

interface EmployeeListProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

const EmployeeList = ({ employees, onEdit, onDelete }: EmployeeListProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ФИО
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Должность
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{employee.position}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => onEdit(employee)}
                    variant="outline"
                    size="sm"
                    aria-label={`Редактировать сотрудника ${employee.name}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onEdit(employee)}
                  >
                    Изменить
                  </Button>
                  <Button
                    onClick={() => onDelete(employee)}
                    variant="destructive"
                    size="sm"
                    aria-label={`Удалить сотрудника ${employee.name}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onDelete(employee)}
                  >
                    Удалить
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          
          {employees.length === 0 && (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                Нет добавленных сотрудников
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default EmployeeList
