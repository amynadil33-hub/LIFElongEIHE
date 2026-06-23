export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Id<T extends string = string> = string & { readonly __table?: T };
export type Row<T> = T & { id: string; _id: string; createdAt?: string; _creationTime?: number };

export interface User { id: string; _id: string; tokenIdentifier?: string; name?: string; email?: string; avatar?: string; role?: string; bio?: string }
export interface Category { id: string; _id: string; name: string; slug: string; description?: string; icon: string; color: string; courseCount: number; sortOrder: number }
export interface Course { id: string; _id: string; title: string; slug: string; shortDescription: string; description?: string; thumbnailUrl?: string; categoryId: string; instructorId?: string; instructorName: string; level: string; language: string; durationDays: number; totalLessons: number; isPublished: boolean; isFeatured: boolean; tags: string[]; whatYouLearn: string[]; enrolledCount: number; ratingAverage: number; ratingCount: number }
export interface CourseDay { id: string; _id: string; courseId: string; dayNumber: number; title: string; description?: string }
export interface Lesson { id: string; _id: string; courseId: string; dayId: string; title: string; description?: string; contentType: string; contentUrl?: string; contentText?: string; durationMinutes: number; isPreview: boolean; sortOrder: number; dhivehiTitle?: string; dhivehiDescription?: string; dhivehiContentText?: string }
export interface Enrollment { id: string; _id: string; userId: string; courseId: string; status: string; progressPercentage: number; completedAt?: string; lastAccessedAt: string; course?: Course | null }
export interface LessonProgress { id: string; _id: string; userId: string; lessonId: string; courseId: string; isCompleted: boolean; completedAt?: string; lastPositionSeconds: number }
export interface Comment { id: string; _id: string; userId: string; lessonId: string; courseId: string; parentId?: string; content: string; isPinned: boolean; likeCount: number; user?: User | null }
export interface Submission { id: string; _id: string; userId: string; lessonId: string; courseId: string; content?: string; fileUrl?: string; fileName?: string; status: string; grade?: string; feedback?: string; reviewedBy?: string; reviewedAt?: string; user?: User | null; course?: Course | null }
export interface Certificate { id: string; _id: string; userId: string; courseId: string; certificateNumber: string; issuedAt: string; courseTitle: string; userName: string; course?: Course | null }
export interface AlumniPost { id: string; _id: string; userId: string; courseId?: string; title: string; content: string; mediaUrl?: string; postType: string; isPublished: boolean; isFeatured: boolean; likeCount: number; commentCount?: number; user?: User | null }
export interface AlumniComment { id: string; _id: string; postId: string; userId: string; content: string; likeCount: number; user?: User | null }
