"use client"

export type TaskType = "seo_article" | "social_post" | "google_ads" | "image_generation"
export type TaskStatus = "pending" | "in_progress" | "done"

export interface Task {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "ge_tasks"

export function getTasks(): Task[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return getSampleTasks()
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

export function updateTaskStatus(id: string, status: TaskStatus): void {
  const tasks = getTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx !== -1) {
    tasks[idx].status = status
    tasks[idx].updatedAt = new Date().toISOString()
    saveTasks(tasks)
  }
}

function getSampleTasks(): Task[] {
  return [
    {
      id: "1",
      title: "SEO Article: 10 Best AI Tools for Marketing",
      description: "Write a 2000-word SEO-optimized article targeting 'AI marketing tools' keyword.",
      type: "seo_article",
      status: "done",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      title: "Instagram Post: Product Launch",
      description: "Create 5 Instagram posts for the new product launch campaign.",
      type: "social_post",
      status: "in_progress",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Google Ads Campaign Setup",
      description: "Configure Google Ads for Q2 campaign targeting SaaS keywords.",
      type: "google_ads",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}
