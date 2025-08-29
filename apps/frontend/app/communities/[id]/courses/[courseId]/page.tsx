'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Star,
  Users,
  CheckCircle,
  PlayCircle,
  FileText,
  Link as LinkIcon,
  Video
} from "lucide-react";
import { useCommunity } from "@/hooks/use-communities";
import { useCourse } from "@/hooks/use-courses";
import { useCourseModules } from "@/hooks/use-modules";
import { useCourseMaterials } from "@/hooks/use-materials";

export default function CommunityCoursePage() {
  const params = useParams();
  const communityId = params.id as string;
  const courseId = params.courseId as string;
  
  const { data: communityData } = useCommunity(communityId);
  const { data: courseData, isLoading: courseLoading } = useCourse(courseId);
  const { data: modulesData } = useCourseModules(courseId);
  
  const community = communityData?.data;
  const course = courseData?.data;
  const modules = modulesData?.data || [];

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-muted-foreground">Course not found</h1>
            <Link href={`/communities/${communityId}`}>
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Community
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/communities/${communityId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to {community?.name || 'Community'}
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">OpenCourse</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <Link href={`/communities/${communityId}`} className="hover:text-primary">
                  {community?.name}
                </Link>
                <span>•</span>
                <span>Course</span>
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight mb-4">{course.title}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration || 0} hours</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="capitalize">{course.difficulty || 'beginner'}</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground">
                {course.description || "No description available for this course."}
              </p>
            </div>

            {/* Course Content */}
            <Tabs defaultValue="modules" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Course Modules</h2>
                  {modules.length > 0 ? (
                    <div className="space-y-4">
                      {modules.map((module, index) => (
                        <ModuleCard 
                          key={module.id} 
                          module={module} 
                          index={index}
                          courseId={courseId}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No modules yet</h3>
                        <p className="text-muted-foreground">
                          This course doesn't have any modules yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-muted-foreground">
                        {course.description || "No detailed description available."}
                      </p>
                    </div>
                    
                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Learning Outcomes</h4>
                        <ul className="space-y-1">
                          {course.learningOutcomes.map((outcome, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Prerequisites</h4>
                        <ul className="space-y-1">
                          {course.prerequisites.map((prereq, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                              <span>•</span>
                              <span>{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{course.duration || 0} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Difficulty:</span>
                          <span className="capitalize">{course.difficulty || 'beginner'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={course.isPublished ? "default" : "secondary"}>
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Featured:</span>
                          <span>{course.isFeatured ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Modules:</span>
                          <span>{modules.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Enrollments:</span>
                          <span>{course.enrollmentCount || 0}</span>
                        </div>
                        {course.price && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-bold text-primary">${course.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Start Learning</CardTitle>
                <CardDescription>
                  {course.isPublished ? "Begin your learning journey" : "Course is in development"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.price && (
                  <div className="text-2xl font-bold text-primary">
                    ${course.price}
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  disabled={!course.isPublished}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {course.isPublished ? "Start Course" : "Coming Soon"}
                </Button>

                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{course.duration || 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modules:</span>
                    <span>{modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="capitalize">{course.difficulty || 'beginner'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Info */}
            {community && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Community</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{community.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {community.description || "Part of this learning community"}
                    </p>
                    <Link href={`/communities/${communityId}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View Community
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ModuleCard({ module, index, courseId }: { module: any; index: number; courseId: string }) {
  const { data: materialsData } = useCourseMaterials(module.id);
  const materials = materialsData?.data || [];
  
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{module.order}</span>
            </div>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{module.title}</CardTitle>
            {module.description && (
              <CardDescription>{module.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      {materials.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Materials ({materials.length})
            </h4>
            <div className="space-y-2">
              {materials.slice(0, 5).map((material: any) => (
                <div key={material.id} className="flex items-center space-x-3 text-sm">
                  <div className="flex-shrink-0 text-muted-foreground">
                    {getContentTypeIcon(material.type)}
                  </div>
                  <span className="flex-1 truncate">{material.title}</span>
                  {material.duration && (
                    <span className="text-xs text-muted-foreground">
                      {material.duration}min
                    </span>
                  )}
                </div>
              ))}
              {materials.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{materials.length - 5} more materials
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}