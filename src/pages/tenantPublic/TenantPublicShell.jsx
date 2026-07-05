import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantPublic } from "../../api/tenantPublicApi";
import {
  TenantPublicNavbar,
  useTenantPublicTheme,
} from "./components/TenantPublicNavbar";
import TenantSearchBar from "./components/TenantSearchBar";
import { useTenantPageMetadata } from "../../Hooks/tenantPublic/useTenantPageMetadata";

const TENANT_FONT_LINK_ID = "tenant-public-arabic-fonts";

function useTenantArabicFonts() {
  useEffect(() => {
    if (document.getElementById(TENANT_FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = TENANT_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&family=Tajawal:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

/**
 * Shared layout shell for all tenant public SEO pages.
 * Handles theme, fonts, navbar, and dynamic metadata.
 */
export default function TenantPublicShell({
  subdomain,
  children,
  seoPage = "home",
  seoSlug,
  className = "",
  showSearch = false,
}) {
  const { isDarkMode, toggleTheme } = useTenantPublicTheme();
  const [navScrolled, setNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useTenantArabicFonts();

  const { data: tenantData } = useQuery({
    queryKey: ["tenant-public", subdomain],
    queryFn: () => fetchTenantPublic(subdomain),
    staleTime: 120_000,
    enabled: Boolean(subdomain),
  });

  const payload = tenantData?.data;
  const tenant = payload?.tenant;
  const teacher = payload?.teacher;

  useTenantPageMetadata(subdomain, seoPage, seoSlug, {
    tenant,
    teacher,
    subdomain,
  });

  const brandName = tenant?.display_name || subdomain;
  const cssVars = useMemo(() => {
    const theme = payload?.landing?.theme;
    if (!theme) return {};
    return {
      "--t-primary": theme.primary_color || "#0f172a",
      "--t-accent": theme.accent_color || "#3b82f6",
      "--t-text": theme.text_color || "#1e293b",
    };
  }, [payload]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`tenant-public-page ${isDarkMode ? "dark tenant-dark" : "tenant-light"} min-h-screen bg-white text-[var(--t-text,#1e293b)] antialiased ${className}`}
      style={cssVars}
      dir="rtl"
    >
      <TenantPublicNavbar
        brandName={brandName}
        specialty={tenant?.specialty || teacher?.subject}
        tenantAvatar={tenant?.avatar_url}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        navScrolled={navScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        loginHref="/login"
        signupHref="/signup"
        alwaysSolid
        extraNav={
          showSearch ? (
            <div className="hidden lg:block">
              <TenantSearchBar subdomain={subdomain} variant="inline" autoNavigate />
            </div>
          ) : null
        }
      />
      <main className="mx-auto w-full max-w-[var(--t-max,1200px)] px-4 pb-16 pt-24 md:px-6">
        {children}
      </main>
    </div>
  );
}
