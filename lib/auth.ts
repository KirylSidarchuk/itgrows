"use client"

export interface User {
  id: string
  email: string
  name: string
  plan: "starter" | "pro" | "agency"
  planExpiry: string
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("ge_user")
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  localStorage.setItem("ge_user", JSON.stringify(user))
}

export function logout(): void {
  localStorage.removeItem("ge_user")
}

export function login(email: string, password: string): User | null {
  // Simple mock auth
  if (email && password.length >= 6) {
    const user: User = {
      id: Math.random().toString(36).slice(2),
      email,
      name: email.split("@")[0],
      plan: "starter",
      planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    setUser(user)
    return user
  }
  return null
}
