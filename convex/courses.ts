import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("courses").withIndex("by_published", (q) => q.eq("isPublished", true));
    const results = await q.order("desc").paginate(args.paginationOpts);
    let page = results.page;
    if (args.categoryId) {
      page = page.filter((c) => c.categoryId === args.categoryId);
    }
    if (args.featured) {
      page = page.filter((c) => c.isFeatured);
    }
    return { ...results, page };
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .take(6);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getById = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

export const getByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("courses")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    if (!args.query.trim()) return all;
    const lower = args.query.toLowerCase();
    return all
      .filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.shortDescription.toLowerCase().includes(lower) ||
          c.tags.some((t) => t.toLowerCase().includes(lower))
      )
      .slice(0, 50);
  },
});

export const getCourseDays = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseDays")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const getLessons = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const getLessonsByDay = query({
  args: { dayId: v.id("courseDays") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_day", (q) => q.eq("dayId", args.dayId))
      .collect();
  },
});

export const createCourse = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    shortDescription: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    categoryId: v.id("categories"),
    instructorName: v.string(),
    level: v.string(),
    language: v.string(),
    tags: v.array(v.string()),
    whatYouLearn: v.array(v.string()),
    isFeatured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Unauthorized");

    const id = await ctx.db.insert("courses", {
      ...args,
      instructorId: user._id,
      durationDays: 7,
      totalLessons: 0,
      isPublished: false,
      enrolledCount: 0,
      ratingAverage: 0,
      ratingCount: 0,
    });

    // Update category count
    const cat = await ctx.db.get(args.categoryId);
    if (cat) {
      await ctx.db.patch(args.categoryId, { courseCount: cat.courseCount + 1 });
    }

    return id;
  },
});

export const updateLessonDhivehi = mutation({
  args: {
    lessonId: v.id("lessons"),
    dhivehiTitle: v.optional(v.string()),
    dhivehiDescription: v.optional(v.string()),
    dhivehiContentText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Unauthorized");
    const { lessonId, ...patch } = args;
    await ctx.db.patch(lessonId, patch);
  },
});

export const getLessonById = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lessonId);
  },
});

export const publishCourse = mutation({
  args: { courseId: v.id("courses"), isPublished: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Unauthorized");
    await ctx.db.patch(args.courseId, { isPublished: args.isPublished });
  },
});

