import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email as string
        const password = credentials.password as string

        const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        if (!user.emailVerified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase()
        if (!email) return false

        const [existing] = await db.select().from(users).where(eq(users.email, email))
        if (!existing) {
          // First-time Google sign-in: create user with 7-day trial
          const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              name: user.name ?? null,
              emailVerified: new Date(),
              plan: "starter",
              trialEndsAt,
            })
            .returning()
          user.id = newUser.id
          // Fire-and-forget: generate initial LinkedIn posts for new Google user
          fetch(`${process.env.NEXTAUTH_URL}/api/internal/generate-initial-posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-internal-secret": process.env.CRON_SECRET ?? "" },
            body: JSON.stringify({ userId: newUser.id }),
          }).catch(() => {})
        } else {
          user.id = existing.id
        }
        return true
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.plan = (user as { plan?: string }).plan ?? "starter"
      }
      // For Google sign-in, fetch plan from DB (user object may lack it)
      if (account?.provider === "google" && token.id) {
        const [dbUser] = await db.select().from(users).where(eq(users.id, token.id as string))
        if (dbUser) {
          token.plan = dbUser.plan
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
      }
      return session
    },
  },
})
