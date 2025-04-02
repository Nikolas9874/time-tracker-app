import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Вы - помощник службы поддержки интернет-провайдера. 
Ваша задача - помогать абонентам с их вопросами и проблемами.
Будьте вежливы, профессиональны и полезны.
Если вы не можете решить проблему самостоятельно, предложите обратиться к оператору.`;

export const generateAIResponse = async (
  message: string,
  ticketId: string,
  subscriberId: string
) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    // Сохраняем ответ ИИ в базу данных
    await prisma.message.create({
      data: {
        content: aiResponse || 'Извините, произошла ошибка при генерации ответа.',
        ticketId,
        subscriberId,
        isFromAI: true,
      },
    });

    return aiResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Извините, произошла ошибка при обработке вашего запроса.';
  }
};

export const analyzeTicket = async (ticketId: string) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: true,
        subscriber: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const messages = ticket.messages
      .map(m => `${m.isFromAI ? 'AI' : 'User'}: ${m.content}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Проанализируйте тикет и определите:
1. Основную проблему
2. Приоритет (LOW, MEDIUM, HIGH, URGENT)
3. Рекомендации по решению
4. Необходимость вмешательства оператора`
        },
        {
          role: "user",
          content: `Тикет #${ticket.id}\nАбонент: ${ticket.subscriber.name}\n\nИстория сообщений:\n${messages}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    return null;
  }
}; 