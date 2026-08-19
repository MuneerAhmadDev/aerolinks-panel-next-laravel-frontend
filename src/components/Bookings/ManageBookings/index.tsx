"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Button,
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
  useTheme,
  useMediaQuery,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CardContent,
  Typography,
  Chip,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import HistoryIcon from "@mui/icons-material/History";
import Paper from "@mui/material/Paper";
import { useDepartment } from "@/context/DepartmentContext";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import api from "@/api/api";
import Swal from "sweetalert2";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

interface Booking {
  id: string;
  booking_number: string;
  booking_date: string;
  departure_date: string;
  status: string;
  booking_type: string;
  selling_cost: number;
  payment_status: string;
  is_payment_overdue?: boolean;
  employee_id?: string;
  user_id: number;
  user: {         // ← instead of employee_id
    id: string;
    name: string;
    // …any other fields you actually get…
  };
}

interface Employee {
  // user: any;
  id: string;
  name: string;
  user: { id: string; name: string };
}

// Departure-proximity palette — muted accent tones (not flat red/orange) so
// the highlight reads as "pay attention" rather than "something is broken".
const URGENCY = {
  risk: { bg: "rgba(225,29,72,0.05)", stripe: "#e11d48", chipBg: "rgba(225,29,72,0.12)", chipText: "#be123c" },
  soon: { bg: "rgba(217,119,6,0.05)", stripe: "#d97706", chipBg: "rgba(217,119,6,0.12)", chipText: "#b45309" },
};

const daysUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const isDepartingSoon = (booking: Booking): boolean => {
  const days = daysUntil(booking.departure_date);
  return days !== null && days >= 0 && days <= 30;
};

// "Risky" = departing within 30 days with payment still outstanding —
// i.e. little runway left to chase the customer for the balance.
const isBookingRisky = (booking: Booking): boolean =>
  isDepartingSoon(booking) && Boolean(booking.is_payment_overdue);

