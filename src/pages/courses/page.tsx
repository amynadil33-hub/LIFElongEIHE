import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { api, useSupabaseQueryResult as useQuery } from "@/lib/supabase-api";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
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
import { Search, BookOpen, Database } from "lucide-react";
import CourseCard from "../_components/CourseCard.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";

const LEVELS = ["all", "beginner", "intermediate", "advanced", "all_levels"];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Supabase did not return course data.";
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [debouncedSearch] = useDebounce(search, 400);

  const searchQuery = useQuery(api.courses.search, {
    query: debouncedSearch,
  });

  const categoriesQuery = useQuery(api.categories.list);

  const searchResults = searchQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const isLoading = searchQuery.isLoading;

  const filtered =
    level === "all"
      ? searchResults
      : searchResults.filter((course: any) => course.level === level);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <Badge className="mb-3 bg-violet-100 text-violet-700 border-0 font-bold px-4 py-1">
          All Courses
        </Badge>
        <h1 className="text-4xl font-black mb-3">Browse 500+ Short Courses</h1>
        <p className="text-muted-foreground text-lg">
          7-day courses designed to fit your schedule and change your life.
        </p>
      </motion.div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search courses, topics, or tags..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-12 rounded-2xl h-12 border-2 focus:border-violet-400 font-semibold"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={level === item ? "default" : "secondary"}
              className={`rounded-xl font-bold cursor-pointer capitalize ${
                level === item
                  ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white"
                  : ""
              }`}
              onClick={() => setLevel(item)}
            >
              {item === "all" ? "All Levels" : item.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map((category: any) => (
            <Link
              key={category._id ?? category.id ?? category.slug}
              to={`/categories/${category.slug}`}
            >
              <Badge className="cursor-pointer px-3 py-1 rounded-full font-bold border border-violet-100 bg-white hover:bg-violet-50 text-foreground transition-colors">
                {category.icon} {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : searchQuery.isError ? (
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon" />
            <ErrorStateTitle>Courses could not load</ErrorStateTitle>
            <ErrorStateDescription>
              {getErrorMessage(searchQuery.error)}
            </ErrorStateDescription>
          </ErrorStateHeader>
        </ErrorState>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {searchResults.length === 0 ? (
                <Database className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </EmptyMedia>
            <EmptyTitle>No courses found</EmptyTitle>
            <EmptyDescription>
              {searchResults.length === 0
                ? "The configured Supabase courses table returned zero published rows."
                : "Try a different search or filter."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 font-semibold">
            {filtered.length} courses found
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((course: any, index: number) => (
              <motion.div
                key={course._id ?? course.id ?? course.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}