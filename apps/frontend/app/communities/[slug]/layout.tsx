import { ReactNode } from "react"
import { notFound, redirect } from "next/navigation"

interface CommunityLayoutProps {
  children: ReactNode
  params: Promise<{
    slug: string
  }>
}

async function fetchCommunityBySlug(slug: string) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBaseUrl) {
    return null
  }

  const encodedSlug = encodeURIComponent(slug)
  const response = await fetch(`${apiBaseUrl}/api/communities/slug/${encodedSlug}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data?.data ?? null
}

async function fetchCommunityById(id: string) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBaseUrl) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/api/communities/${id}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data?.data ?? null
}

export default async function CommunityLayout({ children, params }: CommunityLayoutProps) {
  const { slug } = await params

  const communityFromSlug = await fetchCommunityBySlug(slug)
  if (communityFromSlug) {
    if (communityFromSlug.slug && communityFromSlug.slug !== slug) {
      redirect(`/communities/${communityFromSlug.slug}`)
    }
    return children
  }

  const communityFromId = await fetchCommunityById(slug)
  if (communityFromId?.slug) {
    redirect(`/communities/${communityFromId.slug}`)
  }

  notFound()
}
