import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return "already seeded";

    const cats = [
      { name: "Technology & Computing", slug: "technology", icon: "💻", color: "from-blue-500 to-cyan-400", description: "Coding, AI, web dev, cybersecurity", sortOrder: 1 },
      { name: "Business & Entrepreneurship", slug: "business", icon: "📈", color: "from-green-500 to-emerald-400", description: "Finance, marketing, leadership", sortOrder: 2 },
      { name: "Arts & Creativity", slug: "arts", icon: "🎨", color: "from-purple-500 to-pink-400", description: "Design, photography, music", sortOrder: 3 },
      { name: "Health & Wellness", slug: "health", icon: "🌿", color: "from-teal-500 to-green-400", description: "Nutrition, fitness, mental health", sortOrder: 4 },
      { name: "Languages", slug: "languages", icon: "🌍", color: "from-orange-500 to-yellow-400", description: "English, Arabic, French, Mandarin", sortOrder: 5 },
      { name: "Science & Environment", slug: "science", icon: "🔬", color: "from-indigo-500 to-blue-400", description: "Biology, chemistry, climate", sortOrder: 6 },
      { name: "Social Sciences", slug: "social-sciences", icon: "🤝", color: "from-rose-500 to-pink-400", description: "Psychology, sociology, law", sortOrder: 7 },
      { name: "Life Skills", slug: "life-skills", icon: "⭐", color: "from-amber-500 to-orange-400", description: "Communication, time management", sortOrder: 8 },
      { name: "Mathematics", slug: "mathematics", icon: "🔢", color: "from-violet-500 to-purple-400", description: "Algebra, statistics, calculus", sortOrder: 9 },
      { name: "History & Culture", slug: "history", icon: "🏛️", color: "from-yellow-600 to-amber-400", description: "World history, civilizations", sortOrder: 10 },
      { name: "Environment & Sustainability", slug: "environment", icon: "🌱", color: "from-lime-500 to-green-400", description: "Climate, ecology, green living", sortOrder: 11 },
      { name: "Personal Development", slug: "personal-development", icon: "🚀", color: "from-fuchsia-500 to-pink-400", description: "Mindset, productivity, habits", sortOrder: 12 },
    ];

    for (const cat of cats) {
      await ctx.db.insert("categories", { ...cat, courseCount: 0 });
    }
    return "seeded";
  },
});
