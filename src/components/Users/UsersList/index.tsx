"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  IconButton,
  TextField,
  Autocomplete,
  Checkbox,
  Chip,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tab,
  Tabs,
  Switch,
  Tooltip,
  FormControlLabel,
  Alert,
  Snackbar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ClearIcon from "@mui/icons-material/Clear";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Link from "next/link";
import api from "@/api/api";
import Swal from "sweetalert2";
import { useDepartment } from "@/context/DepartmentContext";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
}

interface InheritedPerm { id: number; name: string; via_roles: string[] }
interface DirectPerm    { id: number; name: string }

// ── Styled Dialog matching rmu-modal theme ────────────────────────────────────

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

const checkboxIcon        = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

// ── Component ─────────────────────────────────────────────────────────────────

const UsersList: React.FC = () => {
  const { hasRole, hasPermission, isSuperAdmin: ctxSuperAdmin } = useDepartment();
  const isSuperAdmin = ctxSuperAdmin || hasRole("Super Admin");
  const canCreate = isSuperAdmin || hasPermission("create-users");
  const canEdit   = isSuperAdmin || hasPermission("edit-users");
  const canDelete = isSuperAdmin || hasPermission("delete-users");

  const [users,    setUsers]    = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading,  setLoading]  = useState(true);

  // ── Reset Password modal state ────────────────────────────────────────────
  const [resetOpen,       setResetOpen]       = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [resetNewPw,      setResetNewPw]      = useState("");
  const [resetConfirmPw,  setResetConfirmPw]  = useState("");
  const [resetShowNew,    setResetShowNew]    = useState(false);
  const [resetShowConfirm,setResetShowConfirm]= useState(false);
  const [resetSaving,     setResetSaving]     = useState(false);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState("");
  const [filterRoleId,   setFilterRoleId]   = useState<number | "">("");

  // ── Edit modal state ──────────────────────────────────────────────────────────
  const [editOpen,       setEditOpen]       = useState(false);
  const [editUser,       setEditUser]       = useState<User | null>(null);
  const [editName,       setEditName]       = useState("");
  const [editEmail,      setEditEmail]      = useState("");
  const [editRoles,      setEditRoles]      = useState<Role[]>([]);
  const [editSaving,     setEditSaving]     = useState(false);
  const [editTab,        setEditTab]        = useState(0);

  // ── Success snackbar ──────────────────────────────────────────────────────
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg,  setSnackMsg]  = useState("");

  // ── Permission overrides state ─────────────────────────────────────────────
  const [allPerms,       setAllPerms]       = useState<DirectPerm[]>([]);
  const [inheritedPerms, setInheritedPerms] = useState<InheritedPerm[]>([]);
  const [directChecked,  setDirectChecked]  = useState<Set<string>>(new Set());
  const [permLoading,    setPermLoading]    = useState(false);
  const [permSaving,     setPermSaving]     = useState(false);
  const [permError,      setPermError]      = useState<string | null>(null);

  // ── Fetch data on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/users"),
      api.get<Role[]>("/api/roles"),
    ]).then(([usersRes, rolesRes]) => {
      setUsers(usersRes.data.sort((a, b) => a.id - b.id));
      setAllRoles(rolesRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      !filterRoleId ||
      user.roles.some((r) => r.id === filterRoleId);

    return matchesSearch && matchesRole;
  });

  const hasActiveFilters = !!searchQuery || !!filterRoleId;

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRoleId("");
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = (userId: number) => {
    Swal.fire({
      title: "Delete User?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await api.delete(`/api/users/${userId}`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        Swal.fire({ icon: "success", title: "Deleted!", text: "User removed.", timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete the user." });
      }
    });
  };

  // ── Permission category helper ────────────────────────────────────────────────
  const actionVerbs = new Set(["view", "create", "edit", "update", "delete", "manage", "approve", "assign", "export", "import"]);
  const getPermCategory = (name: string): string => {
    const parts = name.split(/[-_\s]+/);
    const rest = parts[0] && actionVerbs.has(parts[0].toLowerCase()) ? parts.slice(1) : parts;
    if (rest.length === 0) return "General";
    return rest.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRoles(user.roles ?? []);
    setEditTab(0);
    setPermError(null);
    setEditOpen(true);

    // Load all permissions + user's current splits in parallel
    setPermLoading(true);
    Promise.all([
      api.get<DirectPerm[]>("/api/permissions"),
      api.get<{ inherited_permissions: InheritedPerm[]; direct_permissions: DirectPerm[] }>(
        `/api/users/${user.id}/permissions`
      ),
    ])
      .then(([allRes, userRes]) => {
        setAllPerms(allRes.data);
        setInheritedPerms(userRes.data.inherited_permissions);
        setDirectChecked(new Set(userRes.data.direct_permissions.map((p) => p.name)));
      })
      .catch(() => setPermError("Failed to load permissions."))
      .finally(() => setPermLoading(false));
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      await api.put(`/api/users/${editUser.id}`, {
        name:  editName,
        email: editEmail,
        roles: editRoles.map((r) => r.id),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, name: editName, email: editEmail, roles: editRoles }
            : u
        )
      );
      setEditOpen(false);
      setSnackMsg(`User "${editName}" updated successfully.`);
      setSnackOpen(true);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message ?? "Failed to update user." });
    } finally {
      setEditSaving(false);
    }
  };

  // ── Save permission overrides ────────────────────────────────────────────────
  const saveOverrides = async () => {
    if (!editUser) return;
    setPermSaving(true);
    setPermError(null);
    try {
      await api.post(`/api/users/${editUser.id}/permissions`, {
        permissions: Array.from(directChecked),
      });
      setPermError(null);
      Swal.fire({ icon: "success", title: "Saved!", text: "Permission overrides updated.", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      setPermError(err.response?.data?.message ?? "Failed to save permissions.");
    } finally {
      setPermSaving(false);
    }
  };

  // ── Reset Password ────────────────────────────────────────────────────────────
  const openResetPassword = (user: User) => {
    setResetTargetUser(user);
    setResetNewPw("");
    setResetConfirmPw("");
    setResetOpen(true);
  };

  const saveResetPassword = async () => {
    if (!resetTargetUser) return;
    if (resetNewPw !== resetConfirmPw) {
      Swal.fire({ icon: "error", title: "Error", text: "Passwords do not match." });
      return;
    }
    setResetSaving(true);
    try {
      await api.post(`/api/users/${resetTargetUser.id}/reset-password`, {
        new_password: resetNewPw,
        new_password_confirmation: resetConfirmPw,
      });
      setResetOpen(false);
      Swal.fire({ icon: "success", title: "Done!", text: "Password reset successfully.", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message ?? "Failed to reset password." });
    } finally {
      setResetSaving(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr#",
      width: 70,
      sortable: false,
      renderCell: (params) => {
        const idx = filteredUsers.findIndex((u) => u.id === params.row.id);
        return idx + 1;
      },
    },
    { field: "name",  headerName: "Name",  flex: 1, minWidth: 140 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 180 },
    {
      field: "roles",
      headerName: "Roles",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => {
        const roles: Role[] = params.row.roles ?? [];
        if (roles.length === 0) {
          return <Typography variant="caption" color="text.secondary">No roles</Typography>;
        }
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px", py: "4px" }}>
            {roles.map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "11px",
                  backgroundColor: "#F0EFFF",
                  color: "#605DFF",
                  "& .MuiChip-label": { px: "6px" },
                }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: isSuperAdmin ? 130 : 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {canEdit && (
            <IconButton
              size="small"
              onClick={() => openEdit(params.row)}
              sx={{ p: "5px", color: "#605DFF" }}
              title="Edit user"
            >
              <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</i>
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row.id)}
              sx={{ p: "5px", color: "#f44336" }}
              title="Delete user"
            >
              <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</i>
            </IconButton>
          )}
          {isSuperAdmin && (
            <IconButton
              size="small"
              onClick={() => openResetPassword(params.row)}
              sx={{ p: "5px", color: "#ff9800" }}
              title="Reset password"
            >
              <LockResetIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "7px",
          mb: "25px",
          padding: { xs: "18px", sm: "20px", lg: "25px" },
        }}
        className="rmui-card"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: "20px",
          }}
        >
          <Typography
            variant="h3"
            sx={{ fontSize: { xs: "16px", md: "18px" }, fontWeight: 700 }}
            className="text-black"
          >
            Users
          </Typography>

          {canCreate && (
            <Link href="/users/add-user">
              <Button
                variant="contained"
                sx={{
                  textTransform: "capitalize",
                  borderRadius: "7px",
                  fontWeight: 500,
                  fontSize: "13px",
                  padding: "6px 16px",
                  color: "#fff !important",
                }}
              >
                <AddIcon sx={{ position: "relative", top: "-1px", mr: "4px", fontSize: "18px" }} />
                Add User
              </Button>
            </Link>
          )}
        </Box>

        <Divider sx={{ mb: "20px" }} />

        {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            mb: "20px",
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: 220,
              flex: "1 1 220px",
              "& .MuiOutlinedInput-root": { borderRadius: "7px", fontSize: "13px" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: "18px", color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")}>
                    <ClearIcon sx={{ fontSize: "15px" }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          {/* Role Filter */}
          <FormControl
            size="small"
            sx={{
              minWidth: 180,
              flex: "0 1 200px",
              "& .MuiOutlinedInput-root": { borderRadius: "7px", fontSize: "13px" },
            }}
          >
            <InputLabel sx={{ fontSize: "13px" }}>Filter by Role</InputLabel>
            <Select
              value={filterRoleId}
              label="Filter by Role"
              onChange={(e: SelectChangeEvent<number | "">) =>
                setFilterRoleId(e.target.value as number | "")
              }
            >
              <MenuItem value="">
                <em>All Roles</em>
              </MenuItem>
              {allRoles.map((role) => (
                <MenuItem key={role.id} value={role.id} sx={{ fontSize: "13px" }}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
              startIcon={<FilterListOffIcon sx={{ fontSize: "16px" }} />}
              sx={{
                textTransform: "capitalize",
                borderRadius: "7px",
                fontSize: "12px",
                fontWeight: 500,
                borderColor: "#d5d9e2",
                color: "text.secondary",
                "&:hover": { borderColor: "#f44336", color: "#f44336" },
                whiteSpace: "nowrap",
              }}
            >
              Clear Filters
            </Button>
          )}

          {/* Results count */}
          <Typography
            sx={{ ml: "auto", fontSize: "12px", color: "text.secondary", whiteSpace: "nowrap" }}
          >
            {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {/* ── DataGrid ───────────────────────────────────────────────────────── */}
        <Box>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            rowHeight={52}
            sx={{
              border: "1px solid #eceef2",
              borderRadius: "7px",
              fontSize: "13px",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f6f7f9",
                fontSize: "13px",
                fontWeight: 600,
              },
              "& .MuiDataGrid-cell": {
                borderColor: "#eceef2",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#fafafa",
              },
            }}
          />
        </Box>
      </Card>

      {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
      {isSuperAdmin && (
        <BootstrapDialog
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          className="rmu-modal"
          maxWidth="xs"
          fullWidth
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f6f7f9",
              padding: { xs: "15px 20px", md: "20px 25px" },
            }}
            className="rmu-modal-header"
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: { xs: "15px", md: "17px" } }}
              className="text-black"
            >
              Reset Password — {resetTargetUser?.name}
            </Typography>
            <IconButton size="small" onClick={() => setResetOpen(false)}>
              <ClearIcon />
            </IconButton>
          </Box>

          <Box className="rmu-modal-content">
            <Box sx={{ padding: "25px" }} className="bg-white">
              <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <Box>
                  <Typography component="h5" sx={{ fontWeight: 500, fontSize: "13px", mb: "8px" }} className="text-black">
                    New Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={resetShowNew ? "text" : "password"}
                    value={resetNewPw}
                    onChange={(e) => setResetNewPw(e.target.value)}
                    InputProps={{
                      style: { borderRadius: 7, fontSize: 13 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setResetShowNew((v) => !v)}>
                            {resetShowNew ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography component="h5" sx={{ fontWeight: 500, fontSize: "13px", mb: "8px" }} className="text-black">
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={resetShowConfirm ? "text" : "password"}
                    value={resetConfirmPw}
                    onChange={(e) => setResetConfirmPw(e.target.value)}
                    InputProps={{
                      style: { borderRadius: 7, fontSize: 13 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setResetShowConfirm((v) => !v)}>
                            {resetShowConfirm ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "10px", mt: "4px" }}>
                  <Button
                    onClick={() => setResetOpen(false)}
                    variant="outlined"
                    color="error"
                    sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", padding: "8px 24px" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveResetPassword}
                    variant="contained"
                    disabled={resetSaving || !resetNewPw || !resetConfirmPw}
                    sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", padding: "8px 24px", color: "#fff !important", bgcolor: "#ff9800", "&:hover": { bgcolor: "#e08000" } }}
                  >
                    {resetSaving ? <CircularProgress size={15} color="inherit" sx={{ mr: 1 }} /> : null}
                    Reset Password
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </BootstrapDialog>
      )}

      {/* ── Success Snackbar ─────────────────────────────────────────────────── */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px", fontSize: "13px" }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>

      {/* ── Edit User Modal ──────────────────────────────────────────────────── */}
      <BootstrapDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        className="rmu-modal"
        maxWidth="md"
        fullWidth
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f6f7f9",
            padding: { xs: "15px 20px", md: "20px 25px" },
          }}
          className="rmu-modal-header"
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "15px", md: "17px" } }}
            className="text-black"
          >
            Edit User — {editUser?.name}
          </Typography>
          <IconButton size="small" onClick={() => setEditOpen(false)}>
            <ClearIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={editTab}
          onChange={(_, v) => setEditTab(v)}
          sx={{
            px: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            minHeight: 44,
            "& .MuiTab-root": { textTransform: "capitalize", fontSize: "13px", minHeight: 44 },
          }}
        >
          <Tab label="Profile" />
          <Tab label="Access & Overrides" />
        </Tabs>

        {/* Body */}
        <Box className="rmu-modal-content">
          <Box sx={{ padding: "25px" }} className="bg-white">

            {/* ── Tab 0: Profile ────────────────────────────────────────── */}
            {editTab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Box>
                  <Typography component="h5" sx={{ fontWeight: 500, fontSize: "13px", mb: "8px" }} className="text-black">
                    Full Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    InputProps={{ style: { borderRadius: 7, fontSize: 13 } }}
                  />
                </Box>

                <Box>
                  <Typography component="h5" sx={{ fontWeight: 500, fontSize: "13px", mb: "8px" }} className="text-black">
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    InputProps={{ style: { borderRadius: 7, fontSize: 13 } }}
                  />
                </Box>

                <Box>
                  <Typography component="h5" sx={{ fontWeight: 500, fontSize: "13px", mb: "8px" }} className="text-black">
                    Roles
                  </Typography>
                  <Autocomplete
                    multiple
                    options={allRoles}
                    value={editRoles}
                    onChange={(_, val) => setEditRoles(val)}
                    getOptionLabel={(opt) => opt.name}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    disableCloseOnSelect
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox
                          icon={checkboxIcon}
                          checkedIcon={checkboxCheckedIcon}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {option.name}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Select roles…"
                        InputProps={{ ...params.InputProps, style: { borderRadius: 7, fontSize: 13 } }}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "10px", mt: "4px" }}>
                  <Button
                    onClick={() => setEditOpen(false)}
                    variant="outlined"
                    color="error"
                    sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", padding: "8px 24px" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveEdit}
                    variant="contained"
                    disabled={editSaving}
                    sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", padding: "8px 24px", color: "#fff !important" }}
                  >
                    {editSaving ? <CircularProgress size={15} color="inherit" sx={{ mr: 1 }} /> : null}
                    Save Changes
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── Tab 1: Access & Overrides ─────────────────────────────── */}
            {editTab === 1 && (
              <Box>
                {permLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "12px" }}>
                      Permissions inherited from roles are shown as read-only. Toggle switches below to grant or
                      revoke <strong>direct overrides</strong> for this user only.
                    </Typography>

                    {permError && (
                      <Alert severity="error" sx={{ mb: 2, fontSize: "12px" }}>{permError}</Alert>
                    )}

                    {/* Group permissions by category */}
                    {(() => {
                      const groups: Record<string, typeof allPerms> = {};
                      for (const p of allPerms) {
                        const cat = getPermCategory(p.name);
                        if (!groups[cat]) groups[cat] = [];
                        groups[cat].push(p);
                      }
                      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([category, perms]) => (
                        <Box key={category} sx={{ mb: 3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontWeight: 700,
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "#605DFF",
                              mb: 1,
                              pb: "4px",
                              borderBottom: "1px solid #eceef2",
                            }}
                          >
                            {category}
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "2px 0" }}>
                            {perms.map((perm) => {
                              const inherited = inheritedPerms.find((ip) => ip.name === perm.name);
                              const isInherited = Boolean(inherited);
                              const isChecked = isInherited || directChecked.has(perm.name);

                              const switchEl = (
                                <FormControlLabel
                                  key={perm.name}
                                  sx={{ width: isInherited ? "100%" : "50%", m: 0, pr: 1 }}
                                  control={
                                    <Switch
                                      size="small"
                                      checked={isChecked}
                                      disabled={isInherited}
                                      onChange={(e) => {
                                        setDirectChecked((prev) => {
                                          const next = new Set(prev);
                                          if (e.target.checked) next.add(perm.name);
                                          else next.delete(perm.name);
                                          return next;
                                        });
                                      }}
                                      sx={{
                                        "& .MuiSwitch-switchBase.Mui-checked": {
                                          color: isInherited ? "#9e9e9e" : "#605DFF",
                                        },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                          backgroundColor: isInherited ? "#bdbdbd" : "#605DFF",
                                        },
                                      }}
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                      <Typography sx={{ fontSize: "12px" }}>{perm.name}</Typography>
                                      {isInherited && (
                                        <Chip
                                          label="role"
                                          size="small"
                                          sx={{ height: 16, fontSize: "10px", bgcolor: "#F0EFFF", color: "#605DFF", "& .MuiChip-label": { px: "5px" } }}
                                        />
                                      )}
                                    </Box>
                                  }
                                />
                              );

                              return isInherited ? (
                                <Tooltip
                                  key={perm.name}
                                  title={`Inherited from: ${inherited!.via_roles.join(", ")}`}
                                  placement="top"
                                  arrow
                                >
                                  <span style={{ display: "inline-flex", width: "50%" }}>{switchEl}</span>
                                </Tooltip>
                              ) : switchEl;
                            })}
                          </Box>
                        </Box>
                      ));
                    })()}

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "10px", mt: 2, pt: 2, borderTop: "1px solid #eceef2" }}>
                      <Button
                        onClick={() => setEditOpen(false)}
                        variant="outlined"
                        color="error"
                        sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", padding: "8px 24px" }}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={saveOverrides}
                        variant="contained"
                        disabled={permSaving}
                        sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", padding: "8px 24px", color: "#fff !important" }}
                      >
                        {permSaving ? <CircularProgress size={15} color="inherit" sx={{ mr: 1 }} /> : null}
                        Save Overrides
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            )}

          </Box>
        </Box>
      </BootstrapDialog>
    </>
  );
};

export default UsersList;
