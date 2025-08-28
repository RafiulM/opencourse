import {
  ApiResponse,
  PaginatedResponse,
  Community,
  Course,
  CourseModule,
  CourseMaterial,
  Quiz,
  CreateCommunityRequest,
  UpdateCommunityRequest,
  CreateCourseRequest,
  UpdateCourseRequest,
  CreateCourseModuleRequest,
  UpdateCourseModuleRequest,
  CreateCourseMaterialRequest,
  UpdateCourseMaterialRequest,
  CreateQuizRequest,
  UpdateQuizRequest,
} from './types';

interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_API_BASE_URL ?
      (process.env.NEXT_PUBLIC_API_BASE_URL + "/api")
      : 'http://localhost:5000/api';
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Communities CRUD
  async getCommunities(page = 1, limit = 20): Promise<PaginatedResponse<Community>> {
    return this.request<PaginatedResponse<Community>>(`/communities?page=${page}&limit=${limit}`);
  }

  async getCommunity(id: string): Promise<ApiResponse<Community>> {
    return this.request<ApiResponse<Community>>(`/communities/${id}`);
  }

  async createCommunity(data: CreateCommunityRequest): Promise<ApiResponse<Community>> {
    return this.request<ApiResponse<Community>>('/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommunity(data: UpdateCommunityRequest): Promise<ApiResponse<Community>> {
    return this.request<ApiResponse<Community>>(`/communities/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCommunity(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/communities/${id}`, {
      method: 'DELETE',
    });
  }

  // Courses CRUD
  async getCourses(page = 1, limit = 20, communityId?: string): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(communityId && { communityId }),
    });
    return this.request<PaginatedResponse<Course>>(`/courses?${params}`);
  }

  async getCourse(id: string): Promise<ApiResponse<Course>> {
    return this.request<ApiResponse<Course>>(`/courses/${id}`);
  }

  async createCourse(data: CreateCourseRequest): Promise<ApiResponse<Course>> {
    return this.request<ApiResponse<Course>>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(data: UpdateCourseRequest): Promise<ApiResponse<Course>> {
    return this.request<ApiResponse<Course>>(`/courses/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Course Modules CRUD
  async getCourseModules(courseId: string): Promise<ApiResponse<CourseModule[]>> {
    return this.request<ApiResponse<CourseModule[]>>(`/courses/${courseId}/modules`);
  }

  async getCourseModule(id: string): Promise<ApiResponse<CourseModule>> {
    return this.request<ApiResponse<CourseModule>>(`/modules/${id}`);
  }

  async createCourseModule(data: CreateCourseModuleRequest): Promise<ApiResponse<CourseModule>> {
    return this.request<ApiResponse<CourseModule>>('/modules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourseModule(data: UpdateCourseModuleRequest): Promise<ApiResponse<CourseModule>> {
    return this.request<ApiResponse<CourseModule>>(`/modules/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourseModule(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/modules/${id}`, {
      method: 'DELETE',
    });
  }

  // Course Materials CRUD
  async getCourseMaterials(moduleId: string): Promise<ApiResponse<CourseMaterial[]>> {
    return this.request<ApiResponse<CourseMaterial[]>>(`/modules/${moduleId}/materials`);
  }

  async getCourseMaterial(id: string): Promise<ApiResponse<CourseMaterial>> {
    return this.request<ApiResponse<CourseMaterial>>(`/materials/${id}`);
  }

  async createCourseMaterial(data: CreateCourseMaterialRequest): Promise<ApiResponse<CourseMaterial>> {
    return this.request<ApiResponse<CourseMaterial>>('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourseMaterial(data: UpdateCourseMaterialRequest): Promise<ApiResponse<CourseMaterial>> {
    return this.request<ApiResponse<CourseMaterial>>(`/materials/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourseMaterial(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Quizzes CRUD
  async getQuizzes(page = 1, limit = 20, courseId?: string): Promise<PaginatedResponse<Quiz>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(courseId && { courseId }),
    });
    return this.request<PaginatedResponse<Quiz>>(`/quizzes?${params}`);
  }

  async getQuiz(id: string): Promise<ApiResponse<Quiz>> {
    return this.request<ApiResponse<Quiz>>(`/quizzes/${id}`);
  }

  async createQuiz(data: CreateQuizRequest): Promise<ApiResponse<Quiz>> {
    return this.request<ApiResponse<Quiz>>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuiz(data: UpdateQuizRequest): Promise<ApiResponse<Quiz>> {
    return this.request<ApiResponse<Quiz>>(`/quizzes/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();