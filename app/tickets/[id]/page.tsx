import { prisma } from '@/lib/prisma';
import { TicketChat } from '@/components/TicketChat';
import { generateAIResponse } from '@/lib/ai';
import { notFound } from 'next/navigation';

interface TicketPageProps {
  params: {
    id: string;
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      subscriber: true,
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  async function handleSendMessage(message: string) {
    'use server';
    
    // Сохраняем сообщение от оператора
    await prisma.message.create({
      data: {
        content: message,
        ticketId: ticket.id,
        subscriberId: ticket.subscriberId,
      },
    });

    // Генерируем ответ от ИИ
    const aiResponse = await generateAIResponse(message, ticket.id, ticket.subscriberId);

    // Если есть telegramId у абонента, отправляем сообщение в Telegram
    if (ticket.subscriber.telegramId) {
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: ticket.subscriber.telegramId,
          message: aiResponse,
        }),
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <TicketChat ticket={ticket} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
} 