import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const enroll = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .unique();

    if (existing) return existing._id;

    const id = await ctx.db.insert("enrollments", {
      userId: user._id,
      courseId: args.courseId,
      status: "active",
      progressPercentage: 0,
      lastAccessedAt: new Date().toISOString(),
    });

    const course = await ctx.db.get(args.courseId);
    if (course) {
      await ctx.db.patch(args.courseId, { enrolledCount: course.enrolledCount + 1 });
    }

    return id;
  },
});

export const getMyEnrollments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const result = await Promise.all(
      enrollments.map(async (e) => {
        const course = await ctx.db.get(e.courseId);
        return { ...e, course };
      })
    );

    return result;
  },
});

export const getEnrollment = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    return await ctx.db
      .query("enrollments")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .unique();
  },
});

export const updateProgress = mutation({
  args: { courseId: v.id("courses"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    // Mark lesson as completed
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_and_lesson", (q) => q.eq("userId", user._id).eq("lessonId", args.lessonId))
      .unique();

    if (!existing) {
      await ctx.db.insert("lessonProgress", {
        userId: user._id,
        lessonId: args.lessonId,
        courseId: args.courseId,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        lastPositionSeconds: 0,
      });
    } else if (!existing.isCompleted) {
      await ctx.db.patch(existing._id, { isCompleted: true, completedAt: new Date().toISOString() });
    }

    // Recalculate progress
    const totalLessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const completedLessons = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    const progress = totalLessons.length > 0 ? (completedLessons.length / totalLessons.length) * 100 : 0;

    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .unique();

    if (enrollment) {
      await ctx.db.patch(enrollment._id, {
        progressPercentage: Math.round(progress),
        lastAccessedAt: new Date().toISOString(),
        status: progress >= 100 ? "completed" : "active",
        completedAt: progress >= 100 ? new Date().toISOString() : undefined,
      });
    }

    return progress;
  },
});

export const getLessonProgress = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .collect();
  },
});
