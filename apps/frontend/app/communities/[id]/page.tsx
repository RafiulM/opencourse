import { Metadata } from "next"
import { CommunityPageClient } from "./community-page-client"

interface CommunityPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    // Fetch community data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/communities/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        title: 'Community',
        description: 'Join this learning community and explore courses.',
      }
    }

    const communityData = await response.json()
    const community = communityData.data

    return {
      title: `${community.name} - OpenCourse Community`,
      description: `Join ${community.name} and discover courses, connect with learners, and grow together.${
        community.description ? ` ${community.description}` : ''
      }`,
      keywords: `${community.name}, community, learning, courses, education${
        community.privacy === 'public' ? ', open community' : ''
      }`,
      openGraph: {
        title: `${community.name} - OpenCourse Community`,
        description: `Join ${community.name} and discover courses, connect with learners.${
          community.description ? ` ${community.description}` : ''
        }`,
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://opencourse.com'}/communities/${id}`,
        siteName: 'OpenCourse',
        images: community.banner ? [community.banner] : community.avatar ? [community.avatar] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${community.name} - OpenCourse Community`,
        description: `Join ${community.name} and discover courses, connect with learners.${
          community.description ? ` ${community.description}` : ''
        }`,
        images: community.banner ? [community.banner] : community.avatar ? [community.avatar] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Community',
      description: 'Join this learning community and explore courses.',
    }
  }
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { id } = await params
  return <CommunityPageClient communityId={id} />
}