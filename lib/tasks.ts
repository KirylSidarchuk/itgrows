"use client"

export type TaskType = "seo_article" | "social_post" | "google_ads" | "image_generation"
export type TaskStatus = "pending" | "in_progress" | "done"

export interface ArticleData {
  keyword: string
  title: string
  content: string
  metaDescription: string
  keywords: string[]
}

export interface Task {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  createdAt: string
  updatedAt: string
  articleData?: ArticleData
}

const STORAGE_KEY = "itgrows_tasks_v2"

export function getTasks(): Task[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function addTask(task: Omit<Task, "id" | "createdAt" | "updatedAt" | "status">): Task {
  const tasks = getTasks()
  const newTask: Task = {
    ...task,
    id: Math.random().toString(36).slice(2),
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  tasks.unshift(newTask)
  saveTasks(tasks)
  return newTask
}

export function deleteTask(id: string): void {
  const tasks = getTasks()
  saveTasks(tasks.filter((t) => t.id !== id))
}

export function updateTaskStatus(id: string, status: TaskStatus): void {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx !== -1) {
    tasks[idx].status = status
    tasks[idx].updatedAt = new Date().toISOString()
    saveTasks(tasks)
  }
}

export function updateTaskArticle(id: string, articleData: ArticleData): void {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx !== -1) {
    tasks[idx].status = "done"
    tasks[idx].articleData = articleData
    tasks[idx].updatedAt = new Date().toISOString()
    saveTasks(tasks)
  }
}