const ManageBookings: React.FC = () => {
  const { isSuperAdmin, hasPermission } = useDepartment();
  const canViewTrash    = isSuperAdmin || hasPermission("view-trashed-bookings");
  const canRestore      = isSuperAdmin || hasPermission("restore-bookings");
  const canHardDelete   = isSuperAdmin || hasPermission("hard-delete-bookings");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trashedBookings, setTrashedBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [trashLoading, setTrashLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [departureDateFilter, setDepartureDateFilter] = useState<string>("");
  const [riskyOnly, setRiskyOnly] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  // Row selection for bulk PDF download
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  // Audit log
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // For detail dialog (view booking)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  // const selectedIds = selectedEmployees.map((e) => e.id);

  // 2) Build your array of selected IDs
  const selectedIds = selectedEmployees.map((e) => {
    // if your Employee.id is a string, coerce to number:
    return typeof e.id === "string" ? Number(e.id) : e.id;
  });


  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch bookings from your API endpoint.
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/api/bookings");
        setBookings(response.data);
        console.log(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Fetch employees for filter options.
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get("/api/employees");
        setEmployees(response.data);
        console.log(response.data);
      } catch (err) {
        console.error("Error fetching employees", err);
      }
    };
    fetchEmployees();
  }, []);

  // Filtering logic.
  const filteredBookings = bookings.filter((booking) => {
    console.log("booking:", booking);
    const matchesSearch =
      booking.booking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.booking_date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.departure_date.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || booking.status.toLowerCase() === statusFilter.toLowerCase();
      console.log("status filter:"+matchesStatus);
    const matchesDeparture =
      departureDateFilter === "" ||
      booking.departure_date.startsWith(departureDateFilter);
    // const matchesPayment =
    //   paymentStatusFilter === "all" ||
    //   booking.payment_status.toLowerCase() === paymentStatusFilter.toLowerCase();
      const matchesPayment =
      paymentStatusFilter === "all" ||
      booking.payment_status.toLowerCase() === paymentStatusFilter.toLowerCase();
    // const matchesEmployee =
    //   selectedEmployees.length === 0 ||
    //   // (booking.employee_id && selectedEmployees.some((emp) => emp.id === booking.employee_id));
    //   // (booking.employee_id && selectedEmployees.some(emp => emp.id === booking.employee_id));
    //   (booking.user &&
    //     selectedEmployees.some((emp) => emp.id === booking.user.id));
  //   const matchesEmployee =
  // selectedEmployees.length === 0 ||
  // (booking.user &&
  //   selectedEmployees.some((emp) => emp.id === booking.user.id));
  // const matchesEmployee =
  // selectedIds.length === 0 ||
  // selectedIds.includes(String(booking.user_id));
  const matchesEmployee =
  selectedIds.length === 0 || selectedIds.includes(booking.user_id);
    const matchesRisky = !riskyOnly || isBookingRisky(booking);
    return matchesSearch && matchesStatus && matchesDeparture && matchesPayment && matchesEmployee && matchesRisky;
  });

  const riskyCount = bookings.filter(isBookingRisky).length;

  // Define columns for DataGrid.
  const baseColumns: GridColDef[] = [
    {
      field: "booking_number",
      headerName: "Booking #",
      width: 160,
      renderCell: (params: GridRenderCellParams<any, Booking, any>) => (
        <Link href={`/bookings/view-booking/${params.row.booking_number}`} style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 600, color: "#605DFF", letterSpacing: 0.3 }}>
            {params.row.booking_number ?? "—"}
          </span>
        </Link>
      ),
    },
    { field: "booking_date", headerName: "Booking Date", flex: 1 },
    {
      field: "departure_date",
      headerName: "Departure Date",
      width: 200,
      renderCell: (params: GridRenderCellParams<any, Booking, any>) => {
        const booking = params.row;
        const risky = isBookingRisky(booking);
        const soon = !risky && isDepartingSoon(booking);
        return (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: "nowrap", overflow: "hidden", width: "100%" }}>
            <span style={{ whiteSpace: "nowrap" }}>{booking.departure_date ?? "—"}</span>
            {risky && (
              <Chip label="At Risk" size="small" sx={{ bgcolor: URGENCY.risk.chipBg, color: URGENCY.risk.chipText, fontWeight: 700, fontSize: 10, height: 19, flexShrink: 0 }} />
            )}
            {soon && (
              <Chip label="Soon" size="small" sx={{ bgcolor: URGENCY.soon.chipBg, color: URGENCY.soon.chipText, fontWeight: 700, fontSize: 10, height: 19, flexShrink: 0 }} />
            )}
          </Stack>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams<any, Booking, any>) => {
        const status = (params.row.status ?? "").toLowerCase();
        const colorMap: Record<string, "warning" | "success" | "error" | "default"> = {
          pending: "warning",
          issued: "success",
          confirmed: "success",
          cancelled: "error",
        };
        return (
          <Chip
            label={params.row.status}
            size="small"
            color={colorMap[status] ?? "default"}
            variant="outlined"
            sx={{ textTransform: "capitalize", fontWeight: 600, fontSize: 11 }}
          />
        );
      },
    },
    { field: "booking_type", headerName: "Booking Type", flex: 1 },
    { field: "selling_cost", headerName: "Selling Cost", flex: 1 },
    {
      field: "payment_status",
      headerName: "Payment",
      width: 140,
      renderCell: (params: GridRenderCellParams<any, Booking, any>) => {
        const ps = (params.row.payment_status ?? "").toLowerCase();
        const colorMap: Record<string, "success" | "warning" | "error" | "default"> = {
          paid: "success",
          "partially paid": "warning",
          unpaid: "error",
        };
        return (
          <Chip
            label={params.row.payment_status}
            size="small"
            color={colorMap[ps] ?? "default"}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        );
      },
    },
  ];

  const actionColumn: GridColDef = {
    field: "actions",
    headerName: "Actions",
    width: 160,
    sortable: false,
    renderCell: (params: GridRenderCellParams<any, Booking, any>) => (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="View Booking">
          <Link href={`/bookings/view-booking/${params.row.booking_number}`}>
            <IconButton size="small" color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Link>
        </Tooltip>
        <Tooltip title="Edit Booking">
          <Link href={`/bookings/manage-bookings/${params.row.booking_number}`}>
            <IconButton size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Link>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="More Details">
          <IconButton
            size="small"
            onClick={() => { setDetailBooking(params.row); setDetailDialogOpen(true); }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
  };

  const columns: GridColDef[] = isSmallScreen
    ? [...baseColumns, actionColumn]
    : [...baseColumns, actionColumn];

  const handleDelete = async (bookingId: string) => {
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Booking deleted successfully.",
        confirmButtonText: "OK",
      });
      setBookings((prev) => prev.filter((bk) => bk.id !== bookingId));
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete booking. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleEdit = (booking: Booking) => {
    console.log("Edit booking:", booking);
  };

  const fetchTrashedBookings = async () => {
    setTrashLoading(true);
    try {
      const res = await api.get("/api/bookings/trashed");
      setTrashedBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTrashedBookings([]);
    } finally {
      setTrashLoading(false);
    }
  };

  const handleToggleTrash = () => {
    const next = !showTrash;
    setShowTrash(next);
    if (next && trashedBookings.length === 0) fetchTrashedBookings();
  };

  const fetchAuditLog = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("/api/bookings/audit-log");
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleToggleAuditLog = () => {
    const next = !showAuditLog;
    setShowAuditLog(next);
    if (next && auditLogs.length === 0) fetchAuditLog();
  };

  const handleRestore = async (id: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Restore Booking?",
      text: "This booking will be moved back to active bookings.",
      showCancelButton: true,
      confirmButtonText: "Restore",
      confirmButtonColor: "#4caf50",
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/api/bookings/${id}/restore`);
      setTrashedBookings(prev => prev.filter(b => b.id !== id));
      // Refresh active bookings list
      const res = await api.get("/api/bookings");
      setBookings(res.data);
      Swal.fire({ icon: "success", title: "Restored!", text: "Booking has been restored.", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to restore booking." });
    }
  };

  const handleHardDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Move to Trash?",
      html: "This booking will be <strong>permanently deleted in 30 days</strong>.<br>You will not be able to restore it after this.",
      showCancelButton: true,
      confirmButtonText: "Move to Trash",
      confirmButtonColor: "#f44336",
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/api/bookings/${id}/hard-delete`);
      setTrashedBookings(prev =>
        prev.map(b => b.id === id ? { ...b, trashed_at: new Date().toISOString() } as any : b)
      );
      Swal.fire({ icon: "success", title: "Moved to Trash", text: "Will be permanently deleted in 30 days.", timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error!", text: "Failed to hard delete booking." });
    }
  };

  const handleDownloadPdf = async () => {
    if (rowSelectionModel.length === 0) return;
    setPdfLoading(true);
    try {
      const response = await api.post(
        "/api/bookings/pdf",
        { booking_ids: rowSelectionModel },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = rowSelectionModel.length === 1
        ? `invoice-${rowSelectionModel[0]}.pdf`
        : `invoices-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to generate PDF. Please try again." });
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrintPdf = async () => {
    if (rowSelectionModel.length === 0) return;
    setPrintLoading(true);
    try {
      const response = await api.post(
        "/api/bookings/pdf",
        { booking_ids: rowSelectionModel },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to generate PDF. Please try again." });
    } finally {
      setPrintLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error)
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );

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
        {/* Toolbar: title + search + actions */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
              {rowSelectionModel.length > 0 && ` · ${rowSelectionModel.length} selected`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              variant="outlined"
              placeholder="Search by number, date…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ width: { xs: "100%", sm: 240 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {rowSelectionModel.length > 0 && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={pdfLoading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading || printLoading}
                  sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 600 }}
                >
                  {pdfLoading ? "Generating…" : `PDF (${rowSelectionModel.length})`}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={printLoading ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />}
                  onClick={handlePrintPdf}
                  disabled={pdfLoading || printLoading}
                  sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 600 }}
                >
                  {printLoading ? "Generating…" : `Print (${rowSelectionModel.length})`}
                </Button>
              </>
            )}

            {canViewTrash && (
              <Button
                variant={showTrash ? "contained" : "outlined"}
                color="error"
                size="small"
                startIcon={<DeleteSweepIcon />}
                onClick={handleToggleTrash}
                sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 600 }}
              >
                {showTrash ? "Hide Trash" : "Trash Bin"}
              </Button>
            )}

            <Button
              variant={showAuditLog ? "contained" : "outlined"}
              color="secondary"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={handleToggleAuditLog}
              sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 600 }}
            >
              {showAuditLog ? "Hide Log" : "Audit Log"}
            </Button>

            <Link href="/bookings/add-booking">
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                sx={{ borderRadius: "7px", textTransform: "none", fontWeight: 600 }}
              >
                Add Booking
              </Button>
            </Link>
          </Stack>
        </Stack>

        {/* Filter Row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="issued">Issued</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="payment-filter-label">Payment</InputLabel>
            <Select
              labelId="payment-filter-label"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              label="Payment"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="partially paid">Partially Paid</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Departure Date"
            type="date"
            size="small"
            value={departureDateFilter}
            onChange={(e) => setDepartureDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={employees}
            getOptionLabel={(option) => option.user.name}
            value={selectedEmployees}
            onChange={(event, newValue) => setSelectedEmployees(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.user.name}
                {/* {option.user.name} */}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Employees"
                placeholder="Filter by Employee"
                size="small"
              />
            )}
            sx={{ minWidth: 200 }}
          />

          <Chip
            label={`At Risk${riskyCount > 0 ? ` (${riskyCount})` : ""}`}
            clickable
            onClick={() => setRiskyOnly((v) => !v)}
            icon={<span style={{ fontSize: 13, lineHeight: 1 }}>⚠</span>}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: 12,
              height: 32,
              px: 0.5,
              bgcolor: riskyOnly ? URGENCY.risk.stripe : URGENCY.risk.chipBg,
              color: riskyOnly ? "#fff" : URGENCY.risk.chipText,
              "& .MuiChip-icon": { color: riskyOnly ? "#fff" : URGENCY.risk.chipText },
              "&:hover": { bgcolor: riskyOnly ? URGENCY.risk.stripe : URGENCY.risk.chipBg, opacity: 0.9 },
            }}
          />

          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => {
              setStatusFilter("all");
              setPaymentStatusFilter("all");
              setDepartureDateFilter("");
              setSelectedEmployees([]);
              setSearchQuery("");
              setRiskyOnly(false);
            }}
          >
            Reset Filters
          </Button>
        </Box>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            autoHeight
            rows={filteredBookings}
            columns={columns}
            getRowId={(row) => row.id}
            checkboxSelection
            disableRowSelectionOnClick
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(model) => setRowSelectionModel(model)}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 20]}
            getRowClassName={(params) =>
              isBookingRisky(params.row) ? "row-risky" : isDepartingSoon(params.row) ? "row-soon" : ""
            }
            rowHeight={56}
            sx={{
              "& .MuiDataGrid-cell": { whiteSpace: "normal", wordWrap: "break-word", display: "flex", alignItems: "center" },
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f6f7f9" },
              "& .row-risky": { bgcolor: URGENCY.risk.bg, borderLeft: `3px solid ${URGENCY.risk.stripe}` },
              "& .row-soon": { bgcolor: URGENCY.soon.bg, borderLeft: `3px solid ${URGENCY.soon.stripe}` },
            }}
          />
        </Box>
      </Card>

      {/* ── Trash Bin ─────────────────────────────────────────────────────── */}
      {showTrash && canViewTrash && (
        <Card sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: "18px", sm: "20px", lg: "25px" }, border: "1.5px solid #f44336" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={700} color="error.main" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DeleteSweepIcon /> Trash Bin
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Soft-deleted bookings · SuperAdmins can restore or permanently delete
              </Typography>
            </Box>
            <Button size="small" variant="outlined" color="error" onClick={fetchTrashedBookings} disabled={trashLoading}>
              {trashLoading ? <CircularProgress size={14} /> : "Refresh"}
            </Button>
          </Stack>

          {trashLoading ? (
            <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress /></Box>
          ) : trashedBookings.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">Trash is empty.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fef2f2" }}>
                    <TableCell><strong>Booking #</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Deleted</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trashedBookings.map((b: any) => (
                    <TableRow key={b.id} sx={{ opacity: b.trashed_at ? 0.7 : 1 }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          {b.booking_number}
                        </Typography>
                        {b.trashed_at && (
                          <Chip label="In Trash · 30-day purge" size="small" color="error" variant="outlined"
                            sx={{ height: 16, fontSize: 10, mt: 0.25 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{b.booking_type}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {b.deleted_at ? new Date(b.deleted_at).toLocaleDateString() : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={b.status} size="small" variant="outlined" sx={{ textTransform: "capitalize", fontSize: 11 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {canRestore && !b.trashed_at && (
                            <Tooltip title="Restore Booking">
                              <IconButton size="small" color="success" onClick={() => handleRestore(b.id)}>
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canHardDelete && !b.trashed_at && (
                            <Tooltip title="Move to Trash (30-day purge)">
                              <IconButton size="small" color="error" onClick={() => handleHardDelete(b.id)}>
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {b.trashed_at && (
                            <Chip label={`Purges ${new Date(new Date(b.trashed_at).getTime() + 30 * 86400000).toLocaleDateString()}`}
                              size="small" color="error" sx={{ fontSize: 10 }} />
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>
      )}

      {/* ── Global Audit Log ──────────────────────────────────────────────── */}
      {showAuditLog && (
        <Card sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: "18px", sm: "20px", lg: "25px" }, border: "1.5px solid #605DFF" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1, color: "#605DFF" }}>
                <HistoryIcon /> Booking Audit Log
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All create / update / delete events across all bookings
              </Typography>
            </Box>
            <Button size="small" variant="outlined" color="secondary" onClick={fetchAuditLog} disabled={auditLoading}>
              {auditLoading ? <CircularProgress size={14} /> : "Refresh"}
            </Button>
          </Stack>

          {auditLoading ? (
            <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress /></Box>
          ) : auditLogs.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No activity recorded yet.</Typography>
            </Box>
          ) : (
            <Box sx={{ position: "relative", pl: 1, maxHeight: 520, overflowY: "auto" }}>
              {/* Vertical spine */}
              <Box sx={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 2, bgcolor: "divider", zIndex: 0 }} />
              <Stack spacing={1.5}>
                {auditLogs.map((log: any, idx: number) => {
                  const isCreated = log.event === "created";
                  const isDeleted = log.event === "deleted";
                  const dotColor  = isCreated ? "success.main" : isDeleted ? "error.main" : "primary.main";
                  const dotIcon   = isCreated ? "add_circle" : isDeleted ? "delete" : "edit";
                  const changed   = log.properties?.attributes
                    ? Object.entries(log.properties.attributes as Record<string, unknown>).filter(([k]) => k !== "updated_at")
                    : [];
                  const bNum = log.booking_number ?? log.subject?.booking_number;
                  return (
                    <Box key={log.id ?? idx} sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        bgcolor: dotColor, display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#fff", zIndex: 1,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      }}>
                        <i className="material-symbols-outlined" style={{ fontSize: 18 }}>{dotIcon}</i>
                      </Box>
                      <Paper elevation={0} sx={{ flex: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {log.description}
                            {bNum && (
                              <Link href={`/bookings/view-booking/${bNum}`} style={{ marginLeft: 6, color: "#605DFF", fontSize: 12 }}>
                                #{bNum}
                              </Link>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.created_at).toLocaleString()}
                          </Typography>
                        </Stack>
                        {log.causer && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                            by {log.causer.name} ({log.causer.email})
                          </Typography>
                        )}
                        {changed.length > 0 && (
                          <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {changed.slice(0, 6).map(([k, v]) => (
                              <Chip
                                key={k}
                                label={`${k}: ${String(v ?? "").slice(0, 35)}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: 10 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Card>
      )}

      {/* Detail Dialog for Booking */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Booking Details</DialogTitle>

        <DialogContent>
          {detailBooking && (
            <>
              {/* — Header with QR code — */}
              <Card elevation={0} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container alignItems="center">
                    <Grid item xs={4}>
                      <Typography>
                        Booking #:{" "}
                        <Typography component="span" color="text.secondary">
                          {detailBooking.booking_number}
                        </Typography>
                      </Typography>
                      <Typography>
                        Booked By:
                        <Typography color="text.secondary">
                          {detailBooking.user.name}
                        </Typography>
                      </Typography>
                    </Grid>

                    <Grid item xs={4} textAlign="center">
                      {/* <Image
                        src="/images/qr-code.svg"
                        alt="QR code"
                        width={120}
                        height={120}
                      /> */}
                    </Grid>

                    <Grid item xs={4} textAlign="right">
                      <Typography>
                        Date:{" "}
                        <Typography component="span" color="text.secondary">
                          {detailBooking.booking_date}
                        </Typography>
                      </Typography>
                      {/* <Typography>
                        Pay To:
                        <Typography color="text.secondary">
                          Acme Travel Co.
                        </Typography>
                      </Typography> */}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* — All booking fields in a table — */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Field</strong></TableCell>
                    <TableCell><strong>Value</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(detailBooking).map(([key, val]) => (
                    <TableRow key={key}>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        {/* handle nested user.name specially */}
                        {key === "user"
                          ? (val as any).name
                          : String(val)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* — Print / Download — */}
              <Box
                display="flex"
                justifyContent="center"
                gap={2}
                mt={2}
                flexWrap="wrap"
              >
                <Button variant="contained" color="error">
                  Print
                </Button>
                <Button variant="contained" color="primary">
                  Download
                </Button>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ManageBookings;
