import { Metadata } from "next"
import { PostDetailPageClient } from "./post-detail-page-client"
import { isMembershipRequiredOriginalError } from "@/lib/membership-access"

interface PostDetailPageProps {
  params: Promise<{
    slug: string
    postSlug: string
  }>
}

export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  try {
    const { slug, postSlug } = await params
    const encodedCommunitySlug = encodeURIComponent(slug)
    const encodedPostSlug = encodeURIComponent(postSlug)

    const communityResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/communities/slug/${encodedCommunitySlug}`,
      { cache: "no-store" }
    )

    if (!communityResponse.ok) {
      return {
        title: "Community Post",
        description: "Read this community post and join the discussion.",
      }
    }

    const communityData = await communityResponse.json()
    const community = communityData.data

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts/slug/${encodedPostSlug}?communityId=${community.id}`,
      { cache: "no-store" }
    )

    if (!response.ok) {
      // Check if it's an authentication error - don't retry, return generic metadata
      if (response.status === 500) {
        try {
          const errorText = await response.text()
          const errorData = JSON.parse(errorText)
          const originalError = errorData?.error?.details?.originalError
          if (isMembershipRequiredOriginalError(originalError)) {
            // Return generic metadata - the client component will handle redirect
            return {
              title: `${community.name} - Community Post`,
              description: `Join ${community.name} to view this post.`,
            }
          }
        } catch {
          // Not JSON or parse error, fall through to generic error
        }
      }

      return {
        title: "Post Not Found",
        description: "The requested post could not be found.",
      }
    }

    const postData = await response.json()
    const post = postData.data

    // Create description from excerpt or truncated content
    const description =
      post.excerpt ||
      post.content?.replace(/[#*`\[\]()]/g, "").slice(0, 160) + "..." ||
      `Read ${post.title} by ${post.author?.name || "Anonymous"}`

    return {
      title: `${post.title} - ${post.community?.name || "Community Post"}`,
      description,
      keywords: post.tags?.join(", ") || "community post, blog, discussion",
      authors: post.author?.name ? [{ name: post.author.name }] : [],
      openGraph: {
        title: post.title,
        description,
        type: "article",
        publishedTime: post.publishedAt || post.createdAt,
        authors: post.author?.name ? [post.author.name] : [],
        siteName: post.community?.name || "OpenCourse Community",
        images:
          post.attachments
            ?.filter((a) => a.type === "image")
            .map((a) => ({
              url: a.upload?.url || "",
              width: 1200,
              height: 630,
              alt: post.title,
            })) || [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        creator: post.author?.name
          ? `@${post.author.name.replace(/\s+/g, "")}`
          : undefined,
        images:
          post.attachments
            ?.filter((a) => a.type === "image")
            .map((a) => a.upload?.url || "") || [],
      },
    }
  } catch (error) {
    return {
      title: "Community Post",
      description: "Read this community post and join the discussion.",
    }
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug, postSlug } = await params
  return <PostDetailPageClient communitySlug={slug} postSlug={postSlug} />
}
