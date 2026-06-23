import { Link } from "react-router-dom";
import { api, Authenticated, Unauthenticated, useSupabaseQuery as useQuery } from "@/lib/supabase-api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { BookOpen, Award, PlayCircle, Clock, CheckCircle2, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";

function DashboardInner() {
  const user = useQuery(api.users.getCurrentUser);
  const enrollments = useQuery(api.enrollments.getMyEnrollments);
  const certificates = useQuery(api.certificates.getMyCertificates);

  const active = enrollments?.filter((e) => e.status === "active") ?? [];
  const completed = enrollments?.filter((e) => e.status === "completed") ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">
            Welcome back, {user?.name?.split(" ")[0] ?? "Learner"}! 👋
          </h1>
          <p className="text-muted-foreground">Keep up the great work on your learning journey.</p>
        </div>
        <Link to="/courses">
          <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold cursor-pointer">
            <BookOpen className="w-4 h-4 mr-2" /> Explore More Courses
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "Enrolled", value: enrollments?.length ?? 0, color: "text-violet-600", bg: "bg-violet-50" },
          { icon: PlayCircle, label: "In Progress", value: active.length, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: CheckCircle2, label: "Completed", value: completed.length, color: "text-green-600", bg: "bg-green-50" },
          { icon: Award, label: "Certificates", value: certificates?.length ?? 0, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active courses */}
      <div>
        <h2 className="text-2xl font-black mb-5">Continue Learning</h2>
        {!enrollments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : active.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-muted">
            <CardContent className="p-10 text-center">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-black text-lg mb-2">No courses in progress</h3>
              <p className="text-muted-foreground mb-4">Start your first course today!</p>
              <Link to="/courses">
                <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold cursor-pointer">Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((e, i) => (
              <motion.div key={e._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex gap-0">
                      {e.course?.thumbnailUrl && (
                        <img src={e.course.thumbnailUrl} alt="" className="w-24 h-full object-cover shrink-0" />
                      )}
                      <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
                        <h3 className="font-black text-sm line-clamp-2">{e.course?.title}</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-bold">{e.progressPercentage}%</span>
                          </div>
                          <Progress value={e.progressPercentage} className="h-2" />
                        </div>
                        <Link to={`/classroom/${e.course?.slug}`}>
                          <Button size="sm" className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold w-full cursor-pointer text-xs">
                            <PlayCircle className="w-3 h-3 mr-1" /> Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-2xl font-black mb-5">Completed Courses 🎉</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((e, i) => (
              <motion.div key={e._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="rounded-2xl overflow-hidden border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h3 className="font-black text-sm line-clamp-2">{e.course?.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed {e.completedAt ? format(new Date(e.completedAt), "MMM d, yyyy") : ""}
                        </p>
                        <Badge className="mt-2 bg-green-100 text-green-700 border-0 text-xs font-bold">100% Complete</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent certificates */}
      {certificates && certificates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black">My Certificates</h2>
            <Link to="/certificates">
              <Button variant="secondary" size="sm" className="rounded-xl font-bold cursor-pointer">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.slice(0, 3).map((cert) => (
              <Card key={cert._id} className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                <CardContent className="p-5 text-center">
                  <Award className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-black text-sm line-clamp-2 mb-1">{cert.courseTitle}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {format(new Date(cert.issuedAt), "MMMM d, yyyy")}
                  </p>
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-bold">{cert.certificateNumber}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Authenticated>
        <DashboardInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-5 max-w-md mx-auto px-4">
            <GraduationCap className="w-20 h-20 text-violet-400 mx-auto" />
            <h1 className="text-3xl font-black">Sign in to access your dashboard</h1>
            <p className="text-muted-foreground">Track your progress, access your courses, and earn certificates.</p>
            <SignInButton className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-8 py-3 cursor-pointer hover:opacity-90" />
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
