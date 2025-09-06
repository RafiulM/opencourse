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
  Enrollment,
  Upload,
  LeaderboardEntry,
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
  async getCommunities(
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<Community>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<Community>>(`/communities?${params}`);
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
  async getCourses(
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
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
  async getCourseModules(
    courseId: string,
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<CourseModule>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<CourseModule>>(`/courses/${courseId}/modules?${params}`);
  }

  async getCourseModule(id: string): Promise<ApiResponse<CourseModule>> {
    return this.request<ApiResponse<CourseModule>>(`/courses/modules/${id}`);
  }

  async createCourseModule(data: CreateCourseModuleRequest): Promise<ApiResponse<CourseModule>> {
    return this.request<ApiResponse<CourseModule>>(`/courses/${data.courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourseModule(data: UpdateCourseModuleRequest): Promise<ApiResponse<CourseModule>> {
    return this.request<ApiResponse<CourseModule>>(`/courses/modules/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourseModule(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/courses/modules/${id}`, {
      method: 'DELETE',
    });
  }

  // Enrollments CRUD
  async getEnrollments(
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<Enrollment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<Enrollment>>(`/enrollments?${params}`);
  }

  async getEnrollment(id: string): Promise<ApiResponse<Enrollment>> {
    return this.request<ApiResponse<Enrollment>>(`/enrollments/${id}`);
  }

  async createEnrollment(data: any): Promise<ApiResponse<Enrollment>> {
    return this.request<ApiResponse<Enrollment>>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEnrollment(data: any): Promise<ApiResponse<Enrollment>> {
    return this.request<ApiResponse<Enrollment>>(`/enrollments/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEnrollment(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/enrollments/${id}`, {
      method: 'DELETE',
    });
  }

  // Quizzes CRUD
  async getQuizzes(
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<Quiz>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
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

  // Course Materials CRUD
  async getCourseMaterials(
    moduleId: string,
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<CourseMaterial>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<CourseMaterial>>(`/courses/modules/${moduleId}/materials?${params}`);
  }

  async getCourseMaterial(id: string): Promise<ApiResponse<CourseMaterial>> {
    return this.request<ApiResponse<CourseMaterial>>(`/courses/materials/${id}`);
  }

  async createCourseMaterial(data: CreateCourseMaterialRequest): Promise<ApiResponse<CourseMaterial>> {
    return this.request<ApiResponse<CourseMaterial>>(`/courses/modules/${data.moduleId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourseMaterial(data: UpdateCourseMaterialRequest): Promise<ApiResponse<CourseMaterial>> {
    return this.request<ApiResponse<CourseMaterial>>(`/courses/materials/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourseMaterial(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/courses/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Uploads CRUD
  async getUploads(
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<Upload>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<Upload>>(`/uploads?${params}`);
  }

  async getUpload(id: string): Promise<ApiResponse<Upload>> {
    return this.request<ApiResponse<Upload>>(`/uploads/${id}`);
  }

  async createUpload(data: any): Promise<ApiResponse<Upload>> {
    return this.request<ApiResponse<Upload>>('/uploads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUpload(data: any): Promise<ApiResponse<Upload>> {
    return this.request<ApiResponse<Upload>>(`/uploads/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUpload(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/uploads/${id}`, {
      method: 'DELETE',
    });
  }

  // Leaderboard CRUD
  async getCommunityLeaderboard(
    communityId: string,
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<LeaderboardEntry>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<LeaderboardEntry>>(`/scoreboard/communities/${communityId}/leaderboard?${params}`);
  }

  async getCourseLeaderboard(
    courseId: string,
    page = 1, 
    limit = 20, 
    filters: Record<string, any> = {},
    sort: string[] = []
  ): Promise<PaginatedResponse<LeaderboardEntry>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // Handle objects by converting to JSON string
          params.set(key, JSON.stringify(value));
        } else {
          // Convert primitive values to string
          params.set(key, String(value));
        }
      }
    });
    
    if (sort.length > 0) {
      params.set('sort', sort.join(','));
    }
    
    return this.request<PaginatedResponse<LeaderboardEntry>>(`/scoreboard/courses/${courseId}/leaderboard?${params}`);
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();