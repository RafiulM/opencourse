// Query Keys
export const queryKeys = {
  communities: {
    all: ['communities'] as const,
    lists: () => [...queryKeys.communities.all, 'list'] as const,
    list: (params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) => 
      [...queryKeys.communities.lists(), params] as const,
    details: () => [...queryKeys.communities.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.communities.details(), id] as const,
  },
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) => 
      [...queryKeys.courses.lists(), params] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
  },
  modules: {
    all: ['modules'] as const,
    lists: () => [...queryKeys.modules.all, 'list'] as const,
    list: (courseId: string) => [...queryKeys.modules.lists(), { courseId }] as const,
    details: () => [...queryKeys.modules.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.modules.details(), id] as const,
  },
  materials: {
    all: ['materials'] as const,
    lists: () => [...queryKeys.materials.all, 'list'] as const,
    list: (moduleId: string) => [...queryKeys.materials.lists(), { moduleId }] as const,
    details: () => [...queryKeys.materials.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.materials.details(), id] as const,
  },
  quizzes: {
    all: ['quizzes'] as const,
    lists: () => [...queryKeys.quizzes.all, 'list'] as const,
    list: (params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) => 
      [...queryKeys.quizzes.lists(), params] as const,
    details: () => [...queryKeys.quizzes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quizzes.details(), id] as const,
  },
  enrollments: {
    all: ['enrollments'] as const,
    lists: () => [...queryKeys.enrollments.all, 'list'] as const,
    list: (params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) => 
      [...queryKeys.enrollments.lists(), params] as const,
    details: () => [...queryKeys.enrollments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.enrollments.details(), id] as const,
  },
  uploads: {
    all: ['uploads'] as const,
    lists: () => [...queryKeys.uploads.all, 'list'] as const,
    list: (params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) => 
      [...queryKeys.uploads.lists(), params] as const,
    details: () => [...queryKeys.uploads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.uploads.details(), id] as const,
  },
  leaderboards: {
    all: ['leaderboards'] as const,
    communityLists: () => [...queryKeys.leaderboards.all, 'community'] as const,
    communityList: (communityId: string, params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) =>
      [...queryKeys.leaderboards.communityLists(), communityId, params] as const,
    courseLists: () => [...queryKeys.leaderboards.all, 'course'] as const,
    courseList: (courseId: string, params: { page?: number; limit?: number; filters?: Record<string, any>; sort?: string[] }) =>
      [...queryKeys.leaderboards.courseLists(), courseId, params] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (params: { page?: number; pageSize?: number; filters?: any; search?: string; sort?: any }) =>
      [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    communityLists: () => [...queryKeys.posts.all, 'community'] as const,
    communityList: (communityId: string, params: { page?: number; pageSize?: number; filters?: any; search?: string; sort?: any }) =>
      [...queryKeys.posts.communityLists(), communityId, params] as const,
    featured: (communityId: string, params: { page?: number; pageSize?: number }) =>
      [...queryKeys.posts.communityLists(), communityId, 'featured', params] as const,
    pinned: (communityId: string, params: { page?: number; pageSize?: number }) =>
      [...queryKeys.posts.communityLists(), communityId, 'pinned', params] as const,
    announcements: (communityId: string, params: { page?: number; pageSize?: number }) =>
      [...queryKeys.posts.communityLists(), communityId, 'announcements', params] as const,
    likes: (id: string, params: { page?: number; pageSize?: number }) =>
      [...queryKeys.posts.details(), id, 'likes', params] as const,
  },
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (postId: string, params: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string; includeReplies?: boolean }) =>
      [...queryKeys.comments.lists(), postId, params] as const,
    details: () => [...queryKeys.comments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.comments.details(), id] as const,
  },
};