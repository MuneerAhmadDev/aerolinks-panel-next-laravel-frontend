"use client";

import React, { Suspense, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import LeftSidebarMenu from "@/components/Layout/LeftSidebarMenu";
import TopNavbar from "./../components/Layout/TopNavbar/index";
import Footer from "@/components/Layout/Footer";
import ControlPanel from "@/components/Layout/ControlPanel";
import RouterProgressBar from "@/components/Layout/RouterProgressBar";
import { SnackbarProvider } from "notistack";
import { DepartmentProvider } from "@/context/DepartmentContext";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";

interface LayoutProviderProps {
  children: ReactNode;
}

const LOCK_SCREEN_PATH = "/authentication/lock-screen/";

/** Read the screen_locked cookie without any library dependency. */
const isScreenLocked = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim() === "screen_locked=1");
};

const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [active, setActive] = useState<boolean>(false);
  const pathname = usePathname();
  const router   = useRouter();

  const toggleActive = () => {
    setActive(!active);
  };

  /**
   * Client-side lock enforcement — runs on every client-side navigation.
   *
   * The Edge middleware covers hard refreshes and direct URL entry, but the
   * Next.js App Router's client-side cache means the back button never makes a
   * network request, so middleware never fires for those navigations.
   * This effect fills that gap: whenever `pathname` changes (including via the
   * back/forward button) we synchronously check the cookie and redirect.
   */
  useEffect(() => {
    if (isScreenLocked() && !pathname.startsWith(LOCK_SCREEN_PATH)) {
      router.replace(LOCK_SCREEN_PATH);
    }
  }, [pathname, router]);

  /**
   * popstate handler — belt-and-suspenders for the back button.
   *
   * `pathname` already updates on popstate in the App Router, so the effect
   * above will catch it. This handler fires first (before React re-renders)
   * and pushes the lock screen onto the history stack immediately, preventing
   * even a momentary flash of the previous page.
   */
  useEffect(() => {
    const handlePop = () => {
      if (isScreenLocked()) {
        router.replace(LOCK_SCREEN_PATH);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [router]);

  const isAuthPage = [
    "/authentication/sign-in/",
    "/authentication/sign-up/",
    "/authentication/forgot-password/",
    "/authentication/reset-password/",
    "/authentication/confirm-email/",
    "/authentication/lock-screen/",
    "/authentication/logout/",
    "/coming-soon/",
    "/",
    "/front-pages/features/",
    "/front-pages/team/",
    "/front-pages/faq/",
    "/front-pages/contact/",
    "/pending-assignment/",
  ].includes(pathname);

  return (
    <SiteSettingsProvider>
    <DepartmentProvider>
    <Suspense fallback={null}>
      <RouterProgressBar />
    </Suspense>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
    <>
      <div className={`main-wrapper-content ${active ? "active" : ""}`}>
        {!isAuthPage && (
          <>
            <TopNavbar toggleActive={toggleActive} />

            <LeftSidebarMenu toggleActive={toggleActive} />
          </>
        )}

        <div className="main-content">
          {children}

          {!isAuthPage && <Footer />}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "15px",
          right: "15px",
          zIndex: "-5",
          opacity: 0,
          visibility: "hidden",
        }}
      >
        <ControlPanel />
      </div>
    </>
    </SnackbarProvider>
    </DepartmentProvider>
    </SiteSettingsProvider>

  );
};

export default LayoutProvider;
