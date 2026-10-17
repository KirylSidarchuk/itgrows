import { db } from "@/lib/db"
import { images, linkedinPosts, instagramPosts } from "@/lib/db/schema"
import { eq, inArray, or, type SQL } from "drizzle-orm"

// An image belongs to an account when the account uploaded it or one of the
// account's own posts uses it. Generated images are stored before anything knows
// which post will take them, so for those the post is what proves ownership.
// There is deliberately no "unowned, so everyone may see it" case.
export function imagesOwnedBy(userId: string): SQL {
  return or(
    eq(images.userId, userId),
    inArray(
      images.url,
      db.select({ url: linkedinPosts.imageUrl }).from(linkedinPosts).where(eq(linkedinPosts.userId, userId))
    ),
    inArray(
      images.url,
      db.select({ url: instagramPosts.imageUrl }).from(instagramPosts).where(eq(instagramPosts.userId, userId))
    )
  ) as SQL
}
