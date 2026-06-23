import { api, Authenticated, Unauthenticated, useSupabaseQuery as useQuery } from "@/lib/supabase-api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Award, Download, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { format } from "date-fns";

function CertificatesInner() {
  const certificates = useQuery(api.certificates.getMyCertificates);
  const user = useQuery(api.users.getCurrentUser);

  if (!certificates) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 bg-muted rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-20">
        <Award className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-2xl font-black mb-2">No certificates yet</h3>
        <p className="text-muted-foreground mb-6">Complete a course to earn your first certificate!</p>
        <Link to="/courses">
          <Button className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold cursor-pointer">
            Browse Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((cert, i) => (
        <motion.div
          key={cert._id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {/* Certificate card */}
          <Card className="rounded-3xl overflow-hidden shadow-xl border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
            <CardContent className="p-0">
              {/* Certificate design */}
              <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-8 text-white text-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
                    <Award className="w-9 h-9 text-amber-300" />
                  </div>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Certificate of Completion</p>
                  <h3 className="font-black text-lg leading-tight">{cert.courseTitle}</h3>
                  <p className="text-white/70 text-sm mt-2">Awarded to</p>
                  <p className="font-black text-xl mt-1">{user?.name ?? cert.userName}</p>
                  <div className="mt-3">
                    <GraduationCap className="w-5 h-5 inline-block mr-1 text-amber-300" />
                    <span className="font-bold text-sm">EIHE Learning Hub</span>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Issued on</p>
                    <p className="font-bold text-sm">{format(new Date(cert.issuedAt), "MMMM d, yyyy")}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 border-0 font-bold text-xs">{cert.certificateNumber}</Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 font-bold cursor-pointer"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" /> Download Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10">
        <Badge className="mb-3 bg-amber-100 text-amber-700 border-0 font-bold px-4 py-1">Achievements</Badge>
        <h1 className="text-4xl font-black mb-2">My Certificates</h1>
        <p className="text-muted-foreground">Your verified learning achievements from EIHE.</p>
      </div>
      <Authenticated>
        <CertificatesInner />
      </Authenticated>
      <Unauthenticated>
        <div className="text-center py-20">
          <Award className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-2xl font-black mb-4">Sign in to view your certificates</h3>
          <SignInButton className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold px-8 py-3 cursor-pointer" />
        </div>
      </Unauthenticated>
    </div>
  );
}
