import { requireAuth } from "@/lib/auth-server"
import PostsPageClient from "./posts-client"

export default async function PostsPage() {
  // Check authentication on the server
  await requireAuth()

  return <PostsPageClient />
}
