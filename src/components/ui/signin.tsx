import { forwardRef, useState, type FormEvent } from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

export interface SignInButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  loadingText?: string;
  asChild?: boolean;
}

export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  ({ disabled, showIcon = true, signInText = "Sign In", signOutText = "Sign Out", loadingText, className, variant, size, asChild: _asChild, ...props }, ref) => {
    const { isAuthenticated, signInWithPassword, signUp, signout } = useAuth();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const resetForm = () => {
      setName("");
      setEmail("");
      setPassword("");
    };

    const handleSignIn = async (event: FormEvent) => {
      event.preventDefault();
      setPending(true);
      try {
        await signInWithPassword(email, password);
        setOpen(false);
        resetForm();
        toast.success("Welcome back!");
      } catch (error) {
        toast.error("Could not sign in", { description: error instanceof Error ? error.message : "Please try again." });
      } finally {
        setPending(false);
      }
    };

    const handleSignUp = async (event: FormEvent) => {
      event.preventDefault();
      setPending(true);
      try {
        const signedIn = await signUp(name, email, password);
        setOpen(false);
        resetForm();
        toast.success(signedIn ? "Your account is ready!" : "Check your email to confirm your account.");
      } catch (error) {
        toast.error("Could not create account", { description: error instanceof Error ? error.message : "Please try again." });
      } finally {
        setPending(false);
      }
    };

    const handleSignOut = async () => {
      setPending(true);
      try {
        await signout();
        toast.success("Signed out successfully.");
      } catch (error) {
        toast.error("Could not sign out", { description: error instanceof Error ? error.message : "Please try again." });
      } finally {
        setPending(false);
      }
    };

    if (isAuthenticated) {
      return (
        <Button ref={ref} type="button" onClick={handleSignOut} disabled={disabled || pending} variant={variant} size={size} className={className} {...props}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : showIcon && <LogOut />}
          {pending ? (loadingText ?? "Signing Out...") : signOutText}
        </Button>
      );
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button ref={ref} type="button" disabled={disabled} variant={variant} size={size} className={className} {...props}>
            {showIcon && <LogIn />}
            {signInText}
          </Button>
        </DialogTrigger>
        <DialogContent className="overflow-hidden rounded-3xl border-violet-100 p-0 sm:max-w-md">
          <div className="bg-gradient-to-r from-violet-600 to-pink-500 px-6 py-7 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Welcome to EIHE</DialogTitle>
              <DialogDescription className="text-white/80">Sign in or create a free learner account.</DialogDescription>
            </DialogHeader>
          </div>
          <Tabs defaultValue="signin" className="gap-5 px-6 pb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="signin-email">Email</Label><Input id="signin-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="signin-password">Password</Label><Input id="signin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></div>
                <Button type="submit" disabled={pending} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold">{pending && <Loader2 className="size-4 animate-spin" />}{pending ? "Signing In..." : "Sign In"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /><p className="text-xs text-muted-foreground">Use at least 6 characters.</p></div>
                <Button type="submit" disabled={pending} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold">{pending && <Loader2 className="size-4 animate-spin" />}{pending ? "Creating Account..." : "Create Free Account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  },
);

SignInButton.displayName = "SignInButton";
