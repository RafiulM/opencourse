'use client';

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Clock, 
  Star,
  ChevronRight,
  FileText,
  Video,
  Link as LinkIcon
} from "lucide-react";
import { useCommunity } from "@/hooks/use-communities";
import { useCourses } from "@/hooks/use-courses";
import { useCourseModules } from "@/hooks/use-modules";
import { Navbar } from "@/components/navbar";

export default function CommunityPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  const { data: communityData, isLoading: communityLoading } = useCommunity(communityId);
  const { data: coursesData, isLoading: coursesLoading } = useCourses(1, 100, communityId);
  
  const community = communityData?.data;
  const courses = coursesData?.data || [];

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-muted-foreground">Community not found</h1>
            <Link href="/">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Community Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-shrink-0">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                {community.description || "Welcome to this learning community"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{courses.length} courses</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Community</span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="modules">All Modules</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Courses in this Community</h2>
            </div>

            {coursesLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {course.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration || 0}h</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span className="capitalize">{course.difficulty || 'beginner'}</span>
                          </div>
                        </div>
                        
                        {course.price && (
                          <div className="text-lg font-bold text-primary">
                            ${course.price}
                          </div>
                        )}

                        <Link href={`/communities/${communityId}/courses/${course.id}`}>
                          <Button className="w-full">
                            View Course
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                  <p className="text-muted-foreground">
                    This community doesn't have any courses yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <ModulesSection courses={courses} />
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {community.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {community.description || "This community is focused on providing quality educational content and fostering a collaborative learning environment."}
                  </p>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Community Stats</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Total Courses:</span>
                          <span>{courses.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Published Courses:</span>
                          <span>{courses.filter(c => c.isPublished).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ModulesSection({ courses }: { courses: any[] }) {
  const [allModules, setAllModules] = useState<any[]>([]);
  
  // This is a simplified approach - in a real app you'd want to batch these requests
  // For now, we'll show modules for the first few courses
  const firstFewCourses = courses.slice(0, 3);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Modules Across Courses</h2>
      </div>

      {firstFewCourses.length > 0 ? (
        <div className="space-y-6">
          {firstFewCourses.map((course) => (
            <CourseModulesSection key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No modules available</h3>
            <p className="text-muted-foreground">
              Modules will appear here once courses are created with content.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CourseModulesSection({ course }: { course: any }) {
  const { data: modulesData } = useCourseModules(course.id);
  const modules = modulesData?.data || [];

  if (modules.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>{course.title}</span>
        </CardTitle>
        <CardDescription>
          {modules.length} modules in this course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {modules.map((module: any) => (
            <div key={module.id} className="flex items-center space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{module.order}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{module.title}</h4>
                {module.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}