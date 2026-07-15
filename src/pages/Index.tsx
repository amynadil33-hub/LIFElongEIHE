import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { api, useSupabaseQueryResult as useQuery } from "@/lib/supabase-api";
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
import {
  GraduationCap,
  Star,
  Users,
  BookOpen,
  ArrowRight,
  Play,
  Award,
  Zap,
  Globe,
  Heart,
  Sparkles,
  ChevronRight,
  Database,
} from "lucide-react";
import CourseCard from "./_components/CourseCard.tsx";
import CategoryCard from "./_components/CategoryCard.tsx";

const STATS = [
  { icon: BookOpen, value: "Since 2001", label: "Serving education in Maldives", color: "text-violet-600" },
  { icon: Award, value: "24+ Years", label: "Trusted learning experience", color: "text-pink-500" },
  { icon: Users, value: "14,000+ Students", label: "Reached through Everyone’s education programs", color: "text-amber-500" },
  { icon: Zap, value: "7-Day Courses", label: "Practical short course format", color: "text-emerald-500" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "7-Day Sprint Courses",
    desc: "Complete a full course in just one week. Designed for busy lives.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    desc: "Get recognized with verified certificates on course completion.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Heart,
    title: "Learn at Any Age",
    desc: "Content designed for beginners to professionals, ages 10 to 90.",
    color: "bg-pink-100 text-pink-700",
  },
  {
    icon: Globe,
    title: "Made for Maldives",
    desc: "Useful learning for Maldivian adults, professionals, youth, and lifelong learners.",
    color: "bg-emerald-100 text-emerald-700",
  },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Supabase did not return data for this request.";
}

function DataEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="border border-dashed border-border/70 bg-white/70">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Database className="w-5 h-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function DataError({ title, error }: { title: string; error: unknown }) {
  return (
    <ErrorState className="bg-white/70">
      <ErrorStateHeader>
        <ErrorStateMedia variant="icon" />
        <ErrorStateTitle>{title}</ErrorStateTitle>
        <ErrorStateDescription>{getErrorMessage(error)}</ErrorStateDescription>
      </ErrorStateHeader>
    </ErrorState>
  );
}

