"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import api from "@/api/api";
import { useDepartment } from "@/context/DepartmentContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportBooking {
  id: number;
  booking_number: string;
  booking_date: string;
  departure_date: string;
  return_date: string;
  booking_type: string;
  status: string;
  passengers_count: number;
  selling_cost: number;
  payments: { amount: number }[];
  customers: { first_name: string; last_name: string; pivot: { is_leading: number } }[];
  user: { name: string } | null;
}

interface Summary {
  total_bookings: number;
  total_revenue: number;
  total_paid: number;
  outstanding: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

interface RevenueMonth {
  month: string;
  count: number;
  revenue: number;
  paid: number;
}

interface UserOption   { id: number; name: string }
interface DeptOption   { id: number; name: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusColor = (s: string): "success" | "warning" | "error" | "default" => {
  if (s === "issued")    return "success";
  if (s === "pending")   return "warning";
  if (s === "cancelled") return "error";
  return "default";
};

const payColor = (s: string): "success" | "warning" | "error" | "default" => {
  if (s === "Paid")           return "success";
  if (s === "Partially Paid") return "warning";
  if (s === "Unpaid")         return "error";
  return "default";
};

const getPayStatus = (b: ReportBooking) => {
  const paid = b.payments.reduce((s, p) => s + Number(p.amount), 0);
  if (paid >= Number(b.selling_cost)) return "Paid";
  if (paid > 0) return "Partially Paid";
  return "Unpaid";
};

const getLeadName = (b: ReportBooking) => {
  const lead = b.customers.find((c) => c.pivot?.is_leading) ?? b.customers[0];
  return lead ? `${lead.first_name} ${lead.last_name}`.trim() : "—";
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const { isSuperAdmin } = useDepartment();

  // ── Filter state ───────────────────────────────────────────────────────────
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [departureFrom,  setDepartureFrom]  = useState("");
  const [departureTo,    setDepartureTo]    = useState("");
  const [status,         setStatus]         = useState("");
  const [bookingType,    setBookingType]    = useState("");
  const [selectedUser,   setSelectedUser]   = useState<UserOption | null>(null);
  const [selectedDept,   setSelectedDept]   = useState<DeptOption | null>(null);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [bookings,       setBookings]       = useState<ReportBooking[]>([]);
  const [summary,        setSummary]        = useState<Summary | null>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueMonth[]>([]);
  const [users,          setUsers]          = useState<UserOption[]>([]);
  const [departments,    setDepartments]    = useState<DeptOption[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [csvLoading,     setCsvLoading]     = useState(false);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [hasLoaded,      setHasLoaded]      = useState(false);

  // ── Load filter meta ───────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/reports/meta").then((r) => {
      setUsers(r.data.employees ?? []);
      setDepartments(r.data.departments ?? []);
    });

