import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(v.string()), // "student" | "instructor" | "admin"
    bio: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.string(),
    color: v.string(), // tailwind gradient class or hex
    courseCount: v.number(),
    sortOrder: v.number(),
  }).index("by_slug", ["slug"]),

  courses: defineTable({
    title: v.string(),
    slug: v.string(),
    shortDescription: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    categoryId: v.id("categories"),
    instructorId: v.optional(v.id("users")),
    instructorName: v.string(),
    level: v.string(), // "beginner" | "intermediate" | "advanced" | "all_levels"
    language: v.string(),
    durationDays: v.number(), // always 7
    totalLessons: v.number(),
    isPublished: v.boolean(),
    isFeatured: v.boolean(),
    tags: v.array(v.string()),
    whatYouLearn: v.array(v.string()),
    enrolledCount: v.number(),
    ratingAverage: v.number(),
    ratingCount: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_featured", ["isFeatured"])
    .index("by_published", ["isPublished"]),

  courseDays: defineTable({
    courseId: v.id("courses"),
    dayNumber: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
  }).index("by_course", ["courseId"]),

  lessons: defineTable({
    courseId: v.id("courses"),
    dayId: v.id("courseDays"),
    title: v.string(),
    description: v.optional(v.string()),
    contentType: v.string(), // "video" | "text" | "quiz" | "assignment"
    contentUrl: v.optional(v.string()),
    contentText: v.optional(v.string()),
    durationMinutes: v.number(),
    isPreview: v.boolean(),
    sortOrder: v.number(),
    // Dhivehi (ދިވެހި) translations
    dhivehiTitle: v.optional(v.string()),
    dhivehiDescription: v.optional(v.string()),
    dhivehiContentText: v.optional(v.string()),
  })
    .index("by_course", ["courseId"])
    .index("by_day", ["dayId"]),

  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    status: v.string(), // "active" | "completed" | "dropped"
    progressPercentage: v.number(),
    completedAt: v.optional(v.string()),
    lastAccessedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_course", ["courseId"])
    .index("by_user_and_course", ["userId", "courseId"]),

  lessonProgress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
    lastPositionSeconds: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_course", ["userId", "courseId"])
    .index("by_user_and_lesson", ["userId", "lessonId"]),

  comments: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    parentId: v.optional(v.id("comments")),
    content: v.string(),
    isPinned: v.boolean(),
    likeCount: v.number(),
  })
    .index("by_lesson", ["lessonId"])
    .index("by_user", ["userId"]),

  submissions: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    status: v.string(), // "submitted" | "reviewed" | "approved" | "rejected"
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_lesson", ["lessonId"])
    .index("by_course", ["courseId"]),

  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    certificateNumber: v.string(),
    issuedAt: v.string(),
    courseTitle: v.string(),
    userName: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_course", ["userId", "courseId"]),

  reviews: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    rating: v.number(),
    review: v.optional(v.string()),
  })
    .index("by_course", ["courseId"])
    .index("by_user_and_course", ["userId", "courseId"]),

  alumniPosts: defineTable({
    userId: v.id("users"),
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    postType: v.string(), // "discussion" | "win" | "question" | "resource" | "story" | "project" | "testimonial" | "achievement"
    isPublished: v.boolean(),
    isFeatured: v.boolean(),
    likeCount: v.number(),
    commentCount: v.optional(v.number()),
  })
    .index("by_published", ["isPublished"])
    .index("by_featured", ["isFeatured"])
    .index("by_user", ["userId"]),

  alumniComments: defineTable({
    postId: v.id("alumniPosts"),
    userId: v.id("users"),
    content: v.string(),
    likeCount: v.number(),
  }).index("by_post", ["postId"]),

  alumniLikes: defineTable({
    postId: v.id("alumniPosts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),
});
