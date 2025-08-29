// API Entity Types

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  banner?: string;
  avatar?: string;
  privacy: 'public' | 'private' | 'invite_only';
  settings?: Record<string, any>;
  memberCount: number;
  isVerified: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
}

export interface Course {
  id: string;
  communityId: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  price: string;
  isPublished: boolean;
  isFeatured: boolean;
  duration?: number;
  difficulty?: string;
  prerequisites: string[];
  learningOutcomes: string[];
  instructorId: string;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseMaterial {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'file' | 'link';
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  order: number;
  duration?: number;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  courseId?: string;
  moduleId?: string;
  title: string;
  description?: string;
  type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank';
  questions: QuizQuestion[];
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, any>;
  score?: number;
  completedAt?: string;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  lastAccessedAt?: string;
  status: 'enrolled' | 'completed' | 'dropped';
}

export interface Upload {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadType: 'community_avatar' | 'community_banner' | 'course_thumbnail' | 'module_thumbnail' | 'material_video' | 'material_file' | 'material_document' | 'user_avatar';
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';
  communityId?: string;
  courseId?: string;
  moduleId?: string;
  materialId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalPoints: number;
  coursesCompleted?: number; // Community leaderboard only
  quizzesPassed: number;
  averageQuizScore: number;
  streak?: number; // Community leaderboard only
  lastActivityAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// API Request Types
export interface CreateCommunityRequest {
  name: string;
  slug: string;
  description?: string;
  privacy?: 'public' | 'private' | 'invite_only';
  settings?: Record<string, any>;
}

export interface UpdateCommunityRequest extends Partial<CreateCommunityRequest> {
  id: string;
}

export interface CreateCourseRequest {
  communityId: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  price?: string;
  duration?: number;
  difficulty?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  id: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface CreateCourseModuleRequest {
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface UpdateCourseModuleRequest extends Partial<CreateCourseModuleRequest> {
  id: string;
}

export interface CreateCourseMaterialRequest {
  moduleId: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'file' | 'link';
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
  order: number;
  duration?: number;
  isPreview?: boolean;
}

export interface UpdateCourseMaterialRequest extends Partial<CreateCourseMaterialRequest> {
  id: string;
}

export interface CreateQuizRequest {
  courseId?: string;
  moduleId?: string;
  title: string;
  description?: string;
  type: 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank';
  questions: Omit<QuizQuestion, 'id'>[];
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
}

export interface UpdateQuizRequest extends Partial<CreateQuizRequest> {
  id: string;
  isPublished?: boolean;
}