export const seedCourses = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("courses").first();
    if (existing) return "already seeded";

    const categories = await ctx.db.query("categories").collect();
    if (categories.length === 0) return "no categories";

    const catMap: Record<string, string> = {};
    for (const c of categories) {
      catMap[c.slug] = c._id;
    }

    const sampleCourses = [
      // Technology
      { title: "Introduction to Python Programming", slug: "intro-python", shortDescription: "Learn Python from scratch in 7 days. Build your first programs.", categorySlug: "technology", level: "beginner", tags: ["python", "coding", "programming"], whatYouLearn: ["Python syntax", "Variables & data types", "Functions & loops", "File handling"], isFeatured: true },
      { title: "Web Development with HTML & CSS", slug: "html-css-basics", shortDescription: "Build beautiful websites from scratch in one week.", categorySlug: "technology", level: "beginner", tags: ["html", "css", "web"], whatYouLearn: ["HTML structure", "CSS styling", "Flexbox layout", "Responsive design"], isFeatured: true },
      { title: "JavaScript for Beginners", slug: "javascript-beginners", shortDescription: "Master the language of the web in 7 focused days.", categorySlug: "technology", level: "beginner", tags: ["javascript", "web", "coding"], whatYouLearn: ["JS fundamentals", "DOM manipulation", "Events", "Fetch API"], isFeatured: false },
      { title: "Introduction to Artificial Intelligence", slug: "intro-ai", shortDescription: "Understand AI concepts, machine learning, and its real-world applications.", categorySlug: "technology", level: "all_levels", tags: ["ai", "machine learning", "tech"], whatYouLearn: ["What is AI", "ML basics", "Neural networks intro", "AI ethics"], isFeatured: true },
      { title: "Cybersecurity Fundamentals", slug: "cybersecurity-fundamentals", shortDescription: "Protect yourself and your data online with core security principles.", categorySlug: "technology", level: "beginner", tags: ["security", "cyber", "tech"], whatYouLearn: ["Threats & attacks", "Password security", "Safe browsing", "Data protection"], isFeatured: false },
      { title: "Excel & Spreadsheets Mastery", slug: "excel-mastery", shortDescription: "From basics to advanced formulas and data analysis in Excel.", categorySlug: "technology", level: "intermediate", tags: ["excel", "spreadsheet", "data"], whatYouLearn: ["Formulas & functions", "Pivot tables", "Charts", "Data validation"], isFeatured: false },
      // Business
      { title: "Starting Your First Business", slug: "start-first-business", shortDescription: "From idea to launch: a practical 7-day startup guide.", categorySlug: "business", level: "beginner", tags: ["startup", "entrepreneurship", "business"], whatYouLearn: ["Business idea validation", "Business model canvas", "Basic finance", "Marketing basics"], isFeatured: true },
      { title: "Digital Marketing Essentials", slug: "digital-marketing", shortDescription: "Grow your brand online with proven digital marketing strategies.", categorySlug: "business", level: "beginner", tags: ["marketing", "social media", "seo"], whatYouLearn: ["SEO basics", "Social media marketing", "Email campaigns", "Analytics"], isFeatured: false },
      { title: "Personal Finance & Budgeting", slug: "personal-finance", shortDescription: "Take control of your money and build financial security.", categorySlug: "business", level: "all_levels", tags: ["finance", "budgeting", "money"], whatYouLearn: ["Budgeting methods", "Saving strategies", "Investment basics", "Debt management"], isFeatured: false },
      // Arts
      { title: "Introduction to Graphic Design", slug: "intro-graphic-design", shortDescription: "Learn design principles and create stunning visuals.", categorySlug: "arts", level: "beginner", tags: ["design", "graphics", "creative"], whatYouLearn: ["Design principles", "Color theory", "Typography", "Layout basics"], isFeatured: true },
      { title: "Photography for Everyone", slug: "photography-basics", shortDescription: "Capture stunning photos with any camera or smartphone.", categorySlug: "arts", level: "all_levels", tags: ["photography", "camera", "creative"], whatYouLearn: ["Composition rules", "Lighting", "Editing basics", "Storytelling"], isFeatured: false },
      { title: "Creative Writing Workshop", slug: "creative-writing", shortDescription: "Unlock your storytelling potential in this 7-day writing journey.", categorySlug: "arts", level: "all_levels", tags: ["writing", "storytelling", "creative"], whatYouLearn: ["Story structure", "Character development", "Dialogue writing", "Editing skills"], isFeatured: false },
      // Health
      { title: "Mindfulness & Stress Management", slug: "mindfulness-basics", shortDescription: "Find calm and reduce stress with proven mindfulness techniques.", categorySlug: "health", level: "all_levels", tags: ["mindfulness", "stress", "wellness"], whatYouLearn: ["Breathing techniques", "Meditation basics", "Stress triggers", "Daily practice"], isFeatured: true },
      { title: "Nutrition & Healthy Eating", slug: "nutrition-basics", shortDescription: "Understand food science and build healthier eating habits.", categorySlug: "health", level: "beginner", tags: ["nutrition", "diet", "health"], whatYouLearn: ["Macronutrients", "Meal planning", "Reading labels", "Healthy swaps"], isFeatured: false },
      { title: "Home Fitness in 7 Days", slug: "home-fitness", shortDescription: "Get fit from your living room with no equipment needed.", categorySlug: "health", level: "all_levels", tags: ["fitness", "exercise", "health"], whatYouLearn: ["Warm-up routines", "Strength basics", "Cardio workouts", "Stretching"], isFeatured: false },
      // Languages
      { title: "English Communication Skills", slug: "english-communication", shortDescription: "Boost your spoken and written English confidence in 7 days.", categorySlug: "languages", level: "intermediate", tags: ["english", "communication", "language"], whatYouLearn: ["Pronunciation tips", "Grammar essentials", "Email writing", "Presentation skills"], isFeatured: true },
      { title: "Arabic for Beginners", slug: "arabic-beginners", shortDescription: "Start your Arabic language journey with daily lessons.", categorySlug: "languages", level: "beginner", tags: ["arabic", "language", "culture"], whatYouLearn: ["Arabic alphabet", "Basic phrases", "Numbers & days", "Simple conversation"], isFeatured: false },
      { title: "French Essentials", slug: "french-essentials", shortDescription: "Learn the most useful French for travel and daily life.", categorySlug: "languages", level: "beginner", tags: ["french", "language", "europe"], whatYouLearn: ["Greetings", "Vocabulary essentials", "Verb conjugation basics", "Travel phrases"], isFeatured: false },
      // Science
      { title: "Climate Change & Our Future", slug: "climate-change", shortDescription: "Understand climate science and what we can do about it.", categorySlug: "science", level: "all_levels", tags: ["climate", "environment", "science"], whatYouLearn: ["Climate basics", "Greenhouse gases", "Global impacts", "Individual actions"], isFeatured: false },
      { title: "Human Biology Made Simple", slug: "human-biology", shortDescription: "Explore the human body systems in an engaging 7-day course.", categorySlug: "science", level: "beginner", tags: ["biology", "anatomy", "science"], whatYouLearn: ["Body systems", "Cell biology", "Genetics intro", "Health connections"], isFeatured: false },
      // Personal Development
      { title: "Productivity & Time Management", slug: "productivity-time", shortDescription: "Master your time and get more done with less stress.", categorySlug: "personal-development", level: "all_levels", tags: ["productivity", "time", "habits"], whatYouLearn: ["Goal setting", "Prioritization", "Focus techniques", "Energy management"], isFeatured: true },
      { title: "Public Speaking Confidence", slug: "public-speaking", shortDescription: "Overcome fear and speak with confidence in any setting.", categorySlug: "personal-development", level: "all_levels", tags: ["speaking", "confidence", "communication"], whatYouLearn: ["Overcoming anxiety", "Speech structure", "Body language", "Audience connection"], isFeatured: false },
      { title: "Critical Thinking Skills", slug: "critical-thinking", shortDescription: "Think more clearly, solve problems, and make better decisions.", categorySlug: "personal-development", level: "all_levels", tags: ["thinking", "problem solving", "logic"], whatYouLearn: ["Logical reasoning", "Bias awareness", "Problem frameworks", "Decision making"], isFeatured: false },
      // Life Skills
      { title: "Cooking Basics for Everyone", slug: "cooking-basics", shortDescription: "Learn essential cooking skills and healthy recipes from scratch.", categorySlug: "life-skills", level: "beginner", tags: ["cooking", "food", "life skills"], whatYouLearn: ["Kitchen safety", "Basic techniques", "Meal prep", "Recipe reading"], isFeatured: false },
      { title: "Financial Literacy for Teens", slug: "financial-literacy-teens", shortDescription: "Smart money skills for young people just starting out.", categorySlug: "life-skills", level: "beginner", tags: ["finance", "teens", "money"], whatYouLearn: ["Earning & saving", "Spending wisely", "Banking basics", "Future planning"], isFeatured: false },
    ];

    const thumbnails = [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    ];

    for (let i = 0; i < sampleCourses.length; i++) {
      const c = sampleCourses[i];
      const categoryId = catMap[c.categorySlug] as string;
      if (!categoryId) continue;

      const courseId = await ctx.db.insert("courses", {
        title: c.title,
        slug: c.slug,
        shortDescription: c.shortDescription,
        description: `${c.shortDescription} This 7-day course is designed to give you practical, actionable skills you can apply immediately.`,
        thumbnailUrl: thumbnails[i % thumbnails.length],
        categoryId: categoryId as Parameters<typeof ctx.db.insert>[1] extends { categoryId: infer T } ? T : never,
        instructorName: ["Dr. Sarah Chen", "Prof. Ahmed Hassan", "Emma Williams", "Dr. Raj Patel", "Maria Santos"][i % 5],
        level: c.level,
        language: "English",
        durationDays: 7,
        totalLessons: 14,
        isPublished: true,
        isFeatured: c.isFeatured,
        tags: c.tags,
        whatYouLearn: c.whatYouLearn,
        enrolledCount: Math.floor(Math.random() * 5000) + 200,
        ratingAverage: 4.2 + Math.random() * 0.7,
        ratingCount: Math.floor(Math.random() * 500) + 50,
      });

      // Create 7 course days
      const dayIds: string[] = [];
      const dayTitles = [
        "Getting Started & Foundations",
        "Core Concepts Deep Dive",
        "Practical Applications",
        "Hands-On Practice",
        "Advanced Techniques",
        "Real-World Projects",
        "Review, Reflect & Next Steps",
      ];
      for (let d = 1; d <= 7; d++) {
        const dayId = await ctx.db.insert("courseDays", {
          courseId,
          dayNumber: d,
          title: `Day ${d}: ${dayTitles[d - 1]}`,
          description: `Day ${d} activities and lessons for ${c.title}`,
        });
        dayIds.push(dayId);
      }

      // Create 2 lessons per day
      for (let d = 0; d < 7; d++) {
        for (let l = 0; l < 2; l++) {
          await ctx.db.insert("lessons", {
            courseId,
            dayId: dayIds[d] as Parameters<typeof ctx.db.insert>[1] extends { dayId: infer T } ? T : never,
            title: l === 0 ? `Lesson ${d * 2 + 1}: Core Learning` : `Lesson ${d * 2 + 2}: Practice & Apply`,
            description: "Interactive lesson with video and exercises.",
            contentType: l === 0 ? "video" : "text",
            contentUrl: l === 0 ? "https://www.youtube.com/embed/dQw4w9WgXcQ" : undefined,
            contentText: l === 1 ? `# Day ${d + 1} Practice\n\nComplete the following exercises to reinforce your learning from today's video lesson.\n\n## Exercise 1\nReflect on what you've learned so far.\n\n## Exercise 2\nApply the concepts in a real scenario.\n\n## Summary\nGreat work today! Keep up the momentum.` : undefined,
            durationMinutes: l === 0 ? 15 : 10,
            isPreview: d === 0 && l === 0,
            sortOrder: l,
          });
        }
      }
    }

    return "seeded";
  },
});
