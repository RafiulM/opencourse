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
  Post,
  Comment,
  PostQueryOptions,
  CommentQueryOptions,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommunityPostRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  ReportCommentRequest,
  ModerateCommentRequest,
  CreateReplyRequest,
  PostListResponse,
  CommentListResponse,
  PostLikeResponse,
  PostLikesResponse,
  CommentLikeResponse,
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

  // Social Posts API

  // Global Posts (Admin/Mod use)
  async getPosts(options: PostQueryOptions = {}): Promise<PostListResponse> {
    const params = new URLSearchParams();

    const page = Number.isFinite(options.page)
      ? Math.max(1, Math.floor(Number(options.page)))
      : 1;
    params.set('page', page.toString());

    if (options.pageSize !== undefined) {
      const pageSize = Number.isFinite(options.pageSize)
        ? Math.max(1, Math.floor(Number(options.pageSize)))
        : 10;
      params.set('pageSize', pageSize.toString());
    }

    // Add filter parameters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else if (typeof value === 'boolean') {
            params.set(key, value.toString());
          } else {
            params.set(key, String(value));
          }
        }
      });
    }

    if (options.search) params.set('search', options.search);

    if (options.sort && options.sort.length > 0) {
      const sortStrings = options.sort.map(s => `${s.field}:${s.order}`);
      params.set('sort', sortStrings.join(','));
    }

    return this.request<PostListResponse>(`/posts?${params}`);
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    return this.request<ApiResponse<Post>>(`/posts/${id}`);
  }

  async getPostBySlug(slug: string, communityId?: string): Promise<{ success: boolean; data: Post; message: string }> {
    const params = new URLSearchParams();
    if (communityId) params.set('communityId', communityId);
    const queryString = params.toString();
    const url = `/posts/slug/${slug}${queryString ? `?${queryString}` : ''}`;
    return this.request<{ success: boolean; data: Post; message: string }>(url);
  }

  async updatePost(data: UpdatePostRequest): Promise<ApiResponse<Post>> {
    return this.request<ApiResponse<Post>>(`/posts/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async publishPost(id: string): Promise<ApiResponse<Post>> {
    return this.request<ApiResponse<Post>>(`/posts/${id}/publish`, {
      method: 'POST',
    });
  }

  async togglePinPost(id: string): Promise<ApiResponse<{ isPinned: boolean }>> {
    return this.request<ApiResponse<{ isPinned: boolean }>>(`/posts/${id}/pin`, {
      method: 'POST',
    });
  }

  async toggleFeaturePost(id: string): Promise<ApiResponse<{ isFeatured: boolean }>> {
    return this.request<ApiResponse<{ isFeatured: boolean }>>(`/posts/${id}/feature`, {
      method: 'POST',
    });
  }

  async toggleLikePost(id: string): Promise<PostLikeResponse> {
    return this.request<PostLikeResponse>(`/posts/${id}/like`, {
      method: 'POST',
    });
  }

  async getPostLikes(id: string, page = 1, pageSize = 20): Promise<PostLikesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<PostLikesResponse>(`/posts/${id}/likes?${params}`);
  }

  // Community Posts
  async getCommunityPosts(communityId: string, options: Omit<PostQueryOptions, 'filters'> & { filters?: Omit<PostQueryOptions['filters'], 'communityId'> } = {}): Promise<PostListResponse> {
    const params = new URLSearchParams();

    if (options.page !== undefined) params.set('page', options.page.toString());
    if (options.pageSize !== undefined) params.set('pageSize', options.pageSize.toString());

    // Add filter parameters (excluding communityId)
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else if (typeof value === 'boolean') {
            params.set(key, value.toString());
          } else {
            params.set(key, String(value));
          }
        }
      });
    }

    if (options.search) params.set('search', options.search);

    if (options.sort && options.sort.length > 0) {
      const sortStrings = options.sort.map(s => `${s.field}:${s.order}`);
      params.set('sort', sortStrings.join(','));
    }

    return this.request<PostListResponse>(`/communities/${communityId}/posts?${params}`);
  }

  async createCommunityPost(communityId: string, data: CreatePostRequest): Promise<ApiResponse<Post>> {
    const postData = { ...data, communityId };
    return this.request<ApiResponse<Post>>(`/communities/${communityId}/posts`, {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getFeaturedCommunityPosts(communityId: string, page = 1, pageSize = 10): Promise<PostListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<PostListResponse>(`/communities/${communityId}/posts/featured?${params}`);
  }

  async getPinnedCommunityPosts(communityId: string, page = 1, pageSize = 10): Promise<PostListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<PostListResponse>(`/communities/${communityId}/posts/pinned?${params}`);
  }

  async getCommunityAnnouncements(communityId: string, page = 1, pageSize = 10): Promise<PostListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<PostListResponse>(`/communities/${communityId}/posts/announcements?${params}`);
  }

  // Comments API
  async getComments(postId: string, options: CommentQueryOptions = {}): Promise<CommentListResponse> {
    const params = new URLSearchParams();

    if (options.page !== undefined) params.set('page', options.page.toString());
    if (options.pageSize !== undefined) params.set('pageSize', options.pageSize.toString());
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options.includeReplies !== undefined) params.set('includeReplies', options.includeReplies.toString());

    return this.request<CommentListResponse>(`/posts/${postId}/comments?${params}`);
  }

  async createComment(postId: string, data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(data: UpdateCommentRequest): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>(`/comments/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleLikeComment(id: string): Promise<CommentLikeResponse> {
    return this.request<CommentLikeResponse>(`/comments/${id}/like`, {
      method: 'POST',
    });
  }

  async reportComment(id: string, data: ReportCommentRequest): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/comments/${id}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async moderateComment(id: string, data: ModerateCommentRequest): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>(`/comments/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createReply(commentId: string, data: CreateReplyRequest): Promise<ApiResponse<Comment>> {
    return this.request<ApiResponse<Comment>>(`/comments/${commentId}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
