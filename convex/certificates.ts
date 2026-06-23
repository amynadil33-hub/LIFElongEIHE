import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyCertificates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    const certs = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return await Promise.all(
      certs.map(async (c) => {
        const course = await ctx.db.get(c.courseId);
        return { ...c, course };
      })
    );
  },
});

export const issue = mutation({
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
      .query("certificates")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .unique();
    if (existing) return existing._id;

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const certNumber = `EIHE-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, "0")}`;

    return await ctx.db.insert("certificates", {
      userId: user._id,
      courseId: args.courseId,
      certificateNumber: certNumber,
      issuedAt: new Date().toISOString(),
      courseTitle: course.title,
      userName: user.name ?? "Student",
    });
  },
});

export const getByUserAndCourse = query({
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
      .query("certificates")
      .withIndex("by_user_and_course", (q) => q.eq("userId", user._id).eq("courseId", args.courseId))
      .unique();
  },
});
