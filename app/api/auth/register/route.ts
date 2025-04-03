// Этот файл удаляется, так как регистрация больше не требуется. 

import { NextRequest, NextResponse } from 'next/server';

// Обработчик для POST-запроса
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Регистрация отключена' },
    { status: 403 }
  );
} 