-- EIHE Lifelong Learning Hub seed data for Supabase.
-- Run after supabase/migrations/20260622201300_initial_supabase_schema.sql.

begin;

insert into public.categories (name, slug, icon, color, description, sort_order, course_count)
values
  ('Technology & Computing', 'technology', '💻', 'from-blue-500 to-cyan-400', 'Coding, AI, web dev, cybersecurity', 1, 0),
  ('Business & Entrepreneurship', 'business', '📈', 'from-green-500 to-emerald-400', 'Finance, marketing, leadership', 2, 0),
  ('Arts & Creativity', 'arts', '🎨', 'from-purple-500 to-pink-400', 'Design, photography, music', 3, 0),
  ('Health & Wellness', 'health', '🌿', 'from-teal-500 to-green-400', 'Nutrition, fitness, mental health', 4, 0),
  ('Languages', 'languages', '🌍', 'from-orange-500 to-yellow-400', 'English, Arabic, French, Mandarin', 5, 0),
  ('Science & Environment', 'science', '🔬', 'from-indigo-500 to-blue-400', 'Biology, chemistry, climate', 6, 0),
  ('Social Sciences', 'social-sciences', '🤝', 'from-rose-500 to-pink-400', 'Psychology, sociology, law', 7, 0),
  ('Life Skills', 'life-skills', '⭐', 'from-amber-500 to-orange-400', 'Communication, time management', 8, 0),
  ('Mathematics', 'mathematics', '🔢', 'from-violet-500 to-purple-400', 'Algebra, statistics, calculus', 9, 0),
  ('History & Culture', 'history', '🏛️', 'from-yellow-600 to-amber-400', 'World history, civilizations', 10, 0),
  ('Environment & Sustainability', 'environment', '🌱', 'from-lime-500 to-green-400', 'Climate, ecology, green living', 11, 0),
  ('Personal Development', 'personal-development', '🚀', 'from-fuchsia-500 to-pink-400', 'Mindset, productivity, habits', 12, 0)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color,
  description = excluded.description,
  sort_order = excluded.sort_order;

do $$
declare
  course_item jsonb;
  v_course_id uuid;
  v_category_id uuid;
  v_day_id uuid;
  day_number integer;
  lesson_number integer;
  course_index integer := 0;
  day_titles text[] := array[
    'Getting Started & Foundations',
    'Core Concepts Deep Dive',
    'Practical Applications',
    'Hands-On Practice',
    'Advanced Techniques',
    'Real-World Projects',
    'Review, Reflect & Next Steps'
  ];
  thumbnails text[] := array[
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'
  ];
  instructors text[] := array['Dr. Sarah Chen', 'Prof. Ahmed Hassan', 'Emma Williams', 'Dr. Raj Patel', 'Maria Santos'];
