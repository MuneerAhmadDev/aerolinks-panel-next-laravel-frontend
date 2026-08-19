"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  AlertTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Checkbox,
  Typography,
  OutlinedInput,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import api from "@/api/api";
import Swal from "sweetalert2";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { useTheme, useMediaQuery } from "@mui/material";
import MoreIcon from "@mui/icons-material/MoreHoriz";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommissionSlab {
  id: number;
  name: string;
  percentage: number;
  min_amount: number;
  max_amount: number | null;
}

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  hire_date: string;
  status: string;
  photo?: string;
  basic_salary?: string;
  commission_slabs?: CommissionSlab[];
  emergency_contact?: string;
  personal_email?: string;
  cnic?: string;
  departments?: Department[];
  dep_names?: string;
}

// ── Tier colour palette ───────────────────────────────────────────────────────
const TIER_COLORS = ["#605DFF", "#2196f3", "#4caf50", "#ff9800", "#e91e63", "#9c27b0"];

const EmployeesList: React.FC = () => {
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments]       = useState<Department[]>([]);
  const [editDepartments, setEditDepartments] = useState<Department[]>([]);

  // Commission slabs (global list) + selected IDs for edit dialog
  const [allSlabs, setAllSlabs]           = useState<CommissionSlab[]>([]);
  const [editSlabIds, setEditSlabIds]     = useState<number[]>([]);

  const [statusFilter, setStatusFilter]     = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<Employee[]>([]);

  // Detail dialog (mobile)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailEmployee, setDetailEmployee]     = useState<Employee | null>(null);

  // Salary change fields (only matter when Basic Salary is actually edited —
  // the backend records a new history row instead of overwriting the old one)
  const [salaryEffectiveDate, setSalaryEffectiveDate] = useState<string>("");
  const [salaryReason, setSalaryReason] = useState<string>("");

  // Salary history dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<
    { id: number; basic_salary: string; effective_date: string; reason: string | null }[]
  >([]);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ── Fetch departments ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Error fetching departments", err));
  }, []);

  // ── Fetch global commission slabs ─────────────────────────────────────────
  useEffect(() => {
    api.get<CommissionSlab[]>("/api/finance/commission-slabs")
      .then((res) => setAllSlabs(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // ── Fetch employees ───────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/employees")
      .then((response) => {
        if (response.data) {
          const formatted: Employee[] = response.data.map((emp: any, index: number) => ({
            id:                emp.id ? emp.id.toString() : index.toString(),
            name:              emp.user?.name || "N/A",
            email:             emp.user?.email || "N/A",
            phone:             emp.phone || "",
            address:           emp.address || "",
            hire_date:         emp.hire_date || "",
            status:            emp.status || "active",
            photo:             emp.photo || "",
            basic_salary:      emp.salary?.basic_salary || "",
            commission_slabs:  emp.commission_slabs || [],
            emergency_contact: emp.emergency_contact || "",
            personal_email:    emp.personal_email || "",
            cnic:              emp.cnic || "",
            departments:       emp.departments || [],
            dep_names:
              emp.departments?.length > 0
                ? emp.departments.map((d: any) => d.name).join(", ")
                : "No Data",
          }));
          setEmployees(formatted);
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (employeeId: string) => {
    try {
      await api.delete(`/api/employees/${employeeId}`);
      Swal.fire({ icon: "success", title: "Deleted!", text: "Employee deleted successfully.", confirmButtonText: "OK" });
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to delete the employee.", confirmButtonText: "OK" });
    }
  };

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setEditSlabIds((employee.commission_slabs ?? []).map((s) => s.id));
    setEditDepartments(
      (employee.departments ?? []).map((d: any) => ({ id: d.id, name: d.name }))
    );
    setSalaryEffectiveDate(new Date().toISOString().split("T")[0]);
    setSalaryReason("");
    setDialogOpen(true);
  };

  const handleDialogClose = () => { setDialogOpen(false); setCurrentEmployee(null); };

  const handleViewHistory = async (employeeId: string) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/employees/${employeeId}/salary-history`);
      setSalaryHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSalaryHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleDialogSave = async () => {
    if (!currentEmployee) return;
    const payload = {
      phone:             currentEmployee.phone,
      address:           currentEmployee.address,
      hire_date:         currentEmployee.hire_date,
      status:            currentEmployee.status,
      photo:             currentEmployee.photo,
      basic_salary:          currentEmployee.basic_salary,
      salary_effective_date: salaryEffectiveDate || undefined,
      salary_reason:         salaryReason || undefined,
      emergency_contact: currentEmployee.emergency_contact,
      personal_email:    currentEmployee.personal_email,
      cnic:              currentEmployee.cnic,
      departments:       editDepartments.map((d) => Number(d.id)),
      slab_ids:          editSlabIds,
    };
    try {
      const response = await api.put(`/api/employees/${currentEmployee.id}`, payload);
      // Merge the saved slabs back into the local row
      const savedSlabs: CommissionSlab[] = editSlabIds
        .map((id) => allSlabs.find((s) => s.id === id))
        .filter(Boolean) as CommissionSlab[];

      const updatedEmployee: Employee = {
        ...currentEmployee,
        ...payload,
        id: currentEmployee.id,
        departments: editDepartments,
        commission_slabs: savedSlabs,
        dep_names: editDepartments.map((d) => d.name).join(", ") || "No Data",
      };
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === currentEmployee.id ? updatedEmployee : emp))
      );
      setDialogOpen(false);
    } catch (err: any) {
      console.error("Error saving employee:", err);
    }
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus   = statusFilter === "all" || emp.status === statusFilter;
    const matchesEmployee = employeeFilter.length === 0 || employeeFilter.some((f) => f.id === emp.id);
    return matchesSearch && matchesStatus && matchesEmployee;
  });

  // ── Columns ───────────────────────────────────────────────────────────────
  const baseColumns: GridColDef[] = [
    {
      field: "sr", headerName: "Sr#", width: 80,
      renderCell: (params: GridRenderCellParams) => {
        const index = filteredEmployees.findIndex((emp) => emp.id === params.row.id);
        return index + 1;
      },
    },
    { field: "name",      headerName: "Name",        flex: 1 },
    { field: "email",     headerName: "Email",       flex: 1 },
    { field: "phone",     headerName: "Phone",       flex: 1 },
    { field: "hire_date", headerName: "Hire Date",   flex: 1 },
    { field: "dep_names", headerName: "Departments", flex: 1 },
    {
      field: "status", headerName: "Status", width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <span style={{
          background: params.row.status === "active" ? "#d0f0c0" : "#f8d7da",
          padding: "3px 8px", borderRadius: "5px", textTransform: "capitalize", fontSize: 12,
        }}>
          {params.row.status}
        </span>
      ),
    },
    { field: "basic_salary", headerName: "Basic Salary", flex: 1 },
  ];

  const extraColumns: GridColDef[] = [
    {
      field: "commission_slabs",
      headerName: "Commission Slabs",
      flex: 1.5,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const slabs: CommissionSlab[] = params.row.commission_slabs ?? [];
        if (slabs.length === 0) {
          return <Typography fontSize={12} color="text.disabled">—</Typography>;
        }
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
            {slabs.map((slab, idx) => {
              const color = TIER_COLORS[idx % TIER_COLORS.length];
              return (
                <Chip
                  key={slab.id}
                  label={`${slab.name} · ${slab.percentage}%`}
                  size="small"
                  sx={{
                    bgcolor: color + "22",
                    color,
                    fontWeight: 700,
                    fontSize: 11,
                    height: 22,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              );
            })}
          </Box>
        );
      },
    },
    {
      field: "actions", headerName: "Actions", width: 100, sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" gap={1}>
          <IconButton size="small" onClick={() => handleEdit(params.row)} sx={{ color: "#605DFF" }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} sx={{ color: "#f44336" }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const moreColumn: GridColDef = {
    field: "more", headerName: "More", width: 80,
    renderCell: (params: GridRenderCellParams) => (
      <IconButton onClick={() => { setDetailEmployee(params.row); setDetailDialogOpen(true); }}>
        <MoreIcon />
      </IconButton>
    ),
  };

  const columns: GridColDef[] = isSmallScreen
    ? [...baseColumns, moreColumn]
    : [...baseColumns, ...extraColumns, moreColumn];

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <CircularProgress />;
  if (error)   return <Alert severity="error"><AlertTitle>Error</AlertTitle>{error}</Alert>;

  return (
    <>
      <Card sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: "18px", sm: "20px", lg: "25px" } }}>

        {/* Filter bar */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center", mb: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="all" sx={{ color: "text.primary" }}>All</MenuItem>
              <MenuItem value="active" sx={{ color: "text.primary" }}>Active</MenuItem>
              <MenuItem value="inactive" sx={{ color: "text.primary" }}>Inactive</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            disableCloseOnSelect multiple options={employees}
            getOptionLabel={(o) => o.name}
            onChange={(_, v) => setEmployeeFilter(v)}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }} checked={selected} />
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Employee" placeholder="Filter by employee" size="small" />
            )}
            sx={{ minWidth: 200 }}
          />

          <Button variant="outlined" color="secondary" size="small"
            onClick={() => { setStatusFilter("all"); setEmployeeFilter([]); setSearchQuery(""); }}>
            Reset Filters
          </Button>
        </Box>

        {/* Search + Add */}
        <Box sx={{ display: { xs: "block", sm: "flex" }, alignItems: "center", justifyContent: "space-between", mb: "25px" }}>
          <TextField
            variant="outlined" placeholder="Search employees..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} size="small"
            sx={{ width: { xs: "100%", sm: 300 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          />
          <Link href="/employees/add-employee">
            <Button variant="outlined" color="primary"
              sx={{ textTransform: "capitalize", borderRadius: "7px", fontWeight: 500, fontSize: "13px", py: "6px", px: "13px" }}>
              <AddIcon sx={{ position: "relative", top: "-1px" }} /> Add New Employee
            </Button>
          </Link>
        </Box>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            autoHeight rows={filteredEmployees} columns={columns}
            getRowId={(row) => row.id}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[5, 10, 20]}
            getRowHeight={() => "auto"}
            sx={{
              "& .MuiDataGrid-cell": { whiteSpace: "normal", wordWrap: "break-word", alignItems: "center", py: 0.5 },
            }}
          />
        </Box>

        {/* Mobile detail dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)}>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogContent>
            {detailEmployee && (
              <Box sx={{ p: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><strong>Name:</strong> {detailEmployee.name}</Grid>
                  <Grid item xs={12} sm={6}><strong>Email:</strong> {detailEmployee.email}</Grid>
                  <Grid item xs={12} sm={6}><strong>Phone:</strong> {detailEmployee.phone || "N/A"}</Grid>
                  <Grid item xs={12} sm={6}><strong>Address:</strong> {detailEmployee.address || "N/A"}</Grid>
                  <Grid item xs={12} sm={6}><strong>Hire Date:</strong> {detailEmployee.hire_date}</Grid>
                  <Grid item xs={12} sm={6}><strong>Status:</strong> {detailEmployee.status}</Grid>
                  <Grid item xs={12} sm={6}><strong>Basic Salary:</strong> {detailEmployee.basic_salary || "N/A"}</Grid>
                  <Grid item xs={12}>
                    <strong>Commission Slabs:</strong>{" "}
                    {(detailEmployee.commission_slabs ?? []).length === 0 ? (
                      <Typography component="span" fontSize={13} color="text.secondary">None assigned</Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                        {(detailEmployee.commission_slabs ?? []).map((s, idx) => (
                          <Chip key={s.id} label={`${s.name} · ${s.percentage}%`} size="small"
                            sx={{ bgcolor: TIER_COLORS[idx % TIER_COLORS.length] + "22", color: TIER_COLORS[idx % TIER_COLORS.length], fontWeight: 700 }} />
                        ))}
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}><strong>Emergency Contact:</strong> {detailEmployee.emergency_contact || "N/A"}</Grid>
                  <Grid item xs={12} sm={6}><strong>Personal Email:</strong> {detailEmployee.personal_email || "N/A"}</Grid>
                  <Grid item xs={12}><strong>CNIC:</strong> {detailEmployee.cnic || "N/A"}</Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Card>

      {/* ── Edit Employee Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Employee</DialogTitle>
        <DialogContent>
          <TextField label="Phone" value={currentEmployee?.phone || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, phone: e.target.value } : null)}
            fullWidth margin="dense" />
          <TextField label="Address" value={currentEmployee?.address || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, address: e.target.value } : null)}
            fullWidth margin="dense" />
          <TextField label="Hire Date" type="date" value={currentEmployee?.hire_date || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, hire_date: e.target.value } : null)}
            fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField label="Basic Salary" type="number" value={currentEmployee?.basic_salary || ""}
              onChange={(e) => setCurrentEmployee((p) => p ? { ...p, basic_salary: e.target.value } : null)}
              fullWidth margin="dense" />
            <Button
              size="small"
              sx={{ whiteSpace: "nowrap", mt: 1 }}
              onClick={() => currentEmployee && handleViewHistory(currentEmployee.id)}
            >
              History
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5, mb: 1 }}>
            Changing this amount records a new salary entry effective from the date below —
            it doesn&apos;t overwrite or affect past payslips.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField label="Effective From" type="date" value={salaryEffectiveDate}
              onChange={(e) => setSalaryEffectiveDate(e.target.value)}
              fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
            <TextField label="Reason (e.g. Promotion)" value={salaryReason}
              onChange={(e) => setSalaryReason(e.target.value)}
              fullWidth margin="dense" />
          </Box>
          <TextField label="Emergency Contact" variant="filled" value={currentEmployee?.emergency_contact || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, emergency_contact: e.target.value } : null)}
            fullWidth margin="dense" />
          <TextField label="Personal Email" type="email" variant="filled" value={currentEmployee?.personal_email || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, personal_email: e.target.value } : null)}
            fullWidth margin="dense" />
          <TextField label="CNIC" variant="filled" value={currentEmployee?.cnic || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, cnic: e.target.value } : null)}
            fullWidth margin="dense" />

          {/* Departments */}
          <Autocomplete
            multiple disableCloseOnSelect
            options={departments}
            getOptionLabel={(o) => o.name}
            value={editDepartments}
            onChange={(_, v) => setEditDepartments(v)}
            isOptionEqualToValue={(o, v) => o.id.toString() === v.id.toString()}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }} checked={selected} />
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Departments" variant="filled" margin="dense" />
            )}
          />

          {/* Commission Slabs — multi-select with Chips */}
          <FormControl fullWidth variant="filled" sx={{ mt: 1 }}>
            <InputLabel>Commission Slabs</InputLabel>
            <Select
              multiple
              value={editSlabIds}
              onChange={(e) => setEditSlabIds(e.target.value as number[])}
              input={<OutlinedInput label="Commission Slabs" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selected as number[]).map((id, idx) => {
                    const slab = allSlabs.find((s) => s.id === id);
                    return slab ? (
                      <Chip
                        key={id}
                        label={`${slab.name} (${slab.percentage}%)`}
                        size="small"
                        sx={{
                          bgcolor: TIER_COLORS[idx % TIER_COLORS.length] + "22",
                          color: TIER_COLORS[idx % TIER_COLORS.length],
                          fontWeight: 700,
                        }}
                      />
                    ) : null;
                  })}
                </Box>
              )}
            >
              {allSlabs.map((slab) => (
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

          {/* Status */}
          <TextField select label="Status" value={currentEmployee?.status || ""}
            onChange={(e) => setCurrentEmployee((p) => p ? { ...p, status: e.target.value } : null)}
            fullWidth margin="dense" SelectProps={{ native: true }}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} variant="outlined" color="inherit" sx={{ textTransform: "none", borderRadius: "6px" }}>
            Cancel
          </Button>
          <Button onClick={handleDialogSave} variant="contained" color="primary" sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none" }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Salary History Dialog ─────────────────────────────────────────── */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Salary History</DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : salaryHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No salary history recorded yet.
            </Typography>
          ) : (
            salaryHistory.map((entry, idx) => (
              <Box
                key={entry.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.25,
                  borderBottom: idx < salaryHistory.length - 1 ? "1px solid #eee" : "none",
                }}
              >
                <Box>
                  <Typography fontWeight={600}>{entry.basic_salary}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entry.reason || "No reason given"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2">Effective {entry.effective_date}</Typography>
                  {idx === 0 && (
                    <Chip label="Current" size="small" color="primary" sx={{ height: 18, fontSize: 10, mt: 0.5 }} />
                  )}
                </Box>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHistoryOpen(false)} variant="outlined" sx={{ textTransform: "none", borderRadius: "6px" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmployeesList;
