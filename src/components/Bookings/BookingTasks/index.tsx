"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import api from "@/api/api";

interface BookingTask {
  id: number;
  booking_id: number;
  department_id: number | null;
  assigned_employee_id: number | null;
  service_type: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  booking: { id: number; booking_number: string; booking_type: string; departure_date: string; status: string } | null;
  department: { id: number; name: string } | null;
  assigned_employee: { id: number; user: { id: number; name: string } } | null;
}

interface Employee {
  id: number;
  user: { id: number; name: string };
}

interface Department {
  id: number;
  name: string;
}

const SERVICE_COLORS: Record<string, string> = {
  flight:    "#605DFF",
  hotel:     "#2196f3",
  visa:      "#ff9800",
  transport: "#4caf50",
  activity:  "#e91e63",
};

const STATUS_COLORS: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  pending:     "warning",
  in_progress: "info",
  completed:   "success",
  cancelled:   "error",
};

export default function BookingTasks() {
  const [tasks, setTasks]           = useState<BookingTask[]>([]);
  const [employees, setEmployees]   = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus]         = useState("all");
  const [filterService, setFilterService]       = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

  // Assign dialog
  const [assignTask, setAssignTask]         = useState<BookingTask | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [assignNotes, setAssignNotes]           = useState("");
  const [assignLoading, setAssignLoading]       = useState(false);
  const [assignError, setAssignError]           = useState<string | null>(null);

  // Status dialog
  const [statusTask, setStatusTask]   = useState<BookingTask | null>(null);
  const [newStatus, setNewStatus]     = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterService !== "all") params.service_type = filterService;
      if (filterDepartment !== "all") params.department_id = filterDepartment;
      const res = await api.get("/api/booking-tasks", { params });
      setTasks(res.data);
    } catch {
      setError("Failed to load booking tasks.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterService, filterDepartment]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    api.get("/api/employees").then((r) => setEmployees(r.data)).catch(() => {});
    api.get("/api/departments").then((r) => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleAssignOpen = (task: BookingTask) => {
    setAssignTask(task);
    setSelectedEmployee(
      task.assigned_employee
        ? employees.find((e) => e.id === task.assigned_employee_id) ?? null
        : null
    );
    setAssignNotes(task.notes ?? "");
    setAssignError(null);
  };

  const handleAssignSave = async () => {
    if (!assignTask || !selectedEmployee) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      await api.put(`/api/booking-tasks/${assignTask.id}/assign`, {
        employee_id: selectedEmployee.id,
        notes: assignNotes || undefined,
      });
      setAssignTask(null);
      fetchTasks();
    } catch (err: any) {
      setAssignError(err.response?.data?.message ?? "Assignment failed.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleStatusOpen = (task: BookingTask) => {
    setStatusTask(task);
    setNewStatus(task.status);
    setStatusNotes(task.notes ?? "");
  };

  const handleStatusSave = async () => {
    if (!statusTask) return;
    setStatusLoading(true);
    try {
      await api.put(`/api/booking-tasks/${statusTask.id}/status`, {
        status: newStatus,
        notes: statusNotes || undefined,
      });
      setStatusTask(null);
      fetchTasks();
    } finally {
      setStatusLoading(false);
    }
  };

  const hasFilters = filterStatus !== "all" || filterService !== "all" || filterDepartment !== "all";

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "7px",
          mb: "25px",
          p: { xs: "18px", sm: "20px", lg: "25px" },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            Booking Tasks
          </Typography>
          <Button variant="outlined" size="small" onClick={fetchTasks} sx={{ textTransform: "capitalize" }}>
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Service</InputLabel>
            <Select value={filterService} label="Service" onChange={(e) => setFilterService(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="flight">Flight</MenuItem>
              <MenuItem value="hotel">Hotel</MenuItem>
              <MenuItem value="visa">Visa</MenuItem>
              <MenuItem value="transport">Transport</MenuItem>
              <MenuItem value="activity">Activity</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select value={filterDepartment} label="Department" onChange={(e) => setFilterDepartment(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button
              size="small"
              color="secondary"
              startIcon={<FilterListOffIcon />}
              onClick={() => { setFilterStatus("all"); setFilterService("all"); setFilterDepartment("all"); }}
              sx={{ textTransform: "capitalize" }}
            >
              Clear Filters
            </Button>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: "auto", alignSelf: "center" }}
          >
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 600, backgroundColor: "#f6f7f9", fontSize: "13px" } }}>
                  <TableCell>Booking #</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Departure</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500} color="primary">
                          {task.booking?.booking_number ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.service_type.charAt(0).toUpperCase() + task.service_type.slice(1)}
                          size="small"
                          sx={{
                            backgroundColor: SERVICE_COLORS[task.service_type] + "22",
                            color: SERVICE_COLORS[task.service_type],
                            fontWeight: 600,
                            fontSize: "11px",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {task.department?.name ?? <span style={{ color: "#aaa" }}>Unassigned</span>}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {task.assigned_employee?.user?.name ?? (
                            <span style={{ color: "#aaa" }}>Unassigned</span>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status.replace("_", " ")}
                          size="small"
                          color={STATUS_COLORS[task.status]}
                          sx={{ textTransform: "capitalize", fontSize: "11px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {task.booking?.departure_date ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="Assign to employee">
                            <IconButton size="small" color="primary" onClick={() => handleAssignOpen(task)}>
                              <AssignmentIndIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update status">
                            <IconButton size="small" color="success" onClick={() => handleStatusOpen(task)}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Assign Dialog */}
      <Dialog open={Boolean(assignTask)} onClose={() => setAssignTask(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#f6f7f9", fontWeight: 600 }}>
          Assign Task
          <IconButton
            onClick={() => setAssignTask(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="small"
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          {assignError && <Alert severity="error" sx={{ mb: 2 }}>{assignError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Booking: <strong>{assignTask?.booking?.booking_number}</strong> —{" "}
            {assignTask?.service_type} task
          </Typography>
          <Autocomplete
            options={employees}
            getOptionLabel={(e) => e.user?.name ?? ""}
            value={selectedEmployee}
            onChange={(_, v) => setSelectedEmployee(v)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField {...params} label="Select Employee" variant="filled" fullWidth />
            )}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            variant="filled"
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignTask(null)} sx={{ textTransform: "capitalize" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignSave}
            disabled={!selectedEmployee || assignLoading}
            sx={{ textTransform: "capitalize" }}
          >
            {assignLoading ? <CircularProgress size={18} /> : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={Boolean(statusTask)} onClose={() => setStatusTask(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#f6f7f9", fontWeight: 600 }}>
          Update Status
          <IconButton onClick={() => setStatusTask(null)} sx={{ position: "absolute", right: 8, top: 8 }} size="small">
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <FormControl fullWidth variant="filled" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            fullWidth
            variant="filled"
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusTask(null)} sx={{ textTransform: "capitalize" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStatusSave}
            disabled={statusLoading}
            sx={{ textTransform: "capitalize" }}
          >
            {statusLoading ? <CircularProgress size={18} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
