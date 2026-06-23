import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("submissions", {
      userId: user._id,
      lessonId: args.lessonId,
      courseId: args.courseId,
      content: args.content,
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      status: "submitted",
    });
  },
});

export const getMySubmissions = query({
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
      .query("submissions")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
  },
});

export const getAllSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") return [];

    const submissions = await ctx.db.query("submissions").order("desc").take(50);
    return await Promise.all(
      submissions.map(async (s) => {
        const submUser = await ctx.db.get(s.userId);
        const course = await ctx.db.get(s.courseId);
        return { ...s, user: submUser, course };
      })
    );
  },
});

export const review = mutation({
  args: {
    submissionId: v.id("submissions"),
    status: v.string(),
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.submissionId, {
      status: args.status,
      grade: args.grade,
      feedback: args.feedback,
      reviewedBy: user._id,
      reviewedAt: new Date().toISOString(),
    });
  },
});
