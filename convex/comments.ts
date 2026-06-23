import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .order("desc")
      .collect();

    return await Promise.all(
      comments.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return { ...c, user };
      })
    );
  },
});

export const add = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("comments", {
      userId: user._id,
      lessonId: args.lessonId,
      courseId: args.courseId,
      parentId: args.parentId,
      content: args.content,
      isPinned: false,
      likeCount: 0,
    });
  },
});

export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== user._id && user.role !== "admin") throw new Error("Unauthorized");

    await ctx.db.delete(args.commentId);
  },
});
