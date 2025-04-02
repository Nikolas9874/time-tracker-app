import { Telegraf } from 'telegraf';
import { prisma } from './prisma';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export const initializeTelegramBot = () => {
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const subscriber = await prisma.subscriber.findUnique({
      where: { telegramId },
    });

    if (!subscriber) {
      await ctx.reply('Добро пожаловать! Для начала работы, пожалуйста, зарегистрируйтесь в нашей системе.');
      return;
    }

    await ctx.reply(`Здравствуйте, ${subscriber.name}! Чем могу помочь?`);
  });

  bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const messageText = ctx.message.text;

    const subscriber = await prisma.subscriber.findUnique({
      where: { telegramId },
    });

    if (!subscriber) {
      await ctx.reply('Пожалуйста, зарегистрируйтесь в системе для продолжения работы.');
      return;
    }

    // Создаем новый тикет или находим активный
    let ticket = await prisma.ticket.findFirst({
      where: {
        subscriberId: subscriber.id,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          title: 'Новое сообщение от абонента',
          description: messageText,
          subscriberId: subscriber.id,
          status: 'OPEN',
        },
      });
    }

    // Сохраняем сообщение
    await prisma.message.create({
      data: {
        content: messageText,
        ticketId: ticket.id,
        subscriberId: subscriber.id,
      },
    });

    // Отправляем уведомление операторам
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR' },
    });

    for (const operator of operators) {
      // Здесь можно добавить логику отправки уведомлений операторам
      // Например, через WebSocket или другой канал связи
    }

    await ctx.reply('Ваше сообщение получено. Мы ответим вам в ближайшее время.');
  });

  bot.launch();
  console.log('Telegram bot started');
};

export const sendTelegramMessage = async (telegramId: string, message: string) => {
  try {
    await bot.telegram.sendMessage(telegramId, message);
    return true;
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return false;
  }
}; 