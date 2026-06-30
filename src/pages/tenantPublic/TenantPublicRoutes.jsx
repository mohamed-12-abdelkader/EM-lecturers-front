import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { TenantPublicSkeleton, TenantPublicNotFound } from "./components/TenantPublicStates";
import TenantPublicShell from "./TenantPublicShell";

const TenantTeacherProfilePage = lazy(() => import("./pages/TenantTeacherProfilePage"));
const TenantCoursePublicPage = lazy(() => import("./pages/TenantCoursePublicPage"));
const TenantCoursesListPage = lazy(() => import("./pages/TenantCoursesListPage"));
const TenantSubjectsPage = lazy(() => import("./pages/TenantSubjectsPage"));
const TenantFreeLessonPage = lazy(() => import("./pages/TenantFreeLessonPage"));
const TenantSearchPage = lazy(() => import("./pages/TenantSearchPage"));

function wrap(subdomain, Page, props = {}) {
  return (
    <Suspense fallback={<TenantPublicSkeleton rows={3} />}>
      <Page subdomain={subdomain} {...props} />
    </Suspense>
  );
}

/**
 * Tenant subdomain SEO routes — call as {renderTenantPublicRoutes(subdomain)} inside <Routes>.
 * React Router v6 only accepts <Route> or <Fragment> as direct children of <Routes>.
 */
export function renderTenantPublicRoutes(subdomain) {
  if (!subdomain) return null;

  return (
    <>
      <Route path="/teacher" element={wrap(subdomain, TenantTeacherProfilePage)} />
      <Route path="/courses" element={wrap(subdomain, TenantCoursesListPage, { sort: "all" })} />
      <Route
        path="/courses/latest"
        element={wrap(subdomain, TenantCoursesListPage, { sort: "latest" })}
      />
      <Route
        path="/courses/popular"
        element={wrap(subdomain, TenantCoursesListPage, { sort: "popular" })}
      />
      <Route path="/subjects" element={wrap(subdomain, TenantSubjectsPage)} />
      <Route path="/course/:slug" element={wrap(subdomain, TenantCoursePublicPage)} />
      <Route path="/free-lectures/:lectureId" element={wrap(subdomain, TenantFreeLessonPage)} />
      <Route path="/search" element={wrap(subdomain, TenantSearchPage)} />
    </>
  );
}

export function TenantPublicNotFoundRoute({ subdomain }) {
  return (
    <Suspense fallback={<TenantPublicSkeleton rows={2} />}>
      <TenantPublicShell subdomain={subdomain} seoPage="home" showSearch={false}>
        <TenantPublicNotFound subdomain={subdomain} />
      </TenantPublicShell>
    </Suspense>
  );
}
