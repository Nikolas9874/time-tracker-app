import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    include: {
      subscriber: true,
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тикеты</h1>
        <Link
          href="/tickets/new"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Новый тикет
        </Link>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Тикет #{ticket.id}</h2>
                <p className="text-sm text-gray-600">
                  Абонент: {ticket.subscriber.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {ticket.messages[0]?.content.substring(0, 100)}
                  {ticket.messages[0]?.content.length > 100 ? '...' : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    ticket.status === 'OPEN'
                      ? 'bg-green-100 text-green-800'
                      : ticket.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : ticket.status === 'RESOLVED'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {ticket.status}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    ticket.priority === 'LOW'
                      ? 'bg-gray-100 text-gray-800'
                      : ticket.priority === 'MEDIUM'
                      ? 'bg-yellow-100 text-yellow-800'
                      : ticket.priority === 'HIGH'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {ticket.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 