import { useQueries } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useCourses } from './use-courses';

// This hook fetches content statistics by getting all courses and then
// fetching modules and materials for each course
export function useContentStats() {
  const { data: coursesData } = useCourses(1, 100); // Get all courses
  
  // Get all modules and materials for all courses
  const contentQueries = useQueries({
    queries: coursesData?.data?.map(course => ({
      queryKey: ['content-stats', course.id],
      queryFn: async () => {
        try {
          // Get modules for this course
          const modulesResponse = await apiClient.getCourseModules(course.id);
          const modules = modulesResponse.data || [];
          
          // Get materials for each module
          const materialsPromises = modules.map(module => 
            apiClient.getCourseMaterials(module.id)
          );
          
          const materialsResponses = await Promise.all(materialsPromises);
          const totalMaterials = materialsResponses.reduce(
            (sum, response) => sum + (response.data?.length || 0), 
            0
          );
          
          return {
            courseId: course.id,
            moduleCount: modules.length,
            materialCount: totalMaterials
          };
        } catch (error) {
          console.error(`Error fetching content for course ${course.id}:`, error);
          return {
            courseId: course.id,
            moduleCount: 0,
            materialCount: 0
          };
        }
      },
      enabled: !!coursesData?.data?.length,
    })) || []
  });

  // Calculate totals
  const totalModules = contentQueries.reduce(
    (sum, query) => sum + (query.data?.moduleCount || 0), 
    0
  );
  
  const totalMaterials = contentQueries.reduce(
    (sum, query) => sum + (query.data?.materialCount || 0), 
    0
  );

  const isLoading = contentQueries.some(query => query.isLoading);
  const isError = contentQueries.some(query => query.isError);

  return {
    totalModules,
    totalMaterials,
    totalContentItems: totalModules + totalMaterials,
    isLoading,
    isError
  };
}