import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard - OpenCourse',
  description: 'Manage your communities, courses, and track your learning progress.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardRedirect() {
  redirect('/dashboard/admin');
}