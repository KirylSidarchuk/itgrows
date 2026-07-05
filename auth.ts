import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { users, emailPins } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Legacy password-based login (kept for backward compat)
    Credentials({
      id: "credentials",
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
    // PIN-based login / signup
    Credentials({
      id: "pin",
      credentials: {
        email: { label: "Email", type: "email" },
        pin: { label: "PIN", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.pin) return null
        const email = (credentials.email as string).toLowerCase().trim()
        const pin = credentials.pin as string

        // Verify PIN
        const [pinRecord] = await db
          .select()
          .from(emailPins)
          .where(
            and(
              eq(emailPins.email, email),
              eq(emailPins.pin, pin),
              eq(emailPins.used, false),
              gt(emailPins.expiresAt, new Date())
            )
          )
          .limit(1)

        if (!pinRecord) return null

        // Mark PIN as used
        await db
          .update(emailPins)
          .set({ used: true })
          .where(eq(emailPins.id, pinRecord.id))

        // Find or create user
        let [user] = await db.select().from(users).where(eq(users.email, email))

        if (!user) {
          ;[user] = await db
            .insert(users)
            .values({
              email,
              name: pinRecord.name ?? email.split("@")[0],
              emailVerified: new Date(),
              plan: "starter",
            })
            .returning()

          // Notify owner about new user
          fetch(
            `https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: 372194458,
                text: `\u{1F195} New user (PIN auth): ${email}`,
              }),
            }
          ).catch(() => {})
        } else if (!user.emailVerified) {
          await db
            .update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.id, user.id))
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        }
      },
    }),
    // Google one-tap sign-in — only enabled when credentials are configured (no-op otherwise).
    ...(process.env.AUTH_GOOGLE_ID
      ? [Google({ allowDangerousEmailAccountLinking: true })]
      : []),
  ],
  callbacks: {
    // For Google sign-in: ensure a matching row exists in our users table (JWT strategy, no adapter).
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase()
        const [existing] = await db.select().from(users).where(eq(users.email, email))
        if (!existing) {
          await db.insert(users).values({
            email,
            name: user.name ?? email.split("@")[0],
            emailVerified: new Date(),
            plan: "starter",
          })
          fetch(
            `https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: 372194458, text: `\u{1F195} New user (Google auth): ${email}` }),
            }
          ).catch(() => {})
        } else if (!existing.emailVerified) {
          await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, existing.id))
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Google users carry the OAuth profile id, not our DB id — map by email.
        if (account?.provider === "google" && user.email) {
          const [dbUser] = await db.select().from(users).where(eq(users.email, user.email.toLowerCase()))
          if (dbUser) {
            token.id = dbUser.id
            token.plan = dbUser.plan ?? "starter"
          }
        } else {
          token.id = user.id
          token.plan = (user as { plan?: string }).plan ?? "starter"
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
