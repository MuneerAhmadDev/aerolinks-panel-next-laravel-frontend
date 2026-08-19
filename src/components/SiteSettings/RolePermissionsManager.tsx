"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Skeleton,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import api from "@/api/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

interface Department {
  id: number;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Groups permissions by their noun (the part after the first hyphen).
 * e.g. "view-users" and "edit-users" both go into the "users" group.
 */
function groupByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const parts = perm.name.split("-");
    const category = parts.length > 1 ? parts.slice(1).join("-") : perm.name;
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {});
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RolePermissionsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [selectedDept, setSelectedDept] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState<number | "">("");

  // The set of permission names that are currently checked for the selected role
  const [checkedPerms, setCheckedPerms] = useState<Set<string>>(new Set());

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ── Initial data load: departments + predefined permissions ─────────────────
  useEffect(() => {
    Promise.all([
      api.get<Department[]>("/api/departments"),
      api.get<Permission[]>("/api/permissions"),
    ])
      .then(([deptRes, permRes]) => {
        setDepartments(deptRes.data);
        setAllPermissions(permRes.data);
      })
      .finally(() => setLoadingInit(false));
  }, []);

  // ── Fetch roles when department changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedDept) {
      setRoles([]);
      setSelectedRole("");
      setCheckedPerms(new Set());
      return;
    }
    setLoadingRoles(true);
    api
      .get<Role[]>(`/api/roles?department_id=${selectedDept}`)
      .then((res) => {
        setRoles(res.data);
        setSelectedRole("");
        setCheckedPerms(new Set());
      })
      .finally(() => setLoadingRoles(false));
  }, [selectedDept]);

  // ── Populate checkboxes when role changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedRole) {
      setCheckedPerms(new Set());
      return;
    }
    const role = roles.find((r) => r.id === selectedRole);
    if (role) {
      // permissions may come as objects or plain strings depending on API response
      const names = role.permissions.map((p) =>
        typeof p === "string" ? p : p.name
      );
      setCheckedPerms(new Set(names));
    }
  }, [selectedRole, roles]);

  // ── Toggle a single permission ──────────────────────────────────────────────
  const togglePerm = useCallback((name: string) => {
    setCheckedPerms((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
    setMessage(null);
  }, []);

  // ── Batch save via PUT /api/departments/{dept}/roles/{role}/permissions ──────
  async function handleSave() {
    if (!selectedDept || !selectedRole) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put(
        `/api/departments/${selectedDept}/roles/${selectedRole}/permissions`,
        { permissions: Array.from(checkedPerms) }
      );

      // Update the local roles list so re-selecting the role keeps correct state
      const updatedPerms: Permission[] = res.data.permissions ?? [];
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole ? { ...r, permissions: updatedPerms } : r
        )
      );

      setMessage({ type: "success", text: "Permissions saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save permissions. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const grouped = groupByCategory(allPermissions);
  const activeRole = roles.find((r) => r.id === selectedRole);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <Box sx={{ mt: 3 }}>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={56} sx={{ mb: 3, borderRadius: 1 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* ── Selectors ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDept}
              label="Department"
              onChange={(e) => setSelectedDept(e.target.value as number)}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={!selectedDept || loadingRoles}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value as number)}
              endAdornment={
                loadingRoles ? (
                  <CircularProgress size={20} sx={{ mr: 3 }} />
                ) : undefined
              }
            >
              {roles.length === 0 ? (
                <MenuItem disabled value="">
                  {selectedDept ? "No roles in this department" : "Select a department first"}
                </MenuItem>
              ) : (
                roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* ── Feedback message ──────────────────────────────────────────────── */}
      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
          icon={message.type === "success" ? <CheckCircleOutlineIcon /> : undefined}
        >
          {message.text}
        </Alert>
      )}

      {/* ── Permission matrix (only shown when a role is selected) ─────────── */}
      {selectedRole ? (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                Permissions for
              </Typography>
              <Chip
                label={activeRole?.name}
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Chip
              label={`${checkedPerms.size} / ${allPermissions.length} selected`}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Grouped permission cards */}
          <Grid container spacing={2}>
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, perms]) => (
                <Grid item xs={12} sm={6} md={4} key={category}>
                  <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
                    <CardHeader
                      title={capitalize(category)}
                      titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
                      sx={{
                        pb: 0,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        bgcolor: "action.hover",
                      }}
                    />
                    <CardContent sx={{ pt: 1.5, pb: "12px !important" }}>
                      <FormGroup>
                        {perms.map((perm) => (
                          <FormControlLabel
                            key={perm.id}
                            control={
                              <Switch
                                size="small"
                                checked={checkedPerms.has(perm.name)}
                                onChange={() => togglePerm(perm.name)}
                                color="primary"
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {capitalize(perm.name.split("-")[0])}
                              </Typography>
                            }
                          />
                        ))}
                      </FormGroup>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Save button */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                textTransform: "capitalize",
                fontWeight: 600,
                borderRadius: "7px",
                px: 3,
              }}
            >
              {saving ? "Saving…" : "Save Permissions"}
            </Button>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            mt: 4,
            p: 5,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Select a <strong>Department</strong> and then a <strong>Role</strong> to manage its
            permissions.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
