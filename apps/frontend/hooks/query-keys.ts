// Query Keys
export const queryKeys = {
  communities: {
    all: ['communities'] as const,
    lists: () => [...queryKeys.communities.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.communities.lists(), { filters }] as const,
    details: () => [...queryKeys.communities.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.communities.details(), id] as const,
  },
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.courses.lists(), { filters }] as const,
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
    list: (filters: Record<string, any>) => [...queryKeys.quizzes.lists(), { filters }] as const,
    details: () => [...queryKeys.quizzes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quizzes.details(), id] as const,
  },
};