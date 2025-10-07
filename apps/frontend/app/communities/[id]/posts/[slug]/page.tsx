import { Metadata } from "next"
import { PostDetailPageClient } from "./post-detail-page-client"

interface PostDetailPageProps {
  params: {
    id: string
    slug: string
  }
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  try {
    // Fetch post data for metadata
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts/slug/${params.slug}?communityId=${params.id}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return {
        title: 'Post Not Found',
        description: 'The requested post could not be found.',
      }
    }

    const postData = await response.json()
    const post = postData.data

    // Create description from excerpt or truncated content
    const description = post.excerpt ||
      post.content?.replace(/[#*`\[\]()]/g, '').slice(0, 160) + '...' ||
      `Read ${post.title} by ${post.author?.name || 'Anonymous'}`

    return {
      title: `${post.title} - ${post.community?.name || 'Community Post'}`,
      description,
      keywords: post.tags?.join(', ') || 'community post, blog, discussion',
      authors: post.author?.name ? [{ name: post.author.name }] : [],
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        publishedTime: post.publishedAt || post.createdAt,
        authors: post.author?.name ? [post.author.name] : [],
        siteName: post.community?.name || 'OpenCourse Community',
        images: post.attachments?.filter(a => a.type === 'image').map(a => ({
          url: a.upload?.url || '',
          width: 1200,
          height: 630,
          alt: post.title,
        })) || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        creator: post.author?.name ? `@${post.author.name.replace(/\s+/g, '')}` : undefined,
        images: post.attachments?.filter(a => a.type === 'image').map(a => a.upload?.url || '') || [],
      },
    }
  } catch (error) {
    return {
      title: 'Community Post',
      description: 'Read this community post and join the discussion.',
    }
  }
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  return <PostDetailPageClient communityId={params.id} slug={params.slug} />
}
