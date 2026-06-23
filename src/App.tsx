import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CoursesPage from "./pages/courses/page.tsx";
import CourseDetailPage from "./pages/courses/[slug]/page.tsx";
import CategoryPage from "./pages/categories/[slug]/page.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import ClassroomPage from "./pages/classroom/[slug]/page.tsx";
import CertificatesPage from "./pages/certificates/page.tsx";
import AlumniPage from "./pages/alumni/page.tsx";
import AdminPage from "./pages/admin/page.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:slug" element={<CourseDetailPage />} />
            <Route path="categories/:slug" element={<CategoryPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="classroom/:slug" element={<ClassroomPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="alumni" element={<AlumniPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
