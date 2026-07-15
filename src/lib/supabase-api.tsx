/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
import {
  useMutation as useRQMutation,
  useQuery as useRQQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth.ts";
import { useEffect, type ReactNode } from "react";
import { supabase } from "./supabase";
import type {
  AlumniComment,
  AlumniPost,
  Category,
  Certificate,
  Comment,
  Course,
  CourseDay,
  Enrollment,
  Lesson,
  LessonProgress,
  Submission,
  User,
} from "./supabase-types";

type Descriptor<TData = any> = {
  key: string;
  fn: (args?: any) => Promise<TData>;
};

type QueryResult<T> = {
  data: T | null;
  error: { message?: string; code?: string; details?: string; hint?: string } | null;
};

const camel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const mapRow = <T,>(row: any): T => {
  if (!row) return row as T;

  const out: any = {
    _id: row.id,
  };

  for (const [key, value] of Object.entries(row)) {
    out[camel(key)] = value;
  }

  if (row.full_name && !out.name) out.name = row.full_name;
  if (row.avatar_url && !out.avatar) out.avatar = row.avatar_url;
  if (row.thumbnail_url && !out.thumbnailUrl) out.thumbnailUrl = row.thumbnail_url;

  return out as T;
};

const mapRows = <T,>(rows: any[] | null): T[] => {
  return (rows ?? []).map((row) => mapRow<T>(row));
};

const warnSupabase = (
  label: string,
  error: { message?: string; code?: string; details?: string; hint?: string } | null,
) => {
  if (!error) return;

  console.warn(
    `[Supabase] ${label}: ${[
      error.message,
      error.code ? `code: ${error.code}` : undefined,
      error.details ? `details: ${error.details}` : undefined,
      error.hint ? `hint: ${error.hint}` : undefined,
    ]
      .filter(Boolean)
      .join(" | ")}`,
  );
};

function formatQueryError(error: unknown) {
  if (!error || typeof error !== "object") return String(error);

  const { message, code, details, hint } = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  return [
    message,
    code ? `code: ${code}` : undefined,
    details ? `details: ${details}` : undefined,
    hint ? `hint: ${hint}` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");
}

function mutationError(error: unknown) {
  const details = error as {
    message?: string;
    code?: string;
    details?: string;
  } | null;

  if (
    details?.code === "23503" ||
    details?.message?.toLowerCase().includes("foreign key")
  ) {
    return new Error(
      "Your EIHE learner profile is not ready. Apply the latest Supabase migration, then sign out and sign in again.",
    );
  }

  if (
    details?.code === "42501" ||
    details?.message?.toLowerCase().includes("row-level security")
  ) {
    return new Error(
      "Supabase blocked enrollment because the enrollment policy is not deployed. Apply the latest Supabase migration and try again.",
    );
  }

  return new Error(formatQueryError(error) || "Supabase rejected the enrollment request.");
}

async function run<T>(
  label: string,
  query: PromiseLike<QueryResult<T>>,
  fallback: T,
): Promise<T> {
  const { data, error } = await query;
  warnSupabase(label, error);

  if (error) return fallback;
  return data ?? fallback;
}

async function one<T>(table: string, column: string, value: any): Promise<T | null> {
  const data = await run<any | null>(
    `${table}.getBy(${column})`,
    supabase.from(table).select("*").eq(column, value).maybeSingle(),
    null,
  );

  return data ? mapRow<T>(data) : null;
}

const unique = (items: Array<string | null | undefined>) => {
  return Array.from(new Set(items.filter(Boolean))) as string[];
};

async function getMapByIds<T>(table: string, ids: string[]) {
  const cleanIds = unique(ids);

  if (cleanIds.length === 0) {
    return new Map<string, T>();
  }

  const rows = await run<any[]>(
    `${table}.byIds`,
    supabase.from(table).select("*").in("id", cleanIds),
    [],
  );

  return new Map<string, T>(rows.map((row) => [row.id, mapRow<T>(row)]));
}

async function getProfilesByIds(ids: string[]) {
  return getMapByIds<User>("profiles", ids);
}

async function getCoursesByIds(ids: string[]) {
  return getMapByIds<Course>("courses", ids);
}

async function currentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  warnSupabase("auth.getUser", error);

  if (!data?.user) return null;

  return one<User>("profiles", "id", data.user.id);
}

async function requireUser() {
  const user = await currentUser();

  if (!user) {
    throw new Error("Not authenticated with Supabase");
  }

  return user;
}

async function listCourses(
  options: {
    categoryId?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    publishedOnly?: boolean;
  } = {},
) {
  const makeQuery = (publishedOnly: boolean) => {
    let query: any = supabase.from("courses").select("*");

    if (publishedOnly) query = query.eq("is_published", true);
    if (options.featured) query = query.eq("is_featured", true);
    if (options.categoryId) query = query.eq("category_id", options.categoryId);

    if (options.search?.trim()) {
      const escaped = options.search.trim().replaceAll("%", "\\%").replaceAll(",", "\\,");
      query = query.or(`title.ilike.%${escaped}%,short_description.ilike.%${escaped}%`);
    }

    return query.order("created_at", { ascending: false }).limit(options.limit ?? 50);
  };

  const publishedRows = await run<any[]>(
    "courses.list.published",
    makeQuery(options.publishedOnly ?? true),
    [],
  );

  if (publishedRows.length > 0 || options.publishedOnly === false) {
    return mapRows<Course>(publishedRows);
  }

  const allRows = await run<any[]>("courses.list.allFallback", makeQuery(false), []);
  return mapRows<Course>(allRows);
}

async function listAlumniPosts(options: { featured?: boolean; limit?: number } = {}) {
  const makeQuery = (publishedOnly: boolean) => {
    let query: any = supabase.from("alumni_posts").select("*");

    if (publishedOnly) query = query.eq("is_published", true);
    if (options.featured) query = query.eq("is_featured", true);

    return query.order("created_at", { ascending: false }).limit(options.limit ?? 20);
  };

  const publishedRows = await run<any[]>("alumni_posts.list.published", makeQuery(true), []);
  const rows =
    publishedRows.length > 0
      ? publishedRows
      : await run<any[]>("alumni_posts.list.allFallback", makeQuery(false), []);

  const profiles = await getProfilesByIds(rows.map((row) => row.user_id));

  return rows.map((row) => ({
    ...mapRow<AlumniPost>(row),
    user: profiles.get(row.user_id),
  }));
}

export const api = {
  users: {
    getCurrentUser: {
      key: "users.getCurrentUser",
      fn: currentUser,
    },

    updateCurrentUser: {
      key: "users.updateCurrentUser",
      fn: async (args: any) => {
        const user = await requireUser();

        const patch: any = {};

        if (args?.name) patch.name = args.name;
        if (args?.fullName) patch.name = args.fullName;
        if (args?.avatar) patch.avatar = args.avatar;
        if (args?.avatarUrl) patch.avatar = args.avatarUrl;
        if (args?.bio !== undefined) patch.bio = args.bio;

        const { data, error } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;

        return mapRow<User>(data);
      },
    },
  },

  categories: {
    list: {
      key: "categories.list",
      fn: async () =>
        mapRows<Category>(
          await run<any[]>(
            "categories.list",
            supabase.from("categories").select("*").order("sort_order"),
            [],
          ),
        ),
    },

    getBySlug: {
      key: "categories.getBySlug",
      fn: (args: any) => one<Category>("categories", "slug", args.slug),
    },

    seed: {
      key: "categories.seed",
      fn: async () => "Run the Supabase seed SQL file in the Supabase SQL Editor.",
    },
  },

  courses: {
    getFeatured: {
      key: "courses.getFeatured",
      fn: async () => listCourses({ featured: true, limit: 6 }),
    },

    getBySlug: {
      key: "courses.getBySlug",
      fn: (args: any) => one<Course>("courses", "slug", args.slug),
    },

    getByCategory: {
      key: "courses.getByCategory",
      fn: async (args: any) => listCourses({ categoryId: args.categoryId }),
    },

    search: {
      key: "courses.search",
      fn: async (args: any) => listCourses({ search: args?.query, limit: 50 }),
    },

    getCourseDays: {
      key: "courses.getCourseDays",
      fn: async (args: any) =>
        mapRows<CourseDay>(
          await run<any[]>(
            "course_days.byCourse",
            supabase
              .from("course_days")
              .select("*")
              .eq("course_id", args.courseId)
              .order("day_number"),
            [],
          ),
        ),
    },

    getLessons: {
      key: "courses.getLessons",
      fn: async (args: any) =>
        mapRows<Lesson>(
          await run<any[]>(
            "lessons.byCourse",
            supabase
              .from("lessons")
              .select("*")
              .eq("course_id", args.courseId)
              .order("sort_order"),
            [],
          ),
        ),
    },

    getLessonsByDay: {
      key: "courses.getLessonsByDay",
      fn: async (args: any) =>
        mapRows<Lesson>(
          await run<any[]>(
            "lessons.byDay",
            supabase
              .from("lessons")
              .select("*")
              .eq("day_id", args.dayId)
              .order("sort_order"),
            [],
          ),
        ),
    },

    createCourse: {
      key: "courses.createCourse",
      fn: async (args: any) => {
        const user = await requireUser();

        const { data, error } = await supabase
          .from("courses")
          .insert({
            title: args.title,
            slug: args.slug,
            short_description: args.shortDescription,
            description: args.description,
            thumbnail_url: args.thumbnailUrl,
            category_id: args.categoryId,
            instructor_id: user.id,
            instructor_name: args.instructorName,
            level: args.level,
            language: args.language,
            tags: args.tags,
            what_you_learn: args.whatYouLearn,
            is_featured: args.isFeatured,
            is_published: true,
          })
          .select()
          .single();

        if (error) throw error;

        return data.id;
      },
    },

    seedCourses: {
      key: "courses.seedCourses",
      fn: async () => "Run the Supabase seed SQL file in the Supabase SQL Editor.",
    },
  },

  enrollments: {
    enroll: {
      key: "enrollments.enroll",
      fn: async (args: any) => {
        const rpcResult = await supabase.rpc("enroll_in_course", {
          p_course_id: args.courseId,
        });

        if (!rpcResult.error) return rpcResult.data;

        warnSupabase("enrollments.enroll.rpcFallback", rpcResult.error);

        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError || !authData?.user) {
          throw authError
            ? mutationError(authError)
            : new Error("Your session has expired. Please sign in again.");
        }

        const userId = authData.user.id;

        const existing = await run<any | null>(
          "enrollments.existing",
          supabase
            .from("enrollments")
            .select("*")
            .eq("user_id", userId)
            .eq("course_id", args.courseId)
            .maybeSingle(),
          null,
        );

        if (existing) return existing.id;

        const { data, error } = await supabase
          .from("enrollments")
          .insert({
            user_id: userId,
            course_id: args.courseId,
            status: "active",
            progress_percentage: 0,
          })
          .select()
          .single();

        if (error) throw mutationError(error);

        return data.id;
      },
    },

    getEnrollment: {
      key: "enrollments.getEnrollment",
      fn: async (args: any) => {
        const user = await currentUser();

        if (!user) return null;

        const row = await run<any | null>(
          "enrollments.byUserCourse",
          supabase
            .from("enrollments")
            .select("*")
            .eq("user_id", user.id)
            .eq("course_id", args.courseId)
            .maybeSingle(),
          null,
        );

        return row ? mapRow<Enrollment>(row) : null;
      },
    },

    getMyEnrollments: {
      key: "enrollments.getMyEnrollments",
      fn: async () => {
        const user = await currentUser();

        if (!user) return [];

        const rows = await run<any[]>(
          "enrollments.mine",
          supabase.from("enrollments").select("*").eq("user_id", user.id),
          [],
        );

        const courses = await getCoursesByIds(rows.map((row) => row.course_id));

        return rows.map((row) => ({
          ...mapRow<Enrollment>(row),
          course: courses.get(row.course_id),
        }));
      },
    },

    updateProgress: {
      key: "enrollments.updateProgress",
      fn: async (args: any) => {
        const { data, error } = await supabase.rpc("complete_lesson", {
          p_course_id: args.courseId,
          p_lesson_id: args.lessonId,
        });

        if (error) throw error;

        return data;
      },
    },

    getLessonProgress: {
      key: "enrollments.getLessonProgress",
      fn: async (args: any) => {
        const user = await currentUser();

        if (!user) return [];

        return mapRows<LessonProgress>(
          await run<any[]>(
            "lesson_progress.byCourse",
            supabase
              .from("lesson_progress")
              .select("*")
              .eq("user_id", user.id)
              .eq("course_id", args.courseId),
            [],
          ),
        );
      },
    },
  },

  comments: {
    list: {
      key: "comments.list",
      fn: async (args: any) => {
        const rows = await run<any[]>(
          "comments.byLesson",
          supabase
            .from("comments")
            .select("*")
            .eq("lesson_id", args.lessonId)
            .order("created_at", { ascending: false }),
          [],
        );

        const profiles = await getProfilesByIds(rows.map((row) => row.user_id));

        return rows.map((row) => ({
          ...mapRow<Comment>(row),
          user: profiles.get(row.user_id),
        }));
      },
    },

    add: {
      key: "comments.add",
      fn: async (args: any) => {
        const user = await requireUser();

        const { data, error } = await supabase
          .from("comments")
          .insert({
            user_id: user.id,
            lesson_id: args.lessonId,
            course_id: args.courseId,
            parent_id: args.parentId,
            content: args.content,
          })
          .select()
          .single();

        if (error) throw error;

        return data.id;
      },
    },
  },

  submissions: {
    getAllSubmissions: {
      key: "submissions.getAllSubmissions",
      fn: async () => {
        const rows = await run<any[]>(
          "submissions.all",
          supabase
            .from("submissions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
          [],
        );

        const profiles = await getProfilesByIds(rows.map((row) => row.user_id));
        const courses = await getCoursesByIds(rows.map((row) => row.course_id));

        return rows.map((row) => ({
          ...mapRow<Submission>(row),
          user: profiles.get(row.user_id),
          course: courses.get(row.course_id),
        }));
      },
    },

    review: {
      key: "submissions.review",
      fn: async (args: any) => {
        const { error } = await supabase
          .from("submissions")
          .update({
            status: args.status,
            grade: args.grade,
            feedback: args.feedback,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", args.submissionId);

        if (error) throw error;
      },
    },
  },

  certificates: {
    getMyCertificates: {
      key: "certificates.getMyCertificates",
      fn: async () => {
        const user = await currentUser();

        if (!user) return [];

        const rows = await run<any[]>(
          "certificates.mine",
          supabase.from("certificates").select("*").eq("user_id", user.id),
          [],
        );

        const courses = await getCoursesByIds(rows.map((row) => row.course_id));

        return rows.map((row) => ({
          ...mapRow<Certificate>(row),
          course: courses.get(row.course_id),
        }));
      },
    },

    issue: {
      key: "certificates.issue",
      fn: async (args: any) => {
        const { data, error } = await supabase.rpc("issue_certificate", {
          p_course_id: args.courseId,
        });

        if (error) throw error;

        return data;
      },
    },
  },

  alumni: {
    getFeatured: {
      key: "alumni.getFeatured",
      fn: async () => listAlumniPosts({ featured: true, limit: 3 }),
    },

    list: {
      key: "alumni.list",
      fn: async () => ({
        page: await listAlumniPosts({ limit: 20 }),
        isDone: true,
        continueCursor: null,
      }),
    },

    getTopMembers: {
      key: "alumni.getTopMembers",
      fn: async () => [],
    },

    hasLiked: {
      key: "alumni.hasLiked",
      fn: async (args: any) => {
        const user = await currentUser();

        if (!user) return false;

        const row = await run<any | null>(
          "alumni_likes.hasLiked",
          supabase
            .from("alumni_likes")
            .select("id")
            .eq("post_id", args.postId)
            .eq("user_id", user.id)
            .maybeSingle(),
          null,
        );

        return Boolean(row);
      },
    },

    toggleLike: {
      key: "alumni.toggleLike",
      fn: async (args: any) => {
        const rpcResult = await supabase.rpc("toggle_alumni_like", {
          p_post_id: args.postId,
        });

        if (!rpcResult.error) return rpcResult.data;

        warnSupabase("alumni.toggleLike.rpcFallback", rpcResult.error);

        const user = await requireUser();

        const existing = await run<any | null>(
          "alumni_likes.existing",
          supabase
            .from("alumni_likes")
            .select("id")
            .eq("post_id", args.postId)
            .eq("user_id", user.id)
            .maybeSingle(),
          null,
        );

        if (existing) {
          const { error } = await supabase
            .from("alumni_likes")
            .delete()
            .eq("id", existing.id);

          if (error) throw error;

          return false;
        }

        const { error } = await supabase.from("alumni_likes").insert({
          post_id: args.postId,
          user_id: user.id,
        });

        if (error) throw error;

        return true;
      },
    },

    getComments: {
      key: "alumni.getComments",
      fn: async (args: any) => {
        const rows = await run<any[]>(
          "alumni_comments.byPost",
          supabase
            .from("alumni_comments")
            .select("*")
            .eq("post_id", args.postId)
            .order("created_at", { ascending: true }),
          [],
        );

        const profiles = await getProfilesByIds(rows.map((row) => row.user_id));

        return rows.map((row) => ({
          ...mapRow<AlumniComment>(row),
          user: profiles.get(row.user_id),
        }));
      },
    },

    addComment: {
      key: "alumni.addComment",
      fn: async (args: any) => {
        const user = await requireUser();

        const { data, error } = await supabase
          .from("alumni_comments")
          .insert({
            post_id: args.postId,
            user_id: user.id,
            content: args.content,
          })
          .select()
          .single();

        if (error) throw error;

        return data.id;
      },
    },

    createPost: {
      key: "alumni.createPost",
      fn: async (args: any) => {
        const user = await requireUser();

        const { data, error } = await supabase
          .from("alumni_posts")
          .insert({
            user_id: user.id,
            title: args.title,
            content: args.content,
            post_type: args.postType,
            media_url: args.mediaUrl,
            course_id: args.courseId,
            is_published: true,
          })
          .select()
          .single();

        if (error) throw error;

        return data.id;
      },
    },

    seedAlumni: {
      key: "alumni.seedAlumni",
      fn: async () => "Run the Supabase seed SQL file in the Supabase SQL Editor.",
    },
  },
};

export function useSupabaseQueryResult<TData = any>(
  descriptor: Descriptor<TData>,
  args?: any,
) {
  const enabled = args !== "skip";

  const query = useRQQuery({
    queryKey: [descriptor.key, args],
    queryFn: () => descriptor.fn(args),
    enabled,
    retry: 1,
  });

  useEffect(() => {
    if (query.error) {
      console.error(
        `Supabase query failed: ${descriptor.key}: ${formatQueryError(query.error)}`,
      );
    }
  }, [descriptor.key, query.error]);

  return {
    ...query,
    data: enabled ? query.data : undefined,
    error: query.error,
    isError: enabled && query.isError,
    isLoading: enabled && query.isLoading,
  };
}

export function useSupabaseQuery<TData = any>(
  descriptor: Descriptor<TData>,
  args?: any,
): TData | undefined {
  return useSupabaseQueryResult(descriptor, args).data;
}

export function useSupabaseMutation<T extends (...args: any[]) => Promise<any>>(
  descriptor: Descriptor,
): T {
  const queryClient = useQueryClient();

  const mutation = useRQMutation({
    mutationFn: (args: any) => descriptor.fn(args),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return ((args?: any) => mutation.mutateAsync(args)) as T;
}

export function usePaginatedQuery(
  descriptor: Descriptor,
  args?: any,
  _options?: any,
) {
  const query = useSupabaseQueryResult(descriptor, args);
  const data = query.data;

  return {
    results: data?.page ?? [],
    status: query.isLoading ? "LoadingFirstPage" : "Exhausted",
    loadMore: () => undefined,
    error: query.error,
    ...(data ?? {}),
  };
}

export function Authenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  return !isLoading && isAuthenticated ? <>{children}</> : null;
}

export function Unauthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  return !isLoading && !isAuthenticated ? <>{children}</> : null;
}

export function AuthLoading({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  return isLoading ? <>{children}</> : null;
}
