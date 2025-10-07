import { Metadata } from "next"
import { HomeClient } from "./home-client"

export const metadata: Metadata = {
  title: "OpenCourse - Learn Together, Grow Together",
  description: "Join communities, take courses, and connect with learners worldwide. Discover educational content and collaborative learning experiences.",
  keywords: "online learning, courses, communities, education, collaboration, study groups",
  openGraph: {
    title: "OpenCourse - Learn Together, Grow Together",
    description: "Join communities, take courses, and connect with learners worldwide. Discover educational content and collaborative learning experiences.",
    type: "website",
    url: "https://opencourse.com",
    siteName: "OpenCourse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenCourse - Learn Together, Grow Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenCourse - Learn Together, Grow Together",
    description: "Join communities, take courses, and connect with learners worldwide.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function Home() {
  return <HomeClient />
}
