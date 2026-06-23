import {
  api,
  Authenticated,
  Unauthenticated,
  AuthLoading,
  usePaginatedQuery as useSupabasePaginatedQuery,
  useSupabaseMutation as useMutation,
  useSupabaseQuery as useQuery,
} from "@/lib/supabase-api";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Heart,
  MessageCircle,
  Plus,
  Trophy,
  HelpCircle,
  BookOpen,
  Megaphone,
  Star,
  ChevronDown,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { Id } from "@/lib/supabase-types";


const POST_TYPES = [
  { value: "all", label: "All Posts", icon: BookOpen, color: "bg-violet-100 text-violet-700" },
  { value: "discussion", label: "Discussion", icon: Megaphone, color: "bg-blue-100 text-blue-700" },
  { value: "win", label: "Win", icon: Trophy, color: "bg-amber-100 text-amber-700" },
  { value: "question", label: "Question", icon: HelpCircle, color: "bg-pink-100 text-pink-700" },
  { value: "resource", label: "Resource", icon: Star, color: "bg-green-100 text-green-700" },
  { value: "story", label: "Story", icon: BookOpen, color: "bg-purple-100 text-purple-700" },
] as const;

type PostTypeValue = (typeof POST_TYPES)[number]["value"];

function PostTypeBadge({ type }: { type: string }) {
  const pt = POST_TYPES.find((p) => p.value === type) ?? POST_TYPES[1];
  const Icon = pt.icon;
  return (
    <Badge className={`${pt.color} border-0 font-bold text-xs flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {pt.label}
    </Badge>
  );
}

function PostCard({ post }: { post: { _id: Id<"alumniPosts">; title: string; content: string; postType: string; likeCount: number; commentCount?: number; mediaUrl?: string; user?: { name?: string } | null } }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const liked = useQuery(api.alumni.hasLiked, { postId: post._id });
  const comments = useQuery(api.alumni.getComments, showComments ? { postId: post._id } : "skip");
  const toggleLike = useMutation(api.alumni.toggleLike);
  const addComment = useMutation(api.alumni.addComment);

  const handleLike = async () => {
    try {
      await toggleLike({ postId: post._id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update like");
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment({ postId: post._id, content: newComment });
      setNewComment("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update like");
    }
  };

  const initials = post.user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-2xl border border-border hover:shadow-md transition-shadow">
        <CardContent className="p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">{post.user?.name ?? "Community Member"}</p>
            </div>
            <PostTypeBadge type={post.postType} />
          </div>

          {/* Content */}
          <div>
            <h3 className="font-black text-base mb-1">{post.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{post.content}</p>
          </div>

          {post.mediaUrl && (
            <div className="rounded-xl overflow-hidden aspect-[16/9]">
              <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <Authenticated>
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-bold cursor-pointer transition-colors ${liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"}`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-pink-500" : ""}`} />
                {post.likeCount}
              </button>
            </Authenticated>
            <Unauthenticated>
              <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                <Heart className="w-4 h-4" />
                {post.likeCount}
              </span>
            </Unauthenticated>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-violet-600 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {post.commentCount ?? 0} Comments
              <ChevronDown className={`w-3 h-3 transition-transform ${showComments ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Comments */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border pt-4 space-y-3"
              >
                <Authenticated>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="rounded-xl resize-none text-sm"
                      rows={2}
                    />
                    <Button
                      onClick={handleComment}
                      size="icon"
                      className="rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 cursor-pointer shrink-0 self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Authenticated>
                {comments?.map((c) => (
                  <div key={c._id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {c.user?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="bg-secondary rounded-xl px-3 py-2 flex-1">
                      <p className="font-bold text-xs mb-0.5">{c.user?.name ?? "Member"}</p>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("discussion");
  const [loading, setLoading] = useState(false);
  const createPost = useMutation(api.alumni.createPost);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setLoading(true);
    try {
      await createPost({ title, content, postType });
      toast.success("Post published to the community!");
      onClose();
    } catch {
      toast.error("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">New Post</h2>
            <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {POST_TYPES.filter((p) => p.value !== "all").map((pt) => {
              const Icon = pt.icon;
              return (
                <button
                  key={pt.value}
                  onClick={() => setPostType(pt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 cursor-pointer transition-all ${postType === pt.value ? `${pt.color} border-current` : "border-border text-muted-foreground hover:border-foreground/30"}`}
                >
                  <Icon className="w-3 h-3" />
                  {pt.label}
                </button>
              );
            })}
          </div>

          <Input
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl"
          />

          <Textarea
            placeholder="Share your thoughts, wins, questions, or resources with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-xl resize-none"
            rows={5}
          />

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose} className="rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold cursor-pointer"
            >
              {loading ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CommunityFeed() {
  const [filter, setFilter] = useState<PostTypeValue>("all");
  const [showCreate, setShowCreate] = useState(false);
  const topMembers = useQuery(api.alumni.getTopMembers) as Array<{ user?: { name?: string } | null; totalLikes: number }> | undefined;

  const { results, status, loadMore } = useAlumniPaginatedQuery(filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AnimatePresence>
        {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar: filters */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">Filter Posts</p>
              {POST_TYPES.map((pt) => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.value}
                    onClick={() => setFilter(pt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${filter === pt.value ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30" : "hover:bg-secondary text-muted-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {pt.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">Top Contributors</p>
              {!topMembers ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {topMembers.slice(0, 7).map((member, i) => {
                    const memberUser = member.user;
                    const memberName = memberUser && "name" in memberUser ? memberUser.name : undefined;
                    return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl hover:bg-secondary transition-colors">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-orange-300 text-white" : "bg-secondary text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {memberName?.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{memberName ?? "Member"}</p>
                        <p className="text-xs text-muted-foreground">{member.totalLikes} likes</p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feed */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black">Community</h1>
              <p className="text-muted-foreground text-sm">Connect, share, and grow together</p>
            </div>
            <Authenticated>
              <Button
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </Authenticated>
            <Unauthenticated>
              <SignInButton className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-4 py-2 cursor-pointer" />
            </Unauthenticated>
          </div>

          {/* Posts */}
          {status === "LoadingFirstPage" ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-black text-lg mb-2">No posts yet</h3>
                <p className="text-muted-foreground">Be the first to post in this category!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {results.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
              {status === "CanLoadMore" && (
                <div className="text-center">
                  <Button
                    onClick={() => loadMore(10)}
                    variant="ghost"
                    className="rounded-xl font-bold cursor-pointer"
                  >
                    Load more posts
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to paginate with filter
function useAlumniPaginatedQuery(filter: PostTypeValue) {
  const { results, status, loadMore } = useSupabasePaginatedQuery(
    api.alumni.list,
    { postType: filter === "all" ? undefined : filter },
    { initialNumItems: 10 }
  );
  return { results, status, loadMore };
}


export default function AlumniPage() {
  return (
    <>
      <AuthLoading>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </AuthLoading>
      <Authenticated>
        <CommunityFeed />
      </Authenticated>
      <Unauthenticated>
        <CommunityFeed />
      </Unauthenticated>
    </>
  );
}
