import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, stat } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Файл для хранения истории коммитов
const COMMITS_HISTORY_FILE = path.join(process.cwd(), 'commits-history.json')

// Интерфейс для хранения информации о коммитах
export interface CommitInfo {
  hash: string
  date: string
  message: string
  author: string
}

/**
 * Получает историю коммитов из Git
 * 
 * @param count Количество коммитов
 * @returns Массив объектов с информацией о коммитах
 */
export async function getLastCommits(count = 10): Promise<CommitInfo[]> {
  try {
    // Проверяем существование файла истории
    try {
      await stat(COMMITS_HISTORY_FILE)
    } catch (e) {
      // Если файла нет, создаем пустой файл с историей
      await writeFile(COMMITS_HISTORY_FILE, JSON.stringify([]), 'utf-8')
    }

    // Получаем историю коммитов из Git
    const { stdout } = await execAsync(
      `git log -n ${count} --pretty=format:"%H|%ad|%s|%an" --date=iso`
    )

    // Парсим вывод git log и создаем массив объектов
    const commits = stdout.trim().split('\n').map(line => {
      const [hash, date, message, author] = line.split('|')
      return { hash, date, message, author }
    })

    // Сохраняем историю коммитов в файл
    await writeFile(COMMITS_HISTORY_FILE, JSON.stringify(commits), 'utf-8')

    return commits
  } catch (error) {
    console.error('Ошибка при получении истории коммитов:', error)
    
    // В случае ошибки пытаемся прочитать сохраненную историю
    try {
      const savedHistoryData = await readFile(COMMITS_HISTORY_FILE, 'utf-8')
      return JSON.parse(savedHistoryData)
    } catch (readError) {
      console.error('Ошибка при чтении сохраненной истории:', readError)
      return []
    }
  }
} 