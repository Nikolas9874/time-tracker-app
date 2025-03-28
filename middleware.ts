import { NextRequest, NextResponse } from 'next/server';

// Маршруты, не требующие авторизации
const publicRoutes = ['/login'];

export default function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  
  // Пропускаем API маршруты без проверки
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Пропускаем статические файлы и ресурсы
  if (pathname.startsWith('/_next/') || 
      pathname.includes('.') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // Проверяем, авторизован ли пользователь
  const isAuthenticated = !!authToken;
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Если не авторизован и роут требует авторизации,
  // перенаправляем на страницу входа
  if (!isAuthenticated && !isPublicRoute) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // Если авторизован и пытается зайти на страницу входа,
  // перенаправляем на главную
  if (isAuthenticated && isPublicRoute) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
} 