    // Default date range: current month
    const now = new Date();
    setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
    setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]);
  }, []);

  // ── Build query params ─────────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (dateFrom)                  p.date_from      = dateFrom;
    if (dateTo)                    p.date_to        = dateTo;
    if (departureFrom)             p.departure_from = departureFrom;
    if (departureTo)               p.departure_to   = departureTo;
    if (status)                    p.status         = status;
    if (bookingType)               p.booking_type   = bookingType;
    if (selectedUser?.id)          p.user_id        = String(selectedUser.id);
    if (selectedDept?.id)          p.department_id  = String(selectedDept.id);
    return p;
  }, [dateFrom, dateTo, departureFrom, departureTo, status, bookingType, selectedUser, selectedDept]);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/reports/bookings", { params: buildParams() });
      setBookings(res.data.bookings ?? []);
      setSummary(res.data.summary ?? null);
      setRevenueByMonth(res.data.revenue_by_month ?? []);
      setHasLoaded(true);
    } catch {
      setError("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    setCsvLoading(true);
    try {
      const res = await api.get("/api/reports/export/csv", {
        params: buildParams(),
        responseType: "blob",
      });
      const url  = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href  = url;
      link.download = `bookings-report-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setError("Failed to export CSV.");
    } finally {
      setCsvLoading(false);
    }
  };

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await api.get("/api/reports/export/pdf", {
        params: buildParams(),
        responseType: "blob",
      });
      const url  = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.download = `bookings-report-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError("Failed to export PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── DataGrid columns ───────────────────────────────────────────────────────
  const columns: GridColDef[] = [
    {
      field: "booking_number",
      headerName: "Booking #",
      width: 130,
      renderCell: (p: GridRenderCellParams) => <strong>{p.value}</strong>,
    },
    { field: "booking_date",   headerName: "Booking Date",   width: 115 },
    { field: "departure_date", headerName: "Departure",      width: 115 },
    { field: "return_date",    headerName: "Return",         width: 115 },
    {
      field: "booking_type",
      headerName: "Type",
      width: 90,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={String(p.value).toUpperCase()} size="small" variant="outlined" sx={{ fontSize: 10 }} />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={String(p.value)} size="small" color={statusColor(String(p.value))} />
      ),
    },
    { field: "passengers_count", headerName: "Pax", width: 60, type: "number" },
    {
      field: "selling_cost",
      headerName: "Selling Cost",
      width: 120,
      type: "number",
      renderCell: (p: GridRenderCellParams) => `£${fmt(Number(p.value))}`,
    },
    {
      field: "paid",
      headerName: "Paid",
      width: 110,
      type: "number",
      valueGetter: (_v: unknown, row: ReportBooking) =>
        row.payments.reduce((s, p) => s + Number(p.amount), 0),
      renderCell: (p: GridRenderCellParams) => `£${fmt(Number(p.value))}`,
    },
    {
      field: "balance",
      headerName: "Outstanding",
      width: 115,
      type: "number",
      valueGetter: (_v: unknown, row: ReportBooking) => {
        const paid = row.payments.reduce((s, p) => s + Number(p.amount), 0);
        return Math.max(0, Number(row.selling_cost) - paid);
      },
      renderCell: (p: GridRenderCellParams) => `£${fmt(Number(p.value))}`,
    },
    {
      field: "payment_status",
      headerName: "Payment",
      width: 120,
      valueGetter: (_v: unknown, row: ReportBooking) => getPayStatus(row),
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={String(p.value)} size="small" color={payColor(String(p.value))} variant="outlined" />
      ),
    },
    {
      field: "lead_customer",
      headerName: "Lead Customer",
      width: 150,
      valueGetter: (_v: unknown, row: ReportBooking) => getLeadName(row),
    },
    {
      field: "created_by",
      headerName: "Created By",
      width: 130,
      valueGetter: (_v: unknown, row: ReportBooking) => row.user?.name ?? "—",
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ─── Filters ─── */}
      <Card
        sx={{ boxShadow: "none", borderRadius: "7px", p: { xs: "18px", sm: "20px", lg: "25px" }, mb: 3 }}
        className="rmui-card"
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: "#605DFF" }} />
          <Typography variant="subtitle1" fontWeight={700}>Report Filters</Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Booking date range */}
          <Grid item xs={6} sm={3}>
            <TextField label="Booking From" type="date" size="small" fullWidth value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Booking To" type="date" size="small" fullWidth value={dateTo}
              onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>

          {/* Departure date range */}
          <Grid item xs={6} sm={3}>
            <TextField label="Departure From" type="date" size="small" fullWidth value={departureFrom}
              onChange={(e) => setDepartureFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Departure To" type="date" size="small" fullWidth value={departureTo}
              onChange={(e) => setDepartureTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>

          {/* Status */}
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="issued">Issued</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Booking type */}
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={bookingType} label="Type" onChange={(e) => setBookingType(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="umrah">Umrah</MenuItem>
                <MenuItem value="holiday">Holiday</MenuItem>
                <MenuItem value="flight">Flight</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Created by (employee) */}
          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={users}
              getOptionLabel={(o) => o.name}
              value={selectedUser}
              onChange={(_e, v) => setSelectedUser(v)}
              size="small"
              renderInput={(params) => <TextField {...params} label="Created By" />}
            />
          </Grid>

          {/* Department (SuperAdmin only) */}
          {isSuperAdmin && (
            <Grid item xs={12} sm={3}>
              <Autocomplete
                options={departments}
                getOptionLabel={(o) => o.name}
                value={selectedDept}
                onChange={(_e, v) => setSelectedDept(v)}
                size="small"
                renderInput={(params) => <TextField {...params} label="Department" />}
              />
            </Grid>
          )}

          {/* Action buttons */}
          <Grid item xs={12} sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 0.5 }}>
            <Button
              variant="contained"
              onClick={fetchReport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <FilterListIcon />}
              sx={{ textTransform: "none", borderRadius: "6px" }}
            >
              {loading ? "Loading…" : "Run Report"}
            </Button>
            <Tooltip title={!hasLoaded ? "Run the report first" : ""}>
              <span>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={csvLoading ? <CircularProgress size={16} /> : <TableChartIcon />}
                  onClick={handleExportCsv}
                  disabled={!hasLoaded || csvLoading}
                  sx={{ textTransform: "none", borderRadius: "6px" }}
                >
                  Export CSV
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={!hasLoaded ? "Run the report first" : ""}>
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={pdfLoading ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
                  onClick={handleExportPdf}
                  disabled={!hasLoaded || pdfLoading}
                  sx={{ textTransform: "none", borderRadius: "6px" }}
                >
                  Export PDF
                </Button>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ─── Summary cards ─── */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Bookings", value: summary.total_bookings, color: "#605DFF", prefix: "" },
            { label: "Total Revenue",  value: summary.total_revenue,  color: "#2196f3", prefix: "£" },
            { label: "Total Collected",value: summary.total_paid,     color: "#4caf50", prefix: "£" },
            { label: "Outstanding",    value: summary.outstanding,    color: "#ff9800", prefix: "£" },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card
                sx={{ p: 2, borderLeft: `4px solid ${s.color}`, boxShadow: "none", borderRadius: "7px" }}
                className="rmui-card"
              >
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>
                  {s.prefix}{typeof s.value === "number" && s.prefix ? fmt(s.value) : s.value}
                </Typography>
              </Card>
            </Grid>
          ))}

          {/* Status breakdown */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 2, boxShadow: "none", borderRadius: "7px" }} className="rmui-card">
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                By Status
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {Object.entries(summary.by_status).map(([s, n]) => (
                  <Chip key={s} label={`${s}: ${n}`} size="small" color={statusColor(s)} />
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Type breakdown */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 2, boxShadow: "none", borderRadius: "7px" }} className="rmui-card">
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                By Type
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {Object.entries(summary.by_type).map(([t, n]) => (
                  <Chip key={t} label={`${t}: ${n}`} size="small" variant="outlined" />
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ─── Revenue by month table ─── */}
      {revenueByMonth.length > 0 && (
        <Card
          sx={{ boxShadow: "none", borderRadius: "7px", p: { xs: "18px", sm: "20px" }, mb: 3 }}
          className="rmui-card"
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Revenue by Month
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Bookings</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Collected</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                  <TableCell>Collection Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenueByMonth.map((row) => {
                  const outstanding = Math.max(0, row.revenue - row.paid);
                  const rate = row.revenue > 0 ? Math.round((row.paid / row.revenue) * 100) : 0;
                  return (
                    <TableRow key={row.month} hover>
                      <TableCell><strong>{row.month}</strong></TableCell>
                      <TableCell align="right">{row.count}</TableCell>
                      <TableCell align="right">£{fmt(row.revenue)}</TableCell>
                      <TableCell align="right" sx={{ color: "#4caf50" }}>£{fmt(row.paid)}</TableCell>
                      <TableCell align="right" sx={{ color: outstanding > 0 ? "#ff9800" : undefined }}>
                        £{fmt(outstanding)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              height: 6,
                              width: `${rate}%`,
                              maxWidth: 100,
                              background: rate >= 100 ? "#4caf50" : rate >= 50 ? "#ff9800" : "#f44336",
                              borderRadius: 3,
                              minWidth: 2,
                            }}
                          />
                          <Typography variant="caption">{rate}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ─── DataGrid ─── */}
      {hasLoaded && (
        <Card
          sx={{ boxShadow: "none", borderRadius: "7px", p: { xs: "18px", sm: "20px", lg: "25px" } }}
          className="rmui-card"
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Booking Records ({bookings.length})
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                disabled={csvLoading || bookings.length === 0}
                sx={{ textTransform: "none" }}
              >
                CSV
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPdf}
                disabled={pdfLoading || bookings.length === 0}
                sx={{ textTransform: "none" }}
              >
                PDF
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <DataGrid
            rows={bookings}
            columns={columns}
            autoHeight
            pageSizeOptions={[25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8f9fa" },
            }}
          />
        </Card>
      )}

      {!hasLoaded && !loading && (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <TableChartIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>Apply filters and click "Run Report" to generate data.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default Reports;
