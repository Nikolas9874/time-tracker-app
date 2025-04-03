import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

describe('/api/health эндпоинт', () => {
  test('возвращает статус 200 и данные о состоянии', async () => {
    const req = new NextRequest(new Request('https://example.com/api/health'))
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('env')
  })
}) 