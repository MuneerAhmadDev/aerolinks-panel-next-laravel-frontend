"use client";

/**
 * DepartmentContext — Active Department State Management
 *
 * Provides the entire app with:
 *   • The logged-in user's full profile (roles, permissions, departments)
 *   • The currently "active" department (persisted in a cookie for Edge middleware)
 *   • A setActiveDepartment() function that switches context and updates all
 *     downstream state (cookie, Axios default header, permission cache)
 *   • A hasPermission() helper for conditional UI rendering
 *
 * Cookie contract (consumed by admin/middleware.ts):
 *   token       – Sanctum token (written at login, read by Edge middleware)
 *   active_dept – active department ID (updated on every switch)
 *   user_perms  – comma-separated permission names for active department
 *                 (used by middleware for lightweight permission checks)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import api from "@/api/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Permission {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface DepartmentUserRole {
  id: number;
  department_role: {
    department: Department;
    role: Role;
  };
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
  roles: Role[];
  permissions: Permission[];
  departments: Department[];
  department_user_roles: DepartmentUserRole[];
}

export interface DepartmentContextType {
  /** Full authenticated user profile, null when unauthenticated or loading */
  user: AuthUser | null;
  /** Departments the user belongs to */
  departments: Department[];
  /** The currently active department (null = Global View for Super Admin) */
  activeDepartment: Department | null;
  /** Switch the active department; updates the cookie and Axios default header */
  setActiveDepartment: (dept: Department | null) => void;
  /** Returns true if the user has the named permission in the active department */
  hasPermission: (permission: string) => boolean;
  /** Returns true if the user has the named role in the active department (or globally) */
  hasRole: (role: string) => boolean;
  /** True while the initial /api/user fetch is in-flight */
  isLoading: boolean;
  /** Call this after login to re-hydrate the context without a page reload */
  refreshUser: () => Promise<void>;
  /**
   * Hydrate the context directly from an already-fetched user object.
   * Call this immediately after login (the login response already contains
   * the full user payload) so the first dashboard render has permissions
   * ready — no extra /api/user round-trip, no flash of restricted content.
   */
  hydrateUser: (user: AuthUser) => void;
  /**
   * True when the logged-in user holds the 'Super Admin' global role.
   * Super Admins bypass department scoping entirely and can switch to
   * "Global View" (activeDepartment = null) to see cross-department data.
   */
  isSuperAdmin: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DepartmentContext = createContext<DepartmentContextType | null>(null);

// ── Helper: build the user_perms cookie value for the active department ────────

