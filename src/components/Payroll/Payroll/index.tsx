"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Autocomplete,
  Checkbox,
  ListItemText,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import api from "@/api/api";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

// ---------------- Data Types ----------------
interface Employee {
  id: number;
  name?: string;
  email: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Payroll {
  id: number | string;
  // Either a full employee object or an employee_id reference
  employee?: {
    id: number;
    name?: string;
    user?: {
      id: number;
      name: string;
    };
  };
  employee_id?: number;
  payment_date: string; // Format: YYYY-MM-DD
  paymonth: string; // May be "yyyy-mm" or "yyyy-mm-dd"
  commission_amount: number;
  net_salary: number;
  deduction: number;
  allowance: number;
  overtime: number;
  bonus: number;
  bonus_type?: { id: number; name: string } | null;
  gross_salary: number;
  payment_method: string;
  bank_name: string;
  account_number: string;
  cheque_number: string;
  note: string;
  status: string;
  attachment?: string;
  salary?: {
    id: number;
    employee_id: number;
    basic_salary: number;
    employee: {
      id: number;
      user: {
        name: string;
      };
    };    
  };  
}

// ---------------- Helper Functions ----------------
// Returns the employee name for a payroll record
const getEmployeeName = (p: Payroll, employees: Employee[]): string => {
  if (p.employee) {
    // Try top-level name first, then nested user.name
    return p.employee.name || p.employee.user?.name || "";
  }
  if (p.employee_id) {
    const found = employees.find(
      (e) => p.employee_id && e.id.toString() === p.employee_id.toString()
    );
    return found?.name || found?.user?.name || "";
  }
  return "";
};

// Convert paymonth value to display as "MonthName YYYY"
// If paymonth is "yyyy-mm", append "-01"
const formatPaymonth = (pm: string): string => {
  if (!pm) return "";
  const dateString = pm.length === 7 ? `${pm}-01` : pm;
  return dayjs(dateString).format("MMMM YYYY");
};

// ---------------- Main Component ----------------
const Payroll: React.FC = () => {
  // Payroll list and employees
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [dateFilterStart, setDateFilterStart] = useState<string>(""); // From Payment Date
  const [dateFilterEnd, setDateFilterEnd] = useState<string>(""); // To Payment Date
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // UI messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Dialog state and fields
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [editPaymentDate, setEditPaymentDate] = useState<string>("");
  const [editPaymonth, setEditPaymonth] = useState<string>(""); // In yyyy-mm format
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  // Fetch payroll list and employees when component mounts
  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await api.get("/api/salary-details");
      setPayrolls(res.data);
    } catch (err: any) {
      setError("Failed to fetch payroll data.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employees");
      setEmployees(res.data);
    } catch (err: any) {
      setError("Failed to fetch employees.");
    }
  };

  // Filter payrolls based on search and filter criteria
  const filteredPayrolls = payrolls.filter((p) => {
    const empName = getEmployeeName(p, employees).toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      empName.includes(searchQuery.toLowerCase()) ||
      (p.payment_method || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.note || "").toLowerCase().includes(searchQuery.toLowerCase());

    const payrollEmpId = p.employee ? p.employee.id : p.employee_id;
    const matchesEmployee =
      selectedEmployees.length === 0 ||
      selectedEmployees.some(
        (emp) => emp.id.toString() === (payrollEmpId ? payrollEmpId.toString() : "")
      );

    const matchesDate =
      (!dateFilterStart || p.payment_date >= dateFilterStart) &&
      (!dateFilterEnd || p.payment_date <= dateFilterEnd);

    const matchesPaymentMethod =
      paymentMethodFilter === "" || p.payment_method === paymentMethodFilter;

    const matchesStatus = statusFilter === "" || p.status === statusFilter;

    return matchesSearch && matchesEmployee && matchesDate && matchesPaymentMethod && matchesStatus;
  });
  // console.log(filteredPayrolls.salary?.employee.user.name);
  filteredPayrolls.forEach((payroll) => {
    console.log(payroll?.salary?.employee?.user?.name || "No employee user name");
  });
  // Reset Filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedEmployees([]);
    setDateFilterStart("");
    setDateFilterEnd("");
    setPaymentMethodFilter("");
    setStatusFilter("");
  };

  // Delete a payroll
  const handleDelete = async (id: number | string) => {
    if (window.confirm("Are you sure you want to delete this payroll?")) {
      try {
        await api.delete(`/api/salary-details/${id}`);
        setSuccess("Payroll deleted successfully.");
        setPayrolls(payrolls.filter((p) => p.id !== id));
      } catch (err: any) {
        setError("Failed to delete payroll.");
      }
    }
  };

  // Open edit dialog and prefill form fields
  const handleEdit = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setEditPaymentDate(payroll.payment_date);
    // Convert paymonth to yyyy-mm for display (if it comes as yyyy-mm-dd, take first 7 characters)
    const pm = payroll.paymonth;
    setEditPaymonth(pm && pm.length >= 7 ? pm.slice(0, 7) : pm);
    setEditPaymentMethod(payroll.payment_method);
    setEditStatus(payroll.status);
    setEditNote(payroll.note);
    setOpenEditDialog(true);
  };

  // Handle submission of edit form
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPayroll) return;
    // Convert editPaymonth (yyyy-mm) to yyyy-mm-01 for API
    const updatedPaymonth =
      editPaymonth && editPaymonth.split("-").length === 2 ? `${editPaymonth}-01` : editPaymonth;
    const updatedPayroll = {
      ...selectedPayroll,
      payment_date: editPaymentDate,
      paymonth: updatedPaymonth,
      payment_method: editPaymentMethod,
      status: editStatus,
      note: editNote,
    };
    try {
      const res = await api.put(`/api/salary-details/${selectedPayroll.id}`, updatedPayroll);
      setPayrolls(payrolls.map((p) => (p.id === selectedPayroll.id ? res.data : p)));
      setSuccess("Payroll updated successfully.");
      setOpenEditDialog(false);
      setSelectedPayroll(null);
    } catch (err: any) {
      setError("Failed to update payroll.");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* <Typography variant="h4" sx={{ mb: 2 }}>
        Payroll List
      </Typography> */}

      {/* Filters */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Employee Filter as Autocomplete with Checkbox and disableCloseOnSelect */}
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={employees}
          getOptionLabel={(option) => option.name || option.user?.name || ""}
          value={selectedEmployees}
          onChange={(event, newValue) => setSelectedEmployees(newValue)}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                checkedIcon={<CheckBoxIcon fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name || option.user?.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Employees" placeholder="Select employees" />
          )}
          sx={{ minWidth: 200 }}
        />

        <TextField
          label="From Payment Date"
          type="date"
          value={dateFilterStart}
          onChange={(e) => setDateFilterStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To Payment Date"
          type="date"
          value={dateFilterEnd}
          onChange={(e) => setDateFilterEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={paymentMethodFilter}
            label="Payment Method"
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
            <MenuItem value="Cheque">Cheque</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={resetFilters}>
          Reset Filters
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Success</AlertTitle>
          {success}
        </Alert>
      )}

      {/* Payroll Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Pay Month</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Commission</TableCell>
              <TableCell>Gross Salary</TableCell>
              <TableCell>Net Salary</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayrolls.map((p) => (
              <TableRow key={p.salary?.employee.id}>
                {/* <TableCell>{getEmployeeName(p, employees) || "N/A"}</TableCell> */}
                <TableCell>{p.salary?.employee.user.name}</TableCell>
                <TableCell>{p.payment_date}</TableCell>
                <TableCell>{p.paymonth ? formatPaymonth(p.paymonth) : ""}</TableCell>
                <TableCell>{p.payment_method}</TableCell>
                <TableCell>{p.commission_amount}</TableCell>
                <TableCell>{p.gross_salary}</TableCell>
                <TableCell>{p.net_salary}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{p.note}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(p)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(p.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredPayrolls.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No payroll records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Payroll Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth>
        <DialogTitle>Edit Payroll</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent>
            {selectedPayroll && (
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Display Employee Name (non-editable) */}
                <TextField
                  label="Employee"
                  value={getEmployeeName(selectedPayroll, employees)}
                  fullWidth
                  disabled
                />
                <TextField
                  label="Payment Date"
                  type="date"
                  value={editPaymentDate}
                  onChange={(e) => setEditPaymentDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Pay Month"
                  type="month"
                  value={editPaymonth}
                  onChange={(e) => setEditPaymonth(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Will be converted to yyyy-mm-01"
                />
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={editPaymentMethod}
                    label="Payment Method"
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editStatus}
                    label="Status"
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Note"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Payroll;
