import { Metadata } from "next"
import { CommunityCoursesPageClient } from "./community-courses-page-client"

interface CommunityCoursesPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CommunityCoursesPageProps): Promise<Metadata> {
  try {
    const encodedSlug = encodeURIComponent(params.slug)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/communities/slug/${encodedSlug}`,
      {
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return {
        title: "Community Courses",
        description: "Browse courses from this community.",
      }
    }

    const communityData = await response.json()
    const community = communityData.data

    return {
      title: `Courses - ${community.name}`,
      description: `Explore courses offered by ${community.name}${
        community.description ? `. ${community.description}` : ""
      }`,
      openGraph: {
        title: `Courses - ${community.name}`,
        description: `Explore courses offered by ${community.name}`,
        type: "website",
        images: community.banner ? [community.banner] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `Courses - ${community.name}`,
        description: `Explore courses offered by ${community.name}`,
        images: community.banner ? [community.banner] : [],
      },
    }
  } catch (error) {
    return {
      title: "Community Courses",
      description: "Browse courses from this community.",
    }
  }
}

export default function CommunityCoursesPage({ params }: CommunityCoursesPageProps) {
  return <CommunityCoursesPageClient communitySlug={params.slug} />
}