function buildPermsCookie(user: AuthUser, deptId: number | null): string {
  if (!deptId) return "";

  const permNames = new Set<string>();

  // Direct permissions on the user
  user.permissions.forEach((p) => permNames.add(p.name));

  // Permissions via department-scoped roles
  user.department_user_roles?.forEach((dur) => {
    if (dur.department_role?.department?.id === deptId) {
      dur.department_role?.role?.permissions?.forEach((p) =>
        permNames.add(p.name)
      );
    }
  });

  return Array.from(permNames).join(",");
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function DepartmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeDepartment, setActiveDepartmentState] =
    useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch full user profile ──────────────────────────────────────────────────
  const fetchUser = useCallback(async () => {
    // Use cookie first (written at login), then fall back to localStorage
    const token =
      Cookies.get("token") ?? localStorage.getItem("token") ?? null;

    if (!token) {
      setIsLoading(false);
      return;
    }

    // Ensure both storage mechanisms are in sync for the middleware cookie
    if (!Cookies.get("token") && token) {
      Cookies.set("token", token, { expires: 1, sameSite: "lax" });
    }

    try {
      const { data: userData }: { data: AuthUser } = await api.get("/api/user");
      setUser(userData);

      // Restore previously saved active department, or apply sensible defaults.
      const savedDeptId = Cookies.get("active_dept");
      const departments = userData.departments ?? [];
      const isSA = userData.roles?.some((r) => ["Super Admin", "SuperAdmin"].includes(r.name)) ?? false;

      let target: Department | null = null;

      if (savedDeptId) {
        // Always honour an explicit saved selection (including for Super Admins
        // who chose a specific department last time).
        target =
          departments.find((d) => d.id === parseInt(savedDeptId, 10)) ?? null;
      }

      if (!target && !isSA && departments.length > 0) {
        // Non-Super-Admin with no saved selection → default to first department.
        target = departments[0];
      }

      // Super Admin with no saved selection → stay in Global View (null).
      // Non-Super-Admin without departments is handled by the orphan-redirect.
      if (target) {
        applyDepartment(target, userData);
      }
    } catch {
      // Token may have expired — clear stale auth data
      Cookies.remove("token");
      Cookies.remove("active_dept");
      Cookies.remove("user_perms");
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ── Internal helper: apply a department to all storage/header layers ─────────
  function applyDepartment(dept: Department, currentUser: AuthUser) {
    setActiveDepartmentState(dept);
    Cookies.set("active_dept", String(dept.id), {
      expires: 7,
      sameSite: "lax",
    });
    // Forward to all Axios requests so Laravel's SetDepartmentContext picks it up
    api.defaults.headers.common["X-Department-Id"] = dept.id;
    // Lightweight permission list for Edge middleware checks
    Cookies.set("user_perms", buildPermsCookie(currentUser, dept.id), {
      expires: 7,
      sameSite: "lax",
    });
  }

  // ── Public: hydrate from login response (avoids extra /api/user round-trip) ──
  const hydrateUser = useCallback((userData: AuthUser) => {
    setUser(userData);

    const savedDeptId = Cookies.get("active_dept");
    const departments = userData.departments ?? [];
    const isSA = userData.roles?.some((r) => ["Super Admin", "SuperAdmin"].includes(r.name)) ?? false;

    let target: Department | null = null;

    if (savedDeptId) {
      target = departments.find((d) => d.id === parseInt(savedDeptId, 10)) ?? null;
    }
    if (!target && !isSA && departments.length > 0) {
      target = departments[0];
    }

    if (target) {
      applyDepartment(target, userData);
    }

    setIsLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public: switch active department ────────────────────────────────────────
  // Every page fetches its data once on mount (e.g. `useEffect(..., [])`), so
  // just updating the context/cookie/header here has no visible effect on
  // whatever is already rendered — the user sees the switcher change but the
  // data on screen stays exactly as it was. Reloading the page guarantees
  // every component re-fetches under the newly active department.
  const setActiveDepartment = useCallback(
    (dept: Department | null) => {
      if (!dept) {
        setActiveDepartmentState(null);
        Cookies.remove("active_dept");
        Cookies.remove("user_perms");
        delete api.defaults.headers.common["X-Department-Id"];
        window.location.reload();
        return;
      }

      if (user) {
        applyDepartment(dept, user);
        window.location.reload();
      }
    },
    [user] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Internal: normalise a role entry to a name string (handles objects & strings) ──
  function roleName(r: any): string {
    return typeof r === "string" ? r : (r?.name ?? "");
  }

  const SUPER_ADMIN_NAMES = ["Super Admin", "SuperAdmin"];

  // ── Permission helper ────────────────────────────────────────────────────────
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // SuperAdmin has every permission — bypass ALL other checks.
      if (user.roles?.some((r) => SUPER_ADMIN_NAMES.includes(roleName(r)))) return true;

      // 1. Direct user permissions (cross-department)
      if (user.permissions?.some((p) => p.name === permission)) return true;

      // 2. Global role permissions (e.g. admin assigned via syncRoles)
      if (user.roles?.some((r: any) => r?.permissions?.some((p: any) => p.name === permission))) return true;

      // 3. Department-scoped role permissions
      const deptId = activeDepartment?.id;
      if (!deptId) return false;

      return (
        user.department_user_roles?.some(
          (dur) =>
            dur.department_role?.department?.id === deptId &&
            dur.department_role?.role?.permissions?.some(
              (p) => p.name === permission
            )
        ) ?? false
      );
    },
    [user, activeDepartment] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Role helper ──────────────────────────────────────────────────────────────
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;

      // Global roles (Spatie, not department-scoped)
      if (user.roles?.some((r) => roleName(r) === role)) return true;

      // Roles via department assignments
      const deptId = activeDepartment?.id;
      if (!deptId) return false;

      return (
        user.department_user_roles?.some(
          (dur) =>
            dur.department_role?.department?.id === deptId &&
            dur.department_role?.role?.name === role
        ) ?? false
      );
    },
    [user, activeDepartment]
  );

  // True when the logged-in user holds any recognised Super Admin role name.
  // Handles both Role objects {id, name} and plain strings defensively.
  const isSuperAdmin =
    user?.roles?.some((r) => SUPER_ADMIN_NAMES.includes(roleName(r))) ?? false;

  return (
    <DepartmentContext.Provider
      value={{
        user,
        departments: user?.departments ?? [],
        activeDepartment,
        setActiveDepartment,
        hasPermission,
        hasRole,
        isLoading,
        refreshUser: fetchUser,
        hydrateUser,
        isSuperAdmin,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDepartment(): DepartmentContextType {
  const ctx = useContext(DepartmentContext);
  if (!ctx) {
    throw new Error("useDepartment must be used within <DepartmentProvider>");
  }
  return ctx;
}
