import { useState } from "react";
import { api, Authenticated, Unauthenticated, useSupabaseMutation as useMutation, useSupabaseQuery as useQuery } from "@/lib/supabase-api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { ShieldCheck, BookOpen, Users, CheckCircle2, XCircle, Plus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form.tsx";
import { motion } from "motion/react";

const courseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().min(10),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  categoryId: z.string().min(1),
  instructorName: z.string().min(2),
  level: z.string().min(1),
  language: z.string(),
  tags: z.string(),
  whatYouLearn: z.string(),
  isFeatured: z.boolean(),
});

type CourseForm = z.infer<typeof courseSchema>;

function AdminInner() {
  const user = useQuery(api.users.getCurrentUser);
  const categories = useQuery(api.categories.list);
  const submissions = useQuery(api.submissions.getAllSubmissions);
  const createCourse = useMutation(api.courses.createCourse);
  const reviewSubmission = useMutation(api.submissions.review);
  const [tab, setTab] = useState<"upload" | "submissions" | "overview">("overview");

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: { language: "English", isFeatured: false, tags: "", whatYouLearn: "", level: "" },
  });

  if (!user) return <Skeleton className="h-96 rounded-2xl" />;

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4 text-center px-4">
        <ShieldCheck className="w-20 h-20 text-muted-foreground/30" />
        <h2 className="text-2xl font-black">Access Restricted</h2>
        <p className="text-muted-foreground">You don't have admin privileges. Contact support if you believe this is an error.</p>
      </div>
    );
  }

  const handleCreateCourse = async (data: CourseForm) => {
    try {
      await createCourse({
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl || undefined,
        categoryId: data.categoryId as Parameters<typeof createCourse>[0]["categoryId"],
        instructorName: data.instructorName,
        level: data.level,
        language: data.language,
        tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
        whatYouLearn: data.whatYouLearn.split("\n").map((t) => t.trim()).filter(Boolean),
        isFeatured: data.isFeatured,
      });
      toast.success("Course created successfully!");
      form.reset();
    } catch (e) {
      toast.error("Failed to create course.");
    }
  };

  const handleReview = async (id: Parameters<typeof reviewSubmission>[0]["submissionId"], status: string, grade?: string) => {
    await reviewSubmission({ submissionId: id, status, grade, feedback: `Reviewed by ${user.name}` });
    toast.success("Submission reviewed!");
  };

  const TABS = [
    { id: "overview" as const, label: "Overview", icon: ShieldCheck },
    { id: "upload" as const, label: "Upload Course", icon: BookOpen },
    { id: "submissions" as const, label: "Submissions", icon: Users },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Badge className="mb-3 bg-violet-100 text-violet-700 border-0 font-bold px-4 py-1">Admin</Badge>
        <h1 className="text-3xl font-black">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "secondary"}
            size="sm"
            className={`rounded-xl font-bold cursor-pointer ${tab === t.id ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon className="w-4 h-4 mr-2" /> {t.label}
          </Button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, label: "Total Submissions", value: submissions?.length ?? 0, color: "text-violet-600", bg: "bg-violet-50" },
            { icon: CheckCircle2, label: "Approved", value: submissions?.filter((s) => s.status === "approved").length ?? 0, color: "text-green-600", bg: "bg-green-50" },
            { icon: Users, label: "Pending Review", value: submissions?.filter((s) => s.status === "submitted").length ?? 0, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-0 shadow-md">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-semibold">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "upload" && (
        <Card className="rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="font-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-600" /> Upload New Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateCourse)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Course Title</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Python for Beginners" className="rounded-xl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">URL Slug</FormLabel>
                      <FormControl><Input {...field} placeholder="python-for-beginners" className="rounded-xl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="shortDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Short Description</FormLabel>
                    <FormControl><Input {...field} placeholder="One line summary" className="rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Full Description</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Detailed course description..." className="rounded-xl" rows={4} /></FormControl>
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Category</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>{cat.icon} {cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="level" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Level</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="all_levels">All Levels</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="instructorName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Instructor Name</FormLabel>
                      <FormControl><Input {...field} placeholder="Dr. Jane Doe" className="rounded-xl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Thumbnail URL (optional)</FormLabel>
                      <FormControl><Input {...field} placeholder="https://..." className="rounded-xl" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Tags (comma-separated)</FormLabel>
                    <FormControl><Input {...field} placeholder="python, coding, programming" className="rounded-xl" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="whatYouLearn" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">What You'll Learn (one per line)</FormLabel>
                    <FormControl><Textarea {...field} placeholder={"Variables & data types\nFunctions & loops\nFile handling"} className="rounded-xl" rows={4} /></FormControl>
                  </FormItem>
                )} />

                <Button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold cursor-pointer w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create Course"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {tab === "submissions" && (
        <div className="space-y-4">
          {!submissions ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No submissions yet.</div>
          ) : (
            submissions.map((sub, i) => (
              <motion.div key={sub._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="rounded-2xl">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-black text-sm">{sub.user?.name ?? "Unknown"}</p>
                        <Badge className={`text-xs border-0 font-bold ${
                          sub.status === "approved" ? "bg-green-100 text-green-700" :
                          sub.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{sub.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{sub.course?.title}</p>
                      {sub.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sub.content}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="rounded-xl bg-green-100 text-green-700 hover:bg-green-200 font-bold cursor-pointer"
                        onClick={() => handleReview(sub._id, "approved", "Pass")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl font-bold cursor-pointer"
                        onClick={() => handleReview(sub._id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <Authenticated>
        <AdminInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4 text-center px-4">
          <ShieldCheck className="w-20 h-20 text-muted-foreground/30" />
          <h2 className="text-2xl font-black">Admin Access Required</h2>
          <SignInButton className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-8 py-3 cursor-pointer" />
        </div>
      </Unauthenticated>
    </>
  );
}
