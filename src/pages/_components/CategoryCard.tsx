import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { BookOpen, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/supabase-types";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to={`/categories/${category.slug}`} className="cursor-pointer block">
      <Card className={`rounded-2xl border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden h-full`}>
        <CardContent className="p-0">
          <div className={`bg-gradient-to-br ${category.color} p-6 flex flex-col gap-3 h-full`}>
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h3 className="font-black text-white text-base leading-tight mb-1">{category.name}</h3>
              <p className="text-white/70 text-xs line-clamp-2">{category.description}</p>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-white/80 text-xs font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {category.courseCount} courses
              </span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
