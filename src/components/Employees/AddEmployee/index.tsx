"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
  CircularProgress,
  Autocomplete,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "@/api/api";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserOption {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface DeptRoleRow {
  department_id: number | "";
  role_name: string;
  roles: Role[];
  loadingRoles: boolean;
}

interface CommissionSlab {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number | null;
  percentage: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

const AddEmployee: React.FC = () => {
  // ── User selection ────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ── RBAC — multiple dept+role rows ────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptRoleRows, setDeptRoleRows] = useState<DeptRoleRow[]>([
    { department_id: "", role_name: "", roles: [], loadingRoles: false },
  ]);

  // ── Employee-specific fields ──────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState("active");
  const [photo, setPhoto] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalEmailError, setPersonalEmailError] = useState("");
  const [cnic, setCnic] = useState("");

  // ── Financial ─────────────────────────────────────────────────────────────
  const [basicSalary, setBasicSalary] = useState("");
  const [commissionSlabs, setCommissionSlabs] = useState<CommissionSlab[]>([]);
  const [selectedSlabIds, setSelectedSlabIds] = useState<number[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch users without an employee record on mount ───────────────────────
  useEffect(() => {
    setLoadingUsers(true);
    api
      .get<UserOption[]>("/api/users?without_employee=1")
      .then((res) => setUsers(res.data))
      .finally(() => setLoadingUsers(false));
  }, []);

  // ── Fetch departments on mount ────────────────────────────────────────────
  useEffect(() => {
    api.get<Department[]>("/api/departments").then((res) => setDepartments(res.data));
  }, []);

  // ── Fetch commission slabs on mount ──────────────────────────────────────
  useEffect(() => {
    api.get<CommissionSlab[]>("/api/finance/commission-slabs")
      .then((res) => setCommissionSlabs(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // ── Dept+Role row helpers ─────────────────────────────────────────────────
  const addDeptRoleRow = () =>
    setDeptRoleRows((prev) => [
      ...prev,
      { department_id: "", role_name: "", roles: [], loadingRoles: false },
    ]);

  const removeDeptRoleRow = (idx: number) =>
    setDeptRoleRows((prev) => prev.filter((_, i) => i !== idx));

  const updateDeptRoleRow = <K extends keyof DeptRoleRow>(
    idx: number,
    key: K,
    value: DeptRoleRow[K]
  ) =>
    setDeptRoleRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });

  const handleDepartmentChange = (idx: number, deptId: number | "") => {
    updateDeptRoleRow(idx, "department_id", deptId);
    updateDeptRoleRow(idx, "role_name", "");
    updateDeptRoleRow(idx, "roles", []);

    if (!deptId) return;

    updateDeptRoleRow(idx, "loadingRoles", true);
    api
      .get<Role[]>(`/api/roles?department_id=${deptId}`)
      .then((res) => updateDeptRoleRow(idx, "roles", res.data))
      .finally(() => updateDeptRoleRow(idx, "loadingRoles", false));
  };

  const validatePersonalEmail = (val: string) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setPersonalEmailError(ok || val === "" ? "" : "Invalid email format");
  };

  // ── Reset form ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedUser(null);
    setDeptRoleRows([{ department_id: "", role_name: "", roles: [], loadingRoles: false }]);
    setPhone("");
    setAddress("");
    setHireDate("");
    setStatus("active");
    setPhoto("");
    setBasicSalary("");
    setSelectedSlabIds([]);
    setEmergencyContact("");
    setPersonalEmail("");
    setCnic("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }
    if (deptRoleRows.some((r) => !r.department_id || !r.role_name)) {
      setError("Each department row must have a department and a role selected.");
      return;
    }
    if (personalEmailError) {
      setError("Fix the personal email before submitting.");
      return;
    }

    const departmentsPayload = deptRoleRows.map((r) => ({
      department_id: r.department_id,
      role_name: r.role_name,
    }));

    setSubmitting(true);
    try {
      await api.post("/api/employees", {
        // User selection
        user_id: selectedUser.id,
        // RBAC — multi-department
        departments: departmentsPayload,
        // Employee details
        phone,
        address,
        hire_date: hireDate,
        status,
        photo,
        // Financial
        basic_salary: basicSalary,
        slab_ids: selectedSlabIds,
        // Extra info
        emergency_contact: emergencyContact,
        personal_email: personalEmail,
        cnic,
      });

      setSuccess("Employee created successfully!");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      resetForm();
    } catch (err: any) {
      const apiError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : null) ||
        "An error occurred while creating the employee.";
      setError(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card sx={{ m: 3, p: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>

          {/* ── User Selection ────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              User Account
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={users}
              loading={loadingUsers}
              value={selectedUser}
              onChange={(_, val) => setSelectedUser(val)}
              getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User"
                  variant="filled"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingUsers ? (
                          <CircularProgress color="inherit" size={18} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText="Only users not yet linked to an employee are shown"
                />
              )}
            />
          </Grid>

          {/* ── Departments & Roles ───────────────────────────────────── */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Departments &amp; Roles
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addDeptRoleRow}
              >
                Add Department
              </Button>
            </Box>
            <Divider />
          </Grid>

          {deptRoleRows.map((row, idx) => (
            <React.Fragment key={idx}>
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth variant="filled" required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={row.department_id}
                    onChange={(e) => handleDepartmentChange(idx, e.target.value as number)}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id} sx={{ color: "text.primary" }}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={5}>
                <FormControl
                  fullWidth
                  variant="filled"
                  required
                  disabled={!row.department_id || row.loadingRoles}
                >
                  <InputLabel>
                    {row.loadingRoles ? "Loading roles…" : "Role"}
                  </InputLabel>
                  <Select
                    value={row.role_name}
                    onChange={(e) => updateDeptRoleRow(idx, "role_name", e.target.value as string)}
                  >
                    {row.roles.length === 0 ? (
                      <MenuItem disabled value="" sx={{ color: "text.primary" }}>
                        {row.department_id ? "No roles in this department" : "Select a department first"}
                      </MenuItem>
                    ) : (
                      row.roles.map((role) => (
                        <MenuItem key={role.id} value={role.name} sx={{ color: "text.primary" }}>
                          {role.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2} sx={{ display: "flex", alignItems: "center" }}>
                {idx === 0 ? (
                  <Chip
                    label="Primary"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ) : (
                  <IconButton
                    color="error"
                    onClick={() => removeDeptRoleRow(idx)}
                    title="Remove department"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </React.Fragment>
          ))}

          {/* ── Employee Details ─────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
              Employee Details
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone"
              variant="filled"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Address"
              variant="filled"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Hire Date"
              variant="filled"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="filled" required>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="active" sx={{ color: "text.primary" }}>Active</MenuItem>
                <MenuItem value="inactive" sx={{ color: "text.primary" }}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Emergency Contact"
              variant="filled"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Personal Email"
              variant="filled"
              value={personalEmail}
              onChange={(e) => {
                setPersonalEmail(e.target.value);
                validatePersonalEmail(e.target.value);
              }}
              fullWidth
              error={Boolean(personalEmailError)}
              helperText={personalEmailError}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="CNIC"
              variant="filled"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              fullWidth
            />
          </Grid>

          {/* ── Financial ────────────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1, mb: 1 }}>
              Financial
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Basic Salary"
              variant="filled"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="filled">
              <InputLabel>Commission Slabs</InputLabel>
              <Select
                multiple
                value={selectedSlabIds}
                onChange={(e) => setSelectedSlabIds(e.target.value as number[])}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as number[]).map((id) => {
                      const slab = commissionSlabs.find((s) => s.id === id);
                      return slab ? (
                        <Chip
                          key={id}
                          label={`${slab.name} (${slab.percentage}%)`}
                          size="small"
                          sx={{ bgcolor: "#605DFF22", color: "#605DFF", fontWeight: 600 }}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {commissionSlabs.map((slab) => (
                  <MenuItem key={slab.id} value={slab.id} sx={{ color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
                      <span>{slab.name}</span>
                      <Typography component="span" fontSize={12} color="text.secondary">
                        {slab.percentage}%
                        {slab.max_amount != null
                          ? ` · £${Number(slab.min_amount).toLocaleString()} – £${Number(slab.max_amount).toLocaleString()}`
                          : ` · £${Number(slab.min_amount).toLocaleString()}+`}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* ── Alerts ───────────────────────────────────────────────────────── */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <AlertTitle>Success</AlertTitle>
            {success}{" "}
            <Link href="/employees/employees-list">
              View Employee List →
            </Link>
          </Alert>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 2,
            justifyContent: "center",
          }}
        >
          <Button
            type="button"
            variant="contained"
            color="error"
            sx={{ textTransform: "capitalize", borderRadius: "8px", px: 3 }}
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: "capitalize", borderRadius: "8px", px: 3 }}
          >
            {submitting ? (
              <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
            ) : (
              <i
                className="material-symbols-outlined"
                style={{ fontSize: 18, marginRight: 6 }}
              >
                person_add
              </i>
            )}
            {submitting ? "Creating…" : "Add Employee"}
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default AddEmployee;