begin
  for course_item in
    select * from jsonb_array_elements($courses$[
      {"title":"Introduction to Python Programming","slug":"intro-python","shortDescription":"Learn Python from scratch in 7 days. Build your first programs.","categorySlug":"technology","level":"beginner","tags":["python","coding","programming"],"whatYouLearn":["Python syntax","Variables & data types","Functions & loops","File handling"],"isFeatured":true},
      {"title":"Web Development with HTML & CSS","slug":"html-css-basics","shortDescription":"Build beautiful websites from scratch in one week.","categorySlug":"technology","level":"beginner","tags":["html","css","web"],"whatYouLearn":["HTML structure","CSS styling","Flexbox layout","Responsive design"],"isFeatured":true},
      {"title":"JavaScript for Beginners","slug":"javascript-beginners","shortDescription":"Master the language of the web in 7 focused days.","categorySlug":"technology","level":"beginner","tags":["javascript","web","coding"],"whatYouLearn":["JS fundamentals","DOM manipulation","Events","Fetch API"],"isFeatured":false},
      {"title":"Introduction to Artificial Intelligence","slug":"intro-ai","shortDescription":"Understand AI concepts, machine learning, and its real-world applications.","categorySlug":"technology","level":"all_levels","tags":["ai","machine learning","tech"],"whatYouLearn":["What is AI","ML basics","Neural networks intro","AI ethics"],"isFeatured":true},
      {"title":"Cybersecurity Fundamentals","slug":"cybersecurity-fundamentals","shortDescription":"Protect yourself and your data online with core security principles.","categorySlug":"technology","level":"beginner","tags":["security","cyber","tech"],"whatYouLearn":["Threats & attacks","Password security","Safe browsing","Data protection"],"isFeatured":false},
      {"title":"Excel & Spreadsheets Mastery","slug":"excel-mastery","shortDescription":"From basics to advanced formulas and data analysis in Excel.","categorySlug":"technology","level":"intermediate","tags":["excel","spreadsheet","data"],"whatYouLearn":["Formulas & functions","Pivot tables","Charts","Data validation"],"isFeatured":false},
      {"title":"Starting Your First Business","slug":"start-first-business","shortDescription":"From idea to launch: a practical 7-day startup guide.","categorySlug":"business","level":"beginner","tags":["startup","entrepreneurship","business"],"whatYouLearn":["Business idea validation","Business model canvas","Basic finance","Marketing basics"],"isFeatured":true},
      {"title":"Digital Marketing Essentials","slug":"digital-marketing","shortDescription":"Grow your brand online with proven digital marketing strategies.","categorySlug":"business","level":"beginner","tags":["marketing","social media","seo"],"whatYouLearn":["SEO basics","Social media marketing","Email campaigns","Analytics"],"isFeatured":false},
      {"title":"Personal Finance & Budgeting","slug":"personal-finance","shortDescription":"Take control of your money and build financial security.","categorySlug":"business","level":"all_levels","tags":["finance","budgeting","money"],"whatYouLearn":["Budgeting methods","Saving strategies","Investment basics","Debt management"],"isFeatured":false},
      {"title":"Introduction to Graphic Design","slug":"intro-graphic-design","shortDescription":"Learn design principles and create stunning visuals.","categorySlug":"arts","level":"beginner","tags":["design","graphics","creative"],"whatYouLearn":["Design principles","Color theory","Typography","Layout basics"],"isFeatured":true},
      {"title":"Photography for Everyone","slug":"photography-basics","shortDescription":"Capture stunning photos with any camera or smartphone.","categorySlug":"arts","level":"all_levels","tags":["photography","camera","creative"],"whatYouLearn":["Composition rules","Lighting","Editing basics","Storytelling"],"isFeatured":false},
      {"title":"Creative Writing Workshop","slug":"creative-writing","shortDescription":"Unlock your storytelling potential in this 7-day writing journey.","categorySlug":"arts","level":"all_levels","tags":["writing","storytelling","creative"],"whatYouLearn":["Story structure","Character development","Dialogue writing","Editing skills"],"isFeatured":false},
      {"title":"Mindfulness & Stress Management","slug":"mindfulness-basics","shortDescription":"Find calm and reduce stress with proven mindfulness techniques.","categorySlug":"health","level":"all_levels","tags":["mindfulness","stress","wellness"],"whatYouLearn":["Breathing techniques","Meditation basics","Stress triggers","Daily practice"],"isFeatured":true},
      {"title":"Nutrition & Healthy Eating","slug":"nutrition-basics","shortDescription":"Understand food science and build healthier eating habits.","categorySlug":"health","level":"beginner","tags":["nutrition","diet","health"],"whatYouLearn":["Macronutrients","Meal planning","Reading labels","Healthy swaps"],"isFeatured":false},
      {"title":"Home Fitness in 7 Days","slug":"home-fitness","shortDescription":"Get fit from your living room with no equipment needed.","categorySlug":"health","level":"all_levels","tags":["fitness","exercise","health"],"whatYouLearn":["Warm-up routines","Strength basics","Cardio workouts","Stretching"],"isFeatured":false},
      {"title":"English Communication Skills","slug":"english-communication","shortDescription":"Boost your spoken and written English confidence in 7 days.","categorySlug":"languages","level":"intermediate","tags":["english","communication","language"],"whatYouLearn":["Pronunciation tips","Grammar essentials","Email writing","Presentation skills"],"isFeatured":true},
      {"title":"Arabic for Beginners","slug":"arabic-beginners","shortDescription":"Start your Arabic language journey with daily lessons.","categorySlug":"languages","level":"beginner","tags":["arabic","language","culture"],"whatYouLearn":["Arabic alphabet","Basic phrases","Numbers & days","Simple conversation"],"isFeatured":false},
      {"title":"French Essentials","slug":"french-essentials","shortDescription":"Learn the most useful French for travel and daily life.","categorySlug":"languages","level":"beginner","tags":["french","language","europe"],"whatYouLearn":["Greetings","Vocabulary essentials","Verb conjugation basics","Travel phrases"],"isFeatured":false},
      {"title":"Climate Change & Our Future","slug":"climate-change","shortDescription":"Understand climate science and what we can do about it.","categorySlug":"science","level":"all_levels","tags":["climate","environment","science"],"whatYouLearn":["Climate basics","Greenhouse gases","Global impacts","Individual actions"],"isFeatured":false},
      {"title":"Human Biology Made Simple","slug":"human-biology","shortDescription":"Explore the human body systems in an engaging 7-day course.","categorySlug":"science","level":"beginner","tags":["biology","anatomy","science"],"whatYouLearn":["Body systems","Cell biology","Genetics intro","Health connections"],"isFeatured":false},
      {"title":"Productivity & Time Management","slug":"productivity-time","shortDescription":"Master your time and get more done with less stress.","categorySlug":"personal-development","level":"all_levels","tags":["productivity","time","habits"],"whatYouLearn":["Goal setting","Prioritization","Focus techniques","Energy management"],"isFeatured":true},
      {"title":"Public Speaking Confidence","slug":"public-speaking","shortDescription":"Overcome fear and speak with confidence in any setting.","categorySlug":"personal-development","level":"all_levels","tags":["speaking","confidence","communication"],"whatYouLearn":["Overcoming anxiety","Speech structure","Body language","Audience connection"],"isFeatured":false},
      {"title":"Critical Thinking Skills","slug":"critical-thinking","shortDescription":"Think more clearly, solve problems, and make better decisions.","categorySlug":"personal-development","level":"all_levels","tags":["thinking","problem solving","logic"],"whatYouLearn":["Logical reasoning","Bias awareness","Problem frameworks","Decision making"],"isFeatured":false},
      {"title":"Cooking Basics for Everyone","slug":"cooking-basics","shortDescription":"Learn essential cooking skills and healthy recipes from scratch.","categorySlug":"life-skills","level":"beginner","tags":["cooking","food","life skills"],"whatYouLearn":["Kitchen safety","Basic techniques","Meal prep","Recipe reading"],"isFeatured":false},
      {"title":"Financial Literacy for Teens","slug":"financial-literacy-teens","shortDescription":"Smart money skills for young people just starting out.","categorySlug":"life-skills","level":"beginner","tags":["finance","teens","money"],"whatYouLearn":["Earning & saving","Spending wisely","Banking basics","Future planning"],"isFeatured":false}
    ]$courses$::jsonb)
  loop
    course_index := course_index + 1;
    select id into v_category_id from public.categories where slug = course_item->>'categorySlug';

    insert into public.courses (
      title, slug, short_description, description, thumbnail_url, category_id, instructor_name,
      level, language, duration_days, total_lessons, is_published, is_featured, tags, what_you_learn,
      enrolled_count, rating_average, rating_count
    ) values (
      course_item->>'title',
      course_item->>'slug',
      course_item->>'shortDescription',
      (course_item->>'shortDescription') || ' This 7-day course is designed to give you practical, actionable skills you can apply immediately.',
      thumbnails[((course_index - 1) % array_length(thumbnails, 1)) + 1],
      v_category_id,
      instructors[((course_index - 1) % array_length(instructors, 1)) + 1],
      course_item->>'level',
      'English',
      7,
      14,
      true,
      (course_item->>'isFeatured')::boolean,
      array(select jsonb_array_elements_text(course_item->'tags')),
      array(select jsonb_array_elements_text(course_item->'whatYouLearn')),
      200 + (course_index * 173),
      round((4.2 + ((course_index % 7)::numeric / 10))::numeric, 2),
      50 + (course_index * 19)
    )
    on conflict (slug) do update set
      title = excluded.title,
      short_description = excluded.short_description,
      description = excluded.description,
      thumbnail_url = excluded.thumbnail_url,
      category_id = excluded.category_id,
      instructor_name = excluded.instructor_name,
      level = excluded.level,
      language = excluded.language,
      duration_days = excluded.duration_days,
      total_lessons = excluded.total_lessons,
      is_published = excluded.is_published,
      is_featured = excluded.is_featured,
      tags = excluded.tags,
      what_you_learn = excluded.what_you_learn,
      enrolled_count = excluded.enrolled_count,
      rating_average = excluded.rating_average,
      rating_count = excluded.rating_count,
      updated_at = now()
    returning id into v_course_id;

    for day_number in 1..7 loop
      insert into public.course_days (course_id, day_number, title, description)
      values (
        v_course_id,
        day_number,
        'Day ' || day_number || ': ' || day_titles[day_number],
        'Day ' || day_number || ' activities and lessons for ' || (course_item->>'title')
      )
      on conflict (course_id, day_number) do update set
        title = excluded.title,
        description = excluded.description
      returning id into v_day_id;

      for lesson_number in 1..2 loop
        if not exists (
          select 1 from public.lessons
          where public.lessons.course_id = v_course_id
            and public.lessons.day_id = v_day_id
            and sort_order = lesson_number - 1
        ) then
          insert into public.lessons (
            course_id, day_id, title, description, content_type, content_url, content_text,
            duration_minutes, is_preview, sort_order
          ) values (
            v_course_id,
            v_day_id,
            case when lesson_number = 1
              then 'Lesson ' || (((day_number - 1) * 2) + 1) || ': Core Learning'
              else 'Lesson ' || (((day_number - 1) * 2) + 2) || ': Practice & Apply'
            end,
            'Interactive lesson with video and exercises.',
            case when lesson_number = 1 then 'video' else 'text' end,
            case when lesson_number = 1 then 'https://www.youtube.com/embed/dQw4w9WgXcQ' else null end,
            case when lesson_number = 2 then '# Day ' || day_number || ' Practice

Complete the following exercises to reinforce your learning from today''s video lesson.

## Exercise 1
Reflect on what you''ve learned so far.

## Exercise 2
Apply the concepts in a real scenario.

## Summary
Great work today! Keep up the momentum.' else null end,
            case when lesson_number = 1 then 15 else 10 end,
            day_number = 1 and lesson_number = 1,
            lesson_number - 1
          );
        end if;
      end loop;
    end loop;
  end loop;
