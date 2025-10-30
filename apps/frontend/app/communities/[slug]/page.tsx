import { Metadata } from "next"
import { CommunityPageClient } from "./community-page-client"

interface CommunityPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const encodedSlug = encodeURIComponent(slug)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/communities/slug/${encodedSlug}`, {
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
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://opencourse.com'}/communities/${slug}`,
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
  const { slug } = await params
  return <CommunityPageClient communitySlug={slug} />
}
