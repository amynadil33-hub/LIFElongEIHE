import { useParams } from "react-router-dom";
import { api, useSupabaseQueryResult as useQuery } from "@/lib/supabase-api";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
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
import { motion } from "motion/react";
import CourseCard from "../../_components/CourseCard.tsx";
import { BookOpen, Database } from "lucide-react";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Supabase did not return category data.";
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const categoryQuery = useQuery(api.categories.getBySlug, { slug: slug ?? "" });
  const category = categoryQuery.data;
  const coursesQuery = useQuery(api.courses.getByCategory, category ? { categoryId: category._id } : "skip");
  const courses = coursesQuery.data ?? [];

  if (categoryQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Skeleton className="h-48 rounded-3xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (categoryQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon" />
            <ErrorStateTitle>Category could not load</ErrorStateTitle>
            <ErrorStateDescription>{getErrorMessage(categoryQuery.error)}</ErrorStateDescription>
          </ErrorStateHeader>
        </ErrorState>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Database className="w-5 h-5" />
            </EmptyMedia>
            <EmptyTitle>Category not found</EmptyTitle>
            <EmptyDescription>The configured Supabase categories table did not return a row for this slug.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className={`bg-gradient-to-br ${category.color} text-white py-16 px-4`}>
        <div className="max-w-5xl mx-auto flex items-center gap-6">
          <div className="text-7xl">{category.icon}</div>
          <div>
            <h1 className="text-4xl font-black mb-2">{category.name}</h1>
            <p className="text-white/80 text-lg">{category.description}</p>
            <Badge className="mt-3 bg-white/20 text-white border-white/30 font-bold">
              <BookOpen className="w-3 h-3 mr-1" /> {category.courseCount} Courses
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black mb-8">All Courses in {category.name}</h2>
        {coursesQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : coursesQuery.isError ? (
          <ErrorState>
            <ErrorStateHeader>
              <ErrorStateMedia variant="icon" />
              <ErrorStateTitle>Courses could not load</ErrorStateTitle>
              <ErrorStateDescription>{getErrorMessage(coursesQuery.error)}</ErrorStateDescription>
            </ErrorStateHeader>
          </ErrorState>
        ) : courses.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>{category.icon}</EmptyMedia>
              <EmptyTitle>No courses yet in this category</EmptyTitle>
              <EmptyDescription>The configured Supabase courses table returned zero published rows for this category.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course, i) => (
              <motion.div key={course._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
