import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import LinkedIn from "next-auth/providers/linkedin"
import type { Provider } from "next-auth/providers"
import { db } from "@/lib/db"
import { users, emailPins } from "@/lib/db/schema"
import { eq, and, gt, desc } from "drizzle-orm"
import bcrypt from "bcryptjs"

function notifyOwnerNewUser(email: string, via: string) {
  // Best-effort Telegram ping about a new signup; never blocks auth.
  fetch(
    `https://api.telegram.org/bot8213146538:AAH9ceXiIQ62-ICZJlUFx0psyd2nYq1gN7g/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: 372194458,
        text: `\u{1F195} New user (${via}): ${email}`,
      }),
    }
  ).catch(() => {})
}

// OAuth providers are added only when their credentials exist, so a deploy that
// ships before the env vars are set can't crash — the buttons simply go live
// once GOOGLE_* / LINKEDIN_PERSONAL_* are present.
const oauthProviders: Provider[] = []
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  )
}
{
  // Reuse the existing personal LinkedIn app creds (already in env for publishing).
  const liId = process.env.AUTH_LINKEDIN_ID ?? process.env.LINKEDIN_PERSONAL_CLIENT_ID
  const liSecret = process.env.AUTH_LINKEDIN_SECRET ?? process.env.LINKEDIN_PERSONAL_CLIENT_SECRET
  if (liId && liSecret) {
    oauthProviders.push(
      LinkedIn({
        clientId: liId,
        clientSecret: liSecret,
        allowDangerousEmailAccountLinking: true,
        authorization: { params: { scope: "openid profile email" } },
      })
    )
  }
}

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

        const MAX_PIN_ATTEMPTS = 5

        // Fetch the latest valid, unused PIN for this email (by email, NOT by pin — so we can
        // count wrong guesses and lock out brute-force of the 6-digit space).
        const [pinRecord] = await db
          .select()
          .from(emailPins)
          .where(
            and(
              eq(emailPins.email, email),
              eq(emailPins.used, false),
              gt(emailPins.expiresAt, new Date())
            )
          )
          .orderBy(desc(emailPins.createdAt))
          .limit(1)

        if (!pinRecord) return null

        // Too many wrong guesses on this PIN → burn it. The attacker must then request a new
        // PIN, which send-pin rate-limits (60s), making brute-force infeasible.
        if ((pinRecord.attempts ?? 0) >= MAX_PIN_ATTEMPTS) {
          await db.update(emailPins).set({ used: true }).where(eq(emailPins.id, pinRecord.id))
          return null
        }

        if (pinRecord.pin !== pin) {
          await db
            .update(emailPins)
            .set({ attempts: (pinRecord.attempts ?? 0) + 1 })
            .where(eq(emailPins.id, pinRecord.id))
          return null
        }

        // Correct PIN — mark used
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

          notifyOwnerNewUser(email, "PIN auth")
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
    ...oauthProviders,
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // OAuth (Google / LinkedIn) first sign-in: upsert our own user row keyed by
      // email so the rest of the app (which reads users.id / plan) works unchanged.
      // Runs only on the sign-in request (account is present only then).
      if (account && (account.provider === "google" || account.provider === "linkedin")) {
        const email = (
          (profile?.email as string | undefined) ??
          user?.email ??
          ""
        ).toLowerCase().trim()
        if (email) {
          let [dbUser] = await db.select().from(users).where(eq(users.email, email))
          if (!dbUser) {
            ;[dbUser] = await db
              .insert(users)
              .values({
                email,
                name: (profile?.name as string | undefined) ?? user?.name ?? email.split("@")[0],
                emailVerified: new Date(),
                plan: "starter",
              })
              .returning()
            notifyOwnerNewUser(email, `${account.provider} sign-in`)
          } else if (!dbUser.emailVerified) {
            await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, dbUser.id))
          }
          token.id = dbUser.id
          token.plan = dbUser.plan
        }
      } else if (user) {
        token.id = user.id
        token.plan = (user as { plan?: string }).plan ?? "starter"
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
