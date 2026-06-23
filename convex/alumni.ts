import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// Helper to get current user
async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("alumniPosts")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(6);

    return await Promise.all(
      posts.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, user };
      })
    );
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    postType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("alumniPosts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc");

    const results = await q.paginate(args.paginationOpts);

    let page = results.page;
    if (args.postType && args.postType !== "all") {
      page = page.filter((p) => p.postType === args.postType);
    }

    const enriched = await Promise.all(
      page.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, user };
      })
    );

    return { ...results, page: enriched };
  },
});

export const getComments = query({
  args: { postId: v.id("alumniPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("alumniComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .take(50);

    return await Promise.all(
      comments.map(async (c) => {
        const user = await ctx.db.get(c.userId);
        return { ...c, user };
      })
    );
  },
});

export const hasLiked = query({
  args: { postId: v.id("alumniPosts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return false;
    const like = await ctx.db
      .query("alumniLikes")
      .withIndex("by_user_and_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();
    return !!like;
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    postType: v.string(),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    return await ctx.db.insert("alumniPosts", {
      userId: user._id,
      title: args.title,
      content: args.content,
      postType: args.postType,
      mediaUrl: args.mediaUrl,
      isPublished: true,
      isFeatured: false,
      likeCount: 0,
      commentCount: 0,
    });
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("alumniPosts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const commentId = await ctx.db.insert("alumniComments", {
      postId: args.postId,
      userId: user._id,
      content: args.content,
      likeCount: 0,
    });

    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, { commentCount: (post.commentCount ?? 0) + 1 });
    }

    return commentId;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("alumniPosts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });

    const existing = await ctx.db
      .query("alumniLikes")
      .withIndex("by_user_and_post", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError({ message: "Post not found", code: "NOT_FOUND" });

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { likeCount: Math.max(0, post.likeCount - 1) });
      return false;
    } else {
      await ctx.db.insert("alumniLikes", { postId: args.postId, userId: user._id });
      await ctx.db.patch(args.postId, { likeCount: post.likeCount + 1 });
      return true;
    }
  },
});

export const getTopMembers = query({
  args: {},
  handler: async (ctx) => {
    // Get users who have posted in the community
    const posts = await ctx.db
      .query("alumniPosts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .take(100);

    const userMap = new Map<string, { user: Awaited<ReturnType<typeof ctx.db.get>>; postCount: number; totalLikes: number }>();

    for (const post of posts) {
      const key = post.userId;
      const existing = userMap.get(key);
      if (existing) {
        existing.postCount++;
        existing.totalLikes += post.likeCount;
      } else {
        const user = await ctx.db.get(post.userId);
        userMap.set(key, { user, postCount: 1, totalLikes: post.likeCount });
      }
    }

    return Array.from(userMap.values())
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10);
  },
});

export const seedAlumni = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("alumniPosts").first();
    if (existing) return "already seeded";

    const alumniData = [
      { name: "Fatima Al-Hassan", title: "Python changed my career!", story: "I completed the Python course in just 7 days and landed my first freelance gig within a month. EIHE changed my life! The structured approach made it so easy to follow.", type: "win", mediaUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=400&q=80" },
      { name: "James Okonkwo", title: "300% business growth from Digital Marketing", story: "The Digital Marketing course gave me the skills to grow my family business online by 300%. Thank you EIHE! I've now started coaching others in my community.", type: "win", mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
      { name: "Priya Sharma", title: "Learning graphic design at 65", story: "As a retired teacher, I never thought I could learn graphic design at 65. EIHE made it accessible and fun! Now I create all my community club posters.", type: "story", mediaUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
      { name: "Carlos Mendoza", title: "Built my first website for a local business", story: "Built my first website after the HTML & CSS course. Now I'm helping local businesses in my community. Three clients so far in just 2 months!", type: "resource", mediaUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
      { name: "Aisha Mohammed", title: "Got promoted thanks to English Communication", story: "The English Communication course boosted my confidence so much. I got promoted at work thanks to my improved presentations. Highly recommend!", type: "win", mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" },
      { name: "Takeshi Yamamoto", title: "Mindfulness transformed my daily routine", story: "7 days of mindfulness practice transformed my daily routine. I now meditate every morning. The EIHE course was the best investment in myself.", type: "discussion", mediaUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
      { name: "Ibrahim Ali", title: "Question: Best way to practice Python daily?", story: "I just finished the Python course and want to keep learning. What are the best free platforms to practice Python daily? Any tips from fellow graduates?", type: "question", mediaUrl: undefined },
      { name: "Mariam Hassan", title: "Free resources for graphic design", story: "I've compiled a list of free tools and resources that complement the EIHE graphic design course: Canva, Figma free plan, Adobe Color, Google Fonts, and Unsplash. Check them out!", type: "resource", mediaUrl: undefined },
    ];

    for (const alumni of alumniData) {
      const userId = await ctx.db.insert("users", {
        tokenIdentifier: `alumni_demo_${alumni.name.replace(/\s/g, "_")}`,
        name: alumni.name,
        role: "alumni",
      });

      await ctx.db.insert("alumniPosts", {
        userId,
        title: alumni.title,
        content: alumni.story,
        mediaUrl: alumni.mediaUrl,
        postType: alumni.type,
        isPublished: true,
        isFeatured: alumni.type === "win" || alumni.type === "story",
        likeCount: Math.floor(Math.random() * 200) + 20,
        commentCount: Math.floor(Math.random() * 30) + 2,
      });
    }

    return "seeded";
  },
});