end $$;

update public.categories c
set course_count = course_totals.total
from (
  select category_id, count(*)::integer as total
  from public.courses
  group by category_id
) course_totals
where c.id = course_totals.category_id;

do $$
declare
  seed_user_id uuid;
  alumni_item jsonb;
begin
  select id into seed_user_id from public.profiles order by created_at limit 1;

  if seed_user_id is null then
    raise notice 'Skipping alumni seed posts because no profile exists. Sign in once, then rerun this seed file to add alumni posts.';
    return;
  end if;

  for alumni_item in
    select * from jsonb_array_elements($alumni$[
      {"title":"Python changed my career!","content":"I completed the Python course in just 7 days and landed my first freelance gig within a month. EIHE changed my life! The structured approach made it so easy to follow.","postType":"win","mediaUrl":"https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=400&q=80","likeCount":120,"commentCount":14},
      {"title":"300% business growth from Digital Marketing","content":"The Digital Marketing course gave me the skills to grow my family business online by 300%. Thank you EIHE! I've now started coaching others in my community.","postType":"win","mediaUrl":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80","likeCount":150,"commentCount":18},
      {"title":"Learning graphic design at 65","content":"As a retired teacher, I never thought I could learn graphic design at 65. EIHE made it accessible and fun! Now I create all my community club posters.","postType":"story","mediaUrl":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80","likeCount":98,"commentCount":9},
      {"title":"Built my first website for a local business","content":"Built my first website after the HTML & CSS course. Now I'm helping local businesses in my community. Three clients so far in just 2 months!","postType":"resource","mediaUrl":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80","likeCount":74,"commentCount":7},
      {"title":"Got promoted thanks to English Communication","content":"The English Communication course boosted my confidence so much. I got promoted at work thanks to my improved presentations. Highly recommend!","postType":"win","mediaUrl":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80","likeCount":132,"commentCount":11},
      {"title":"Mindfulness transformed my daily routine","content":"7 days of mindfulness practice transformed my daily routine. I now meditate every morning. The EIHE course was the best investment in myself.","postType":"discussion","mediaUrl":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80","likeCount":65,"commentCount":6},
      {"title":"Question: Best way to practice Python daily?","content":"I just finished the Python course and want to keep learning. What are the best free platforms to practice Python daily? Any tips from fellow graduates?","postType":"question","mediaUrl":null,"likeCount":43,"commentCount":5},
      {"title":"Free resources for graphic design","content":"I've compiled a list of free tools and resources that complement the EIHE graphic design course: Canva, Figma free plan, Adobe Color, Google Fonts, and Unsplash. Check them out!","postType":"resource","mediaUrl":null,"likeCount":89,"commentCount":8}
    ]$alumni$::jsonb)
  loop
    if not exists (select 1 from public.alumni_posts where title = alumni_item->>'title') then
      insert into public.alumni_posts (
        user_id, title, content, media_url, post_type, is_published, is_featured, like_count, comment_count
      ) values (
        seed_user_id,
        alumni_item->>'title',
        alumni_item->>'content',
        nullif(alumni_item->>'mediaUrl', 'null'),
        alumni_item->>'postType',
        true,
        alumni_item->>'postType' in ('win', 'story'),
        (alumni_item->>'likeCount')::integer,
        (alumni_item->>'commentCount')::integer
      );
    end if;
  end loop;
end $$;

commit;
