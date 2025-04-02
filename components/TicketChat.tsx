import { useState, useEffect, useRef } from 'react';
import { Ticket, Message, Subscriber } from '@prisma/client';
import { generateAIResponse } from '@/lib/ai';

interface TicketChatProps {
  ticket: Ticket & {
    messages: Message[];
    subscriber: Subscriber;
  };
  onSendMessage: (message: string) => Promise<void>;
}

export const TicketChat = ({ ticket, onSendMessage }: TicketChatProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white shadow-sm p-4">
        <h2 className="text-lg font-semibold">Тикет #{ticket.id}</h2>
        <p className="text-sm text-gray-600">Абонент: {ticket.subscriber.name}</p>
        <div className="mt-2 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            ticket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
            ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
            ticket.status === 'RESOLVED' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {ticket.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            ticket.priority === 'LOW' ? 'bg-gray-100 text-gray-800' :
            ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
            ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {ticket.priority}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isFromAI ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.isFromAI
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </form>
    </div>
  );
}; 