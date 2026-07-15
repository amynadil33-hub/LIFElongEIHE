import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { api, Authenticated, Unauthenticated, AuthLoading, useSupabaseQuery as useQuery } from "@/lib/supabase-api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { BookOpen, GraduationCap, Home, LayoutDashboard, Award, Users, ShieldCheck, Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils.ts";

function NavContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/alumni", label: "Alumni", icon: Users },
  ];

  return (
    <>
      {links.map((l) => (
        <Link
          key={l.href}
          to={l.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-700 transition-all cursor-pointer",
            location.pathname === l.href
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground/70 hover:text-foreground hover:bg-secondary"
          )}
        >
          <l.icon className="w-4 h-4" />
          {l.label}
        </Link>
      ))}
    </>
  );
}

function UserMenu() {
  const { signout } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer">
          <Avatar className="w-9 h-9 ring-2 ring-primary/30">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white font-bold text-sm">
              {user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-2xl">
        <div className="px-3 py-2">
          <p className="font-bold text-sm truncate">{user?.name ?? "Student"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="w-4 h-4 mr-2" /> My Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/certificates")}>
          <Award className="w-4 h-4 mr-2" /> My Certificates
        </DropdownMenuItem>
        {user?.role === "admin" && (
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/admin")}>
            <ShieldCheck className="w-4 h-4 mr-2" /> Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => signout()}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50" : "bg-background/80 backdrop-blur-sm"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">EIHE</span>
              <span className="block text-[9px] font-semibold text-muted-foreground -mt-1 tracking-widest uppercase">Learning Hub</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavContent />
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Authenticated>
              <Link to="/dashboard" className="hidden md:flex">
                <Button size="sm" className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold shadow-md cursor-pointer">
                  <Sparkles className="w-4 h-4 mr-1" /> Dashboard
                </Button>
              </Link>
              <UserMenu />
            </Authenticated>
            <Unauthenticated>
              <SignInButton className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-90 font-bold shadow-md text-white px-4 py-2 text-sm cursor-pointer" />
            </Unauthenticated>
            <AuthLoading>
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            </AuthLoading>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-secondary cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
            <NavContent onClose={() => setMobileOpen(false)} />
            <Authenticated>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-700 text-foreground/70 hover:text-foreground hover:bg-secondary cursor-pointer">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/certificates" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-700 text-foreground/70 hover:text-foreground hover:bg-secondary cursor-pointer">
                <Award className="w-4 h-4" /> Certificates
              </Link>
            </Authenticated>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-xl">EIHE Learning Hub</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Practical 7-day short courses from Everyone’s Institute of Higher Education, serving Maldivian learners through the Everyone’s education brand since 2001.
              </p>
              <div className="flex gap-3 mt-5">
                {["🇲🇻 Maldives-Based", "📚 7-Day Courses", "⭐ Since 2001"].map((badge) => (
                  <span key={badge} className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-300">{badge}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-4 text-slate-200 uppercase tracking-wider">Learn</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                {["Browse Courses", "Categories", "Featured Courses", "7-Day Courses"].map((item) => (
                  <li key={item}><Link to="/courses" className="hover:text-white transition-colors cursor-pointer">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-4 text-slate-200 uppercase tracking-wider">Community</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                {["Alumni Stories", "Student Dashboard", "Certificates", "Support"].map((item) => (
                  <li key={item}><Link to="/alumni" className="hover:text-white transition-colors cursor-pointer">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} EIHE Learning Hub. All rights reserved.</p>
            <p className="text-slate-500 text-sm">Practical lifelong learning for Maldives.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
