import { Metadata } from "next"
import { CommunityPostsPageClient } from "./community-posts-page-client"

interface CommunityPostsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: CommunityPostsPageProps): Promise<Metadata> {
  try {
    // Fetch community data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/communities/${params.id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        title: 'Community Posts',
        description: 'Browse posts from this community',
      }
    }

    const communityData = await response.json()
    const community = communityData.data

    return {
      title: `Posts - ${community.name}`,
      description: `Browse and read posts from ${community.name}${
        community.description ? `. ${community.description}` : ''
      }`,
      openGraph: {
        title: `Posts - ${community.name}`,
        description: `Browse and read posts from ${community.name}`,
        type: 'website',
        images: community.banner ? [community.banner] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Posts - ${community.name}`,
        description: `Browse and read posts from ${community.name}`,
        images: community.banner ? [community.banner] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Community Posts',
      description: 'Browse posts from this community',
    }
  }
}

export default function CommunityPostsPage({ params }: CommunityPostsPageProps) {
  return <CommunityPostsPageClient communityId={params.id} />
}