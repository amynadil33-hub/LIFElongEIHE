import { useParams, Link, useNavigate } from "react-router-dom";
import { api, Authenticated, Unauthenticated, useSupabaseMutation as useMutation, useSupabaseQueryResult as useQuery } from "@/lib/supabase-api";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  ErrorState,
  ErrorStateDescription,
  ErrorStateHeader,
  ErrorStateMedia,
  ErrorStateTitle,
} from "@/components/ui/error-state.tsx";
import { Star, Users, Clock, BookOpen, CheckCircle2, ArrowRight, GraduationCap, Globe, Database } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useState } from "react";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Supabase did not return course data.";
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const courseQuery = useQuery(api.courses.getBySlug, { slug: slug ?? "" });
  const course = courseQuery.data;
  const daysQuery = useQuery(api.courses.getCourseDays, course ? { courseId: course._id } : "skip");
  const days = daysQuery.data ?? [];
  const enrollmentQuery = useQuery(api.enrollments.getEnrollment, course ? { courseId: course._id } : "skip");
  const enrollment = enrollmentQuery.data;
  const enroll = useMutation(api.enrollments.enroll);
  const [isEnrolling, setIsEnrolling] = useState(false);

  if (courseQuery.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-3/4 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (courseQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon" />
            <ErrorStateTitle>Course could not load</ErrorStateTitle>
            <ErrorStateDescription>{getErrorMessage(courseQuery.error)}</ErrorStateDescription>
          </ErrorStateHeader>
        </ErrorState>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Database className="w-5 h-5" />
            </EmptyMedia>
            <EmptyTitle>Course not found</EmptyTitle>
            <EmptyDescription>The configured Supabase courses table did not return a row for this slug.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      await enroll({ courseId: course._id });
      toast.success("Enrolled successfully! Let's start learning.");
      navigate(`/classroom/${course.slug}`);
    } catch (error) {
      toast.error("Failed to enroll", {
        description:
          getErrorMessage(error),
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div>
      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          {course.thumbnailUrl && (
            <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">7-Day Course</Badge>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 font-bold capitalize">
                {course.level.replace("_", " ")}
              </Badge>
              {course.isFeatured && <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 font-bold">⭐ Featured</Badge>}
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">{course.title}</h1>
            <p className="text-white/70 text-lg leading-relaxed">{course.shortDescription}</p>
            <div className="flex flex-wrap gap-5 text-sm text-white/60">
              <span className="flex items-center gap-2"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {course.ratingAverage.toFixed(1)} ({course.ratingCount} reviews)</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {course.enrolledCount.toLocaleString()} students</span>
              <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {course.totalLessons} lessons</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 7 days</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> {course.language}</span>
            </div>
            <p className="text-white/60 text-sm">Taught by <span className="text-white font-bold">{course.instructorName}</span></p>
          </div>

          {/* Enrollment card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="rounded-2xl overflow-hidden shadow-2xl sticky top-20">
              {course.thumbnailUrl && (
                <div className="aspect-video overflow-hidden">
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-green-600">Free</p>
                  <p className="text-sm text-muted-foreground">Full access included</p>
                </div>

                {enrollment ? (
                  <Link to={`/classroom/${course.slug}`}>
                    <Button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold cursor-pointer">
                      Continue Learning <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Authenticated>
                      <Button disabled={isEnrolling} onClick={handleEnroll} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold cursor-pointer">
                        {isEnrolling ? "Enrolling..." : "Enroll Now — It's Free!"}
                      </Button>
                    </Authenticated>
                    <Unauthenticated>
                      <Link to="/auth/callback">
                        <Button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold cursor-pointer">
                          Sign In to Enroll
                        </Button>
                      </Link>
                    </Unauthenticated>
                  </>
                )}
                <ul className="space-y-2 text-sm">
                  {[`${course.totalLessons} lessons over 7 days`, "Certificate on completion", "Lifetime access", "Mobile friendly"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Course content */}
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* What you'll learn */}
        {course.whatYouLearn.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-5">What You'll Learn</h2>
            <div className="grid grid-cols-1 gap-3">
              {course.whatYouLearn.map((item) => (
                <div key={item} className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {course.tags.length > 0 && (
          <div>
            <h2 className="text-2xl font-black mb-5">Topics Covered</h2>
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full px-4 py-1 font-bold capitalize">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7-Day curriculum */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black mb-6">7-Day Curriculum</h2>
        {daysQuery.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : daysQuery.isError ? (
          <ErrorState>
            <ErrorStateHeader>
              <ErrorStateMedia variant="icon" />
              <ErrorStateTitle>Course outline could not load</ErrorStateTitle>
              <ErrorStateDescription>{getErrorMessage(daysQuery.error)}</ErrorStateDescription>
            </ErrorStateHeader>
          </ErrorState>
        ) : days.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Database className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>No course days found</EmptyTitle>
              <EmptyDescription>The configured Supabase course_days table returned zero rows for this course.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {days.map((day, i) => (
              <motion.div
                key={day._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-black shrink-0">
                      {day.dayNumber}
                    </div>
                    <div className="flex-1">
                      <p className="font-black">{day.title}</p>
                      {day.description && <p className="text-sm text-muted-foreground">{day.description}</p>}
                    </div>
                    <Badge variant="secondary" className="shrink-0 rounded-full">2 lessons</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
