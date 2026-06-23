import { useParams, Link } from "react-router-dom";
import { api, Authenticated, Unauthenticated, useSupabaseMutation as useMutation, useSupabaseQuery as useQuery } from "@/lib/supabase-api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { CheckCircle2, PlayCircle, FileText, MessageSquare, Lock, ChevronDown, ChevronUp, Send, Award, Languages } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { Id } from "@/lib/supabase-types";

type Lang = "en" | "dv";

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 text-sm font-bold shrink-0">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${lang === "en" ? "bg-white dark:bg-background shadow font-black" : "text-muted-foreground hover:text-foreground"}`}
      >
        English
      </button>
      <button
        onClick={() => setLang("dv")}
        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${lang === "dv" ? "bg-white dark:bg-background shadow font-black" : "text-muted-foreground hover:text-foreground"}`}
      >
        <Languages className="w-3 h-3" /> ދިވެހި
      </button>
    </div>
  );
}

function ClassroomInner({ courseSlug }: { courseSlug: string }) {
  const course = useQuery(api.courses.getBySlug, { slug: courseSlug });
  const enrollment = useQuery(api.enrollments.getEnrollment, course ? { courseId: course._id } : "skip");
  const days = useQuery(api.courses.getCourseDays, course ? { courseId: course._id } : "skip");
  const lessonProgressList = useQuery(api.enrollments.getLessonProgress, course ? { courseId: course._id } : "skip");
  const updateProgress = useMutation(api.enrollments.updateProgress);
  const issueCert = useMutation(api.certificates.issue);

  const [activeLesson, setActiveLesson] = useState<Id<"lessons"> | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(1);
  const [comment, setComment] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const addComment = useMutation(api.comments.add);

  const completedIds = new Set<Id<"lessons">>(
    (lessonProgressList?.filter((p) => p.isCompleted).map((p) => p.lessonId) ?? []) as Id<"lessons">[]
  );

  if (!course || !enrollment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <Lock className="w-16 h-16 text-muted-foreground/40" />
        <h2 className="text-2xl font-black">You are not enrolled in this course</h2>
        <Link to={`/courses/${courseSlug}`}>
          <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold cursor-pointer">
            View Course
          </Button>
        </Link>
      </div>
    );
  }

  const handleComplete = async (lessonId: Id<"lessons">) => {
    try {
      await updateProgress({ courseId: course._id, lessonId });
      toast.success("Lesson marked as complete! 🎉");
      if (enrollment.progressPercentage >= 95) {
        await issueCert({ courseId: course._id });
        toast.success("Congratulations! You've earned a certificate! 🏆", { duration: 5000 });
      }
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const handleComment = async (lessonId: Id<"lessons">) => {
    if (!comment.trim()) return;
    try {
      await addComment({ lessonId, courseId: course._id, content: comment });
      setComment("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: course structure */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <Card className="rounded-2xl sticky top-20">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="font-black text-lg line-clamp-2">{course.title}</h2>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall Progress</span>
                  <span className="font-bold">{enrollment.progressPercentage}%</span>
                </div>
                <Progress value={enrollment.progressPercentage} className="h-2.5" />
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {days?.map((day) => (
                <DayAccordion
                  key={day._id}
                  day={day}
                  courseId={course._id}
                  isExpanded={expandedDay === day.dayNumber}
                  onToggle={() => setExpandedDay(expandedDay === day.dayNumber ? -1 : day.dayNumber)}
                  completedIds={completedIds}
                  activeLesson={activeLesson}
                  onSelectLesson={setActiveLesson}
                  lang={lang}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
        {/* Language toggle bar */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-black text-lg line-clamp-1 flex-1">{course.title}</h1>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        {activeLesson ? (
          <LessonViewer
            lessonId={activeLesson}
            courseId={course._id}
            isCompleted={completedIds.has(activeLesson)}
            onComplete={() => handleComplete(activeLesson)}
            comment={comment}
            setComment={setComment}
            onComment={() => handleComment(activeLesson)}
            lang={lang}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl gap-4">
            <PlayCircle className="w-16 h-16 text-violet-400" />
            <h3 className="font-black text-xl">Select a lesson to start</h3>
            <p className="text-muted-foreground">Choose from the course menu on the left.</p>
          </div>
        )}

        {enrollment.status === "completed" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="p-6 text-center">
                <Award className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                <h3 className="font-black text-2xl mb-2">Course Complete! 🎉</h3>
                <p className="text-muted-foreground mb-4">You've earned a certificate for this course.</p>
                <Link to="/certificates">
                  <Button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 font-bold cursor-pointer">
                    View Certificate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DayAccordion({
  day,
  courseId,
  isExpanded,
  onToggle,
  completedIds,
  activeLesson,
  onSelectLesson,
  lang,
}: {
  day: { _id: Id<"courseDays">; dayNumber: number; title: string };
  courseId: Id<"courses">;
  isExpanded: boolean;
  onToggle: () => void;
  completedIds: Set<Id<"lessons">>;
  activeLesson: Id<"lessons"> | null;
  onSelectLesson: (id: Id<"lessons">) => void;
  lang: Lang;
}) {
  const lessons = useQuery(api.courses.getLessonsByDay, { dayId: day._id });

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white text-xs flex items-center justify-center font-black shrink-0">
            {day.dayNumber}
          </span>
          <span className="text-sm font-bold line-clamp-1">{day.title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && lessons && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-2 pb-2 space-y-1">
              {lessons.map((lesson) => {
                const done = completedIds.has(lesson._id);
                const isActive = activeLesson === lesson._id;
                const displayTitle =
                  lang === "dv" && lesson.dhivehiTitle ? lesson.dhivehiTitle : lesson.title;
                return (
                  <button
                    key={lesson._id}
                    onClick={() => onSelectLesson(lesson._id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isActive ? "bg-violet-100 text-violet-700" : "hover:bg-secondary"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : lesson.contentType === "video" ? (
                      <PlayCircle className="w-4 h-4 text-violet-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <span
                      className={`line-clamp-2 font-semibold ${done ? "line-through text-muted-foreground" : ""} ${lang === "dv" ? "text-right" : ""}`}
                    >
                      {displayTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonViewer({
  lessonId,
  courseId,
  isCompleted,
  onComplete,
  comment,
  setComment,
  onComment,
  lang,
}: {
  lessonId: Id<"lessons">;
  courseId: Id<"courses">;
  isCompleted: boolean;
  onComplete: () => void;
  comment: string;
  setComment: (v: string) => void;
  onComment: () => void;
  lang: Lang;
}) {
  const allLessons = useQuery(api.courses.getLessons, { courseId });
  const lessonData = allLessons?.find((l) => l._id === lessonId);
  const comments = useQuery(api.comments.list, { lessonId });
  const [showComments, setShowComments] = useState(false);

  if (!lessonData) return <Skeleton className="h-96 rounded-2xl" />;

  const isDhivehi = lang === "dv";
  const hasDhivehi = !!(lessonData.dhivehiTitle ?? lessonData.dhivehiContentText);
  const displayTitle =
    isDhivehi && lessonData.dhivehiTitle ? lessonData.dhivehiTitle : lessonData.title;
  const displayDesc =
    isDhivehi && lessonData.dhivehiDescription
      ? lessonData.dhivehiDescription
      : lessonData.description;
  const displayText =
    isDhivehi && lessonData.dhivehiContentText
      ? lessonData.dhivehiContentText
      : lessonData.contentText;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {lessonData.contentType === "video" && lessonData.contentUrl && (
            <div className="aspect-video bg-black">
              <iframe
                src={lessonData.contentUrl}
                className="w-full h-full"
                allowFullScreen
                title={lessonData.title}
              />
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className={`${isDhivehi ? "text-right" : ""} flex-1`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize font-bold">
                    {lessonData.contentType === "video" ? "📹 Video" : "📄 Reading"}
                  </Badge>
                  {isDhivehi && !hasDhivehi && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs font-bold">
                      ދިވެހި ތަރުޖަމާ ލިބެންނެތް
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-black">{displayTitle}</h2>
                {displayDesc && (
                  <p className="text-muted-foreground text-sm mt-1">{displayDesc}</p>
                )}
              </div>
              <Button
                onClick={onComplete}
                disabled={isCompleted}
                size="sm"
                className={`rounded-xl font-bold shrink-0 cursor-pointer ${
                  isCompleted
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 text-white"
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Done
                  </>
                ) : (
                  "Mark Complete"
                )}
              </Button>
            </div>

            {lessonData.contentType === "text" && displayText && (
              <div
                className={`prose prose-sm max-w-none bg-secondary/30 rounded-xl p-5 ${isDhivehi ? "text-right" : ""}`}
                dir={isDhivehi ? "rtl" : "ltr"}
              >
                {displayText.split("\n").map((line, i) => (
                  <p
                    key={i}
                    className={
                      line.startsWith("##")
                        ? "font-bold"
                        : line.startsWith("#")
                          ? "font-black text-lg"
                          : "text-muted-foreground"
                    }
                  >
                    {line.replace(/^#+\s*/, "")}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <button
            className="flex items-center gap-2 font-black cursor-pointer w-full text-left"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Discussion ({comments?.length ?? 0})
            {showComments ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>

          {showComments && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a question or share your thoughts..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="rounded-xl resize-none text-sm flex-1"
                  rows={2}
                />
                <Button
                  onClick={onComment}
                  size="icon"
                  className="rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 cursor-pointer shrink-0 self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments?.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {c.user?.name?.charAt(0) ?? "U"}
                    </div>
                    <div className="bg-secondary rounded-xl p-3 flex-1">
                      <p className="font-bold text-xs mb-1">{c.user?.name ?? "Student"}</p>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClassroomPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <>
      <Authenticated>
        <ClassroomInner courseSlug={slug ?? ""} />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
          <Lock className="w-16 h-16 text-muted-foreground/40" />
          <h2 className="text-2xl font-black">Sign in to access the classroom</h2>
          <SignInButton className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-6 py-2 cursor-pointer" />
        </div>
      </Unauthenticated>
    </>
  );
}
