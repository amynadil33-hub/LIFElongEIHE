import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Star, Users, Clock, BookOpen } from "lucide-react";
import type { Course } from "@/lib/supabase-types";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
  all_levels: "bg-blue-100 text-blue-700",
};

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link to={`/courses/${course.slug}`} className="cursor-pointer block h-full">
      <Card className="rounded-2xl border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden h-full group">
        <div className="relative overflow-hidden aspect-video bg-gradient-to-br from-violet-200 to-pink-200">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {course.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0 font-bold text-xs">
              ⭐ Featured
            </Badge>
          )}
          <Badge className={`absolute top-3 right-3 border-0 text-xs font-bold ${LEVEL_COLORS[course.level] ?? "bg-gray-100 text-gray-700"}`}>
            {course.level.replace("_", " ")}
          </Badge>
        </div>
        <CardContent className="p-5 flex flex-col gap-3">
          <div>
            <h3 className="font-black text-base leading-tight mb-1 line-clamp-2">{course.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{course.shortDescription}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> 7 Days
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {course.totalLessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {course.enrolledCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm">{course.ratingAverage.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({course.ratingCount})</span>
            </div>
            <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
              {course.instructorName}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
