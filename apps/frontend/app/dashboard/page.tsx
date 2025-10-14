import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Dashboard - OpenCourse',
  description: 'Manage your communities, courses, and track your learning progress.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardRedirect() {
  // Check authentication before redirecting
  await requireAuth();
  redirect('/dashboard/admin');
}