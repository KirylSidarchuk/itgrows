import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
// Serverless: every function instance builds its own pool, so an unbounded pool (postgres-js
// defaults to max 10) multiplies across instances and exhausts the database connection slots
// ("remaining connection slots are reserved for roles with the SUPERUSER attribute" -> API 500s).
// One connection per instance plus a short idle timeout keeps the total bounded.
const client = postgres(connectionString, {
  prepare: false,
  ssl: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
})
export const db = drizzle(client, { schema })