export default function Index() {
  const categoriesQuery = useQuery(api.categories.list);
  const featuredQuery = useQuery(api.courses.getFeatured);
  const alumniPostsQuery = useQuery(api.alumni.getFeatured);

  const categories = categoriesQuery.data ?? [];
  const featured = featuredQuery.data ?? [];
  const alumniPosts = alumniPostsQuery.data ?? [];

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${150 + i * 80}px`,
                height: `${150 + i * 80}px`,
                background: `hsl(${260 + i * 30}, 80%, 70%)`,
                left: `${[10, 70, 40, 5, 85, 55][i]}%`,
                top: `${[20, 10, 60, 75, 50, 30][i]}%`,
              }}
              animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-violet-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-bold text-violet-700">
                Everyone’s Education • Serving Maldives Since 2001
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-tight text-balance">
              Learn New Skills{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                in 7 Days
              </span>{" "}
              with EIHE
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Everyone’s Institute of Higher Education brings practical, flexible short
              courses for Maldivians who want to build skills, confidence, career
              readiness, and lifelong learning habits.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/courses">
                <Button
                  size="lg"
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold shadow-xl px-8 cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 mr-2" /> Browse Courses
                </Button>
              </Link>
              <Link to="/alumni">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-2xl font-bold cursor-pointer"
                >
                  <Play className="w-5 h-5 mr-2" /> Watch Alumni Stories
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { emoji: "🇲🇻", text: "Maldives-Based" },
                { emoji: "🎓", text: "Since 2001" },
                { emoji: "📚", text: "Practical 7-Day Learning" },
              ].map((item) => (
                <span
                  key={item.text}
                  className="flex items-center gap-1 text-sm text-muted-foreground font-semibold"
                >
                  <span>{item.emoji}</span> {item.text}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-pink-400 rounded-3xl rotate-3 opacity-20" />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80"
                alt="Students learning"
                className="relative rounded-3xl w-full h-full object-cover shadow-2xl"
              />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  🏆
                </div>
                <div>
                  <p className="font-black text-sm">Certificate Earned!</p>
                  <p className="text-xs text-muted-foreground">Python Fundamentals</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4"
              >
                <p className="font-black text-2xl">14,000+</p>
                <p className="text-xs text-muted-foreground">Students Reached</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <p className="font-black text-3xl">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-semibold">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-violet-100 text-violet-700 border-0 font-bold px-4 py-1">
            All Subjects
          </Badge>
          <h2 className="text-4xl font-black mb-4">Explore EIHE Course Categories</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Explore practical courses designed for Maldivian learners, professionals,
            students, and lifelong learners.
          </p>
        </motion.div>

        {categoriesQuery.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <DataError title="Categories could not load" error={categoriesQuery.error} />
        ) : categories.length === 0 ? (
          <DataEmpty
            title="No categories found"
            description="The configured Supabase categories table returned zero rows."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat: any, i: number) => (
              <motion.div
                key={cat._id ?? cat.id ?? cat.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <CategoryCard category={cat} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Featured courses */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4"
          >
            <div>
              <Badge className="mb-3 bg-pink-100 text-pink-700 border-0 font-bold px-4 py-1">
                Featured
              </Badge>
              <h2 className="text-4xl font-black">Featured EIHE Short Courses</h2>
            </div>
            <Link to="/courses">
              <Button variant="secondary" className="rounded-xl font-bold cursor-pointer">
                View All Courses <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {featuredQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : featuredQuery.isError ? (
            <DataError
              title="Featured courses could not load"
              error={featuredQuery.error}
            />
          ) : featured.length === 0 ? (
            <DataEmpty
              title="No featured courses found"
              description="The configured Supabase courses table returned zero published, featured rows."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((course: any, i: number) => (
                <motion.div
                  key={course._id ?? course.id ?? course.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-4">Why Learners Love EIHE</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built for real people with real lives — accessible, flexible, and fun.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="rounded-2xl border-0 shadow-md hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Alumni */}
      {alumniPosts.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4"
            >
              <div>
                <Badge className="mb-3 bg-pink-500/20 text-pink-300 border-pink-500/30 font-bold px-4 py-1">
                  Alumni Stories
                </Badge>
                <h2 className="text-4xl font-black">Real People, Real Results</h2>
              </div>
              <Link to="/alumni">
                <Button
                  variant="secondary"
                  className="rounded-xl font-bold cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  All Stories <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alumniPosts.slice(0, 3).map((post: any, i: number) => (
                <motion.div
                  key={post._id ?? post.id ?? post.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="rounded-2xl bg-white/10 backdrop-blur border-white/10 text-white overflow-hidden hover:bg-white/15 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {post.user?.avatar ? (
                          <img
                            src={post.mediaUrl ?? post.user.avatar}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-black text-lg">
                            {post.user?.name?.charAt(0) ?? "A"}
                          </div>
                        )}
                        <div>
                          <p className="font-black">{post.user?.name ?? "EIHE Learner"}</p>
                          <Badge
                            className={`text-xs ${
                              post.postType === "achievement"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : post.postType === "project"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-green-500/20 text-green-300 border-green-500/30"
                            }`}
                          >
                            {post.postType ?? "story"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-3 h-3 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>

                      <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                        {post.content}
                      </p>
                      <p className="text-white/40 text-xs mt-3">
                        ❤️ {post.likeCount ?? 0} found this helpful
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-4xl font-black mb-4">Start Your EIHE Short Course Journey</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Choose a practical 7-day course and begin building useful skills with
              Everyone’s Institute of Higher Education.
            </p>
            <Link to="/courses">
              <Button
                size="lg"
                className="rounded-2xl bg-white text-violet-700 hover:bg-white/90 font-black px-10 shadow-xl cursor-pointer"
              >
                <GraduationCap className="w-5 h-5 mr-2" /> Explore EIHE Courses
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
