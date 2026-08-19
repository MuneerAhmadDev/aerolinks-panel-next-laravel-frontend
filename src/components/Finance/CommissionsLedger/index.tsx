"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Card, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, TextField,
  MenuItem, IconButton, Chip, Alert, CircularProgress,
  Tooltip, Avatar, Tabs, Tab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel,
} from "@mui/x-data-grid";
import AddIcon           from "@mui/icons-material/Add";
import TuneIcon          from "@mui/icons-material/Tune";
import ClearIcon         from "@mui/icons-material/Clear";
import PaidIcon          from "@mui/icons-material/Paid";
import LayersIcon        from "@mui/icons-material/Layers";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import TrendingUpIcon    from "@mui/icons-material/TrendingUp";
import TrendingDownIcon  from "@mui/icons-material/TrendingDown";
import WarningAmberIcon  from "@mui/icons-material/WarningAmber";
import { useSnackbar } from "notistack";
import api from "@/api/api";
import { useDepartment } from "@/context/DepartmentContext";
import CommissionSettings from "../CommissionSettings";

// ── Trezo modal style ─────────────────────────────────────────────────────────

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// ── Types ─────────────────────────────────────────────────────────────────────

type CommissionType = "standard" | "bonus" | "clawback";

interface PendingPayout {
  id: number;
  amount: number;
  rate: number | null;
  type: CommissionType;
  notes: string | null;
  created_at: string;
  employee: { id: number; user?: { id: number; name: string } } | null;
  booking: { id: number; booking_number: string; selling_cost: number } | null;
}

interface Employee { id: number; user?: { id: number; name: string }; }

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a number as £1,234.56 or -£1,234.56 */
const fmt = (n: number) => {
  const abs = Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2 });
  return n < 0 ? `-£${abs}` : `£${abs}`;
};

const empName = (e: PendingPayout["employee"]) => e?.user?.name ?? "—";

const TYPE_META: Record<CommissionType, { label: string; color: string; bg: string }> = {
  standard: { label: "Earned",   color: "#605DFF", bg: "#605DFF18" },
  bonus:    { label: "Bonus",    color: "#4caf50", bg: "#4caf5018" },
  clawback: { label: "Clawback", color: "#f44336", bg: "#f4433618" },
};

// ── Tab Panel helper ──────────────────────────────────────────────────────────

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && children}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_ADJUST = {
  employee_id: "",
  type: "bonus" as "bonus" | "clawback",
  amount: "",
  notes: "",
  booking_id: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommissionsLedger() {
  const { enqueueSnackbar } = useSnackbar();
  const { isSuperAdmin }    = useDepartment();

  const [activeTab, setActiveTab] = useState(0);

  // ── Pending Payouts state ─────────────────────────────────────────────────

  const [rows, setRows]       = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterFrom, setFilterFrom]         = useState("");
  const [filterTo, setFilterTo]             = useState("");

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [bulkPaying, setBulkPaying]               = useState(false);

  const [payTarget, setPayTarget] = useState<PendingPayout | null>(null);
  const [paying, setPaying]       = useState(false);

  // Add Adjustment modal
  const [adjustOpen, setAdjustOpen]   = useState(false);
  const [adjustForm, setAdjustForm]   = useState(EMPTY_ADJUST);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPayouts = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (filterEmployee) params.employee_id = filterEmployee;
    if (filterFrom)     params.from        = filterFrom;
    if (filterTo)       params.to          = filterTo;

    api.get<PendingPayout[]>("/api/finance/pending-payouts", { params })
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError("Failed to load pending payouts."))
      .finally(() => setLoading(false));
  }, [filterEmployee, filterFrom, filterTo]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  useEffect(() => {
    api.get("/api/employees").then((r) => {
      setEmployees(Array.isArray(r.data) ? r.data : (r.data?.data ?? []));
    }).catch(() => {});
  }, []);

  const clearFilters = () => {
    setFilterEmployee("");
    setFilterFrom("");
    setFilterTo("");
  };
  const hasFilters = !!(filterEmployee || filterFrom || filterTo);

  // ── Summary math ─────────────────────────────────────────────────────────

  const grossEarned   = rows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const totalClawback = rows.filter(r => r.amount < 0).reduce((s, r) => s + r.amount, 0);
  const netPayable    = rows.reduce((s, r) => s + r.amount, 0); // grossEarned + totalClawback

  const clawbackCount  = rows.filter(r => r.type === "clawback").length;
  const selectedCount  = rowSelectionModel.length;

  // ── Bulk Mark as Paid ────────────────────────────────────────────────────

  const handleBulkPay = async () => {
    if (!rowSelectionModel.length) return;
    setBulkPaying(true);
    try {
      const res = await api.post("/api/finance/commissions/bulk-pay", { ids: rowSelectionModel });
      const count = res.data.paid_count ?? rowSelectionModel.length;
      enqueueSnackbar(`${count} commission${count !== 1 ? "s" : ""} marked as paid.`, { variant: "success" });
      setRowSelectionModel([]);
      fetchPayouts();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message ?? "Bulk payment failed.", { variant: "error" });
    } finally {
      setBulkPaying(false);
    }
  };

  // ── Single Mark as Paid ──────────────────────────────────────────────────

  const handleMarkPaid = async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      await api.post(`/api/finance/commissions/${payTarget.id}/pay`);
      enqueueSnackbar(`Commission for ${empName(payTarget.employee)} marked as paid.`, { variant: "success" });
      setPayTarget(null);
      fetchPayouts();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message ?? "Failed to mark as paid.", { variant: "error" });
    } finally {
      setPaying(false);
    }
  };

  // ── Add Adjustment ───────────────────────────────────────────────────────

  const handleAdjustClose = () => {
    setAdjustOpen(false);
    setAdjustForm(EMPTY_ADJUST);
    setAdjustError(null);
  };

  const handleAdjustSave = async () => {
    if (!adjustForm.employee_id)  { setAdjustError("Please select an employee."); return; }
    if (!adjustForm.amount || isNaN(Number(adjustForm.amount)) || Number(adjustForm.amount) <= 0) {
      setAdjustError("A valid positive amount is required."); return;
    }
    if (!adjustForm.notes || adjustForm.notes.trim().length < 5) {
      setAdjustError("A reason is required (at least 5 characters)."); return;
    }
    setSaving(true);
    setAdjustError(null);
    try {
      await api.post("/api/finance/commissions/adjust", {
        employee_id: Number(adjustForm.employee_id),
        type:        adjustForm.type,
        amount:      Number(adjustForm.amount),
        notes:       adjustForm.notes.trim(),
        booking_id:  adjustForm.booking_id ? Number(adjustForm.booking_id) : undefined,
      });
      const label = adjustForm.type === "bonus" ? "Bonus" : "Clawback";
      enqueueSnackbar(`${label} adjustment added successfully.`, { variant: "success" });
      handleAdjustClose();
      fetchPayouts();
    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? (Object.values(err?.response?.data?.errors ?? {}) as string[][])?.[0]?.[0]
        ?? "Failed to save adjustment.";
      setAdjustError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  // ── DataGrid columns ─────────────────────────────────────────────────────

  const columns: GridColDef[] = [
    {
      field: "employee", headerName: "Agent", width: 180,
      renderCell: (p: GridRenderCellParams) => {
        const name = empName(p.row.employee);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: "#605DFF22", color: "#605DFF", fontSize: 12, fontWeight: 700 }}>
              {name.charAt(0)}
            </Avatar>
            <Typography fontSize={13} fontWeight={600}>{name}</Typography>
          </Box>
        );
      },
    },
    {
      field: "type", headerName: "Type", width: 110,
      renderCell: (p: GridRenderCellParams) => {
        const t = (p.value as CommissionType) ?? "standard";
        const meta = TYPE_META[t];
        return (
          <Chip
            label={meta.label}
            size="small"
            icon={
              t === "clawback" ? <TrendingDownIcon style={{ fontSize: 13 }} /> :
              t === "bonus"    ? <TrendingUpIcon   style={{ fontSize: 13 }} /> :
              undefined
            }
            sx={{
              bgcolor: meta.bg, color: meta.color, fontWeight: 700,
              fontSize: 11, height: 22,
              border: `1px solid ${meta.color}33`,
              "& .MuiChip-icon": { color: meta.color },
            }}
          />
        );
      },
    },
    {
      field: "booking", headerName: "Booking", width: 165,
      renderCell: (p: GridRenderCellParams) => p.row.booking ? (
        <Box>
          <Typography fontSize={12} fontWeight={700} color="#605DFF">
            {p.row.booking.booking_number}
          </Typography>
          <Typography fontSize={11} color="text.secondary">
            {fmt(p.row.booking.selling_cost)} booking value
          </Typography>
        </Box>
      ) : (
        <Typography fontSize={12} color="text.secondary" fontStyle="italic">Manual entry</Typography>
      ),
    },
    {
      field: "amount", headerName: "Amount", width: 145, align: "right", headerAlign: "right",
      renderCell: (p: GridRenderCellParams) => {
        const amount: number = p.row.amount;
        const isNeg = amount < 0;
        const amtColor = isNeg ? "error.main" : "#4caf50";
        return (
          <Box sx={{ textAlign: "right" }}>
            <Typography
              fontSize={14}
              fontWeight={800}
              color={amtColor}
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {fmt(amount)}
            </Typography>
            {p.row.rate != null && (
              <Typography fontSize={11} color="text.secondary">{p.row.rate}% rate</Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "notes", headerName: "Notes / Reason", flex: 1, minWidth: 160,
      renderCell: (p: GridRenderCellParams) => (
        <Typography
          fontSize={12}
          color={p.row.type === "clawback" ? "error.main" : "text.secondary"}
          sx={{ whiteSpace: "normal", lineHeight: 1.4 }}
        >
          {p.value || "—"}
        </Typography>
      ),
    },
    {
      field: "created_at", headerName: "Date", width: 100,
      renderCell: (p: GridRenderCellParams) => (
        <Typography fontSize={12} color="text.secondary">
          {new Date(p.value).toLocaleDateString("en-GB")}
        </Typography>
      ),
    },
    ...(isSuperAdmin ? [{
      field: "actions", headerName: "", width: 90, sortable: false, align: "center" as const,
      renderCell: (p: GridRenderCellParams) => {
        const isClawback = p.row.type === "clawback";
        return (
          <Tooltip title={isClawback ? "Settle clawback" : "Mark as Paid"}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PaidIcon sx={{ fontSize: "13px !important" }} />}
              onClick={() => setPayTarget(p.row as PendingPayout)}
              sx={{
                textTransform: "none", fontSize: 11, borderRadius: "5px", px: 1, py: 0.3, minWidth: 0,
                borderColor: isClawback ? "error.main" : "#4caf50",
                color: isClawback ? "error.main" : "#4caf50",
                "&:hover": {
                  bgcolor: isClawback ? "#f4433611" : "#4caf5011",
                  borderColor: isClawback ? "error.main" : "#4caf50",
                },
              }}
            >
              {isClawback ? "Settle" : "Pay"}
            </Button>
          </Tooltip>
        );
      },
    }] : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}>
        <Box
          sx={{
            background: "linear-gradient(135deg, #605DFF 0%, #8B89FF 60%, #a78bfa 100%)",
            px: { xs: 2.5, md: 4 }, py: { xs: 2, md: 2.5 },
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PaidIcon sx={{ color: "#fff", fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff">Commissions</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Agent commission tracking and payout management
              </Typography>
            </Box>
          </Box>

          {/* Action buttons — only shown on Pending Payouts tab */}
          {activeTab === 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              {selectedCount > 0 && isSuperAdmin && (
                <Button
                  variant="contained"
                  startIcon={bulkPaying ? <CircularProgress size={15} sx={{ color: "#605DFF" }} /> : <PaidIcon />}
                  onClick={handleBulkPay}
                  disabled={bulkPaying}
                  sx={{
                    bgcolor: "#4caf50", color: "#fff", fontWeight: 700,
                    borderRadius: "7px", textTransform: "none", boxShadow: "none",
                    "&:hover": { bgcolor: "#388e3c" },
                    "&.Mui-disabled": { bgcolor: "#4caf5066", color: "#fff" },
                  }}
                >
                  Mark {selectedCount} as Paid
                </Button>
              )}
              {isSuperAdmin && (
                <Button
                  variant="contained"
                  startIcon={<TuneIcon />}
                  onClick={() => setAdjustOpen(true)}
                  sx={{
                    bgcolor: "#fff", color: "#605DFF", fontWeight: 700,
                    borderRadius: "7px", textTransform: "none", boxShadow: "none",
                    "&:hover": { bgcolor: "#f0efff" },
                  }}
                >
                  Add Adjustment
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* Tab bar */}
        <Box sx={{ px: { xs: 2, md: 4 }, borderBottom: "1px solid", borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 14, minHeight: 48 },
              "& .Mui-selected": { color: "#605DFF" },
              "& .MuiTabs-indicator": { backgroundColor: "#605DFF" },
            }}
          >
            <Tab icon={<PaidIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Pending Payouts" />
            <Tab icon={<LayersIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Commission Slabs" />
          </Tabs>
        </Box>
      </Card>

      {/* ── Tab 1: Pending Payouts ────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={0}>

        {/* ── Summary bar ──────────────────────────────────────────────────── */}
        {!loading && rows.length > 0 && (
          <Grid container spacing={2} sx={{ mb: "15px" }}>
            {/* Gross earned */}
            <Grid item xs={12} sm={4}>
              <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ bgcolor: "#4caf5018", borderRadius: "8px", p: 1, display: "flex" }}>
                    <TrendingUpIcon sx={{ color: "#4caf50", fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                      Gross Earned
                    </Typography>
                    <Typography fontSize={20} fontWeight={800} color="#4caf50">
                      {fmt(grossEarned)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Total clawbacks */}
            <Grid item xs={12} sm={4}>
              <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ bgcolor: "#f4433618", borderRadius: "8px", p: 1, display: "flex" }}>
                    <TrendingDownIcon sx={{ color: "error.main", fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                      Total Clawbacks
                    </Typography>
                    <Typography fontSize={20} fontWeight={800} color="error.main">
                      {fmt(totalClawback)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Net payable */}
            <Grid item xs={12} sm={4}>
              <Card
                className="rmui-card"
                sx={{
                  boxShadow: "none", borderRadius: "7px", p: 2,
                  border: `2px solid ${netPayable < 0 ? "#f4433633" : "#605DFF33"}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ bgcolor: netPayable < 0 ? "#f4433618" : "#605DFF18", borderRadius: "8px", p: 1, display: "flex" }}>
                    <PaidIcon sx={{ color: netPayable < 0 ? "error.main" : "#605DFF", fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                      Net Payable
                    </Typography>
                    <Typography
                      fontSize={20} fontWeight={800}
                      color={netPayable < 0 ? "error.main" : "#605DFF"}
                    >
                      {fmt(netPayable)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Clawback warning banner */}
        {clawbackCount > 0 && (
          <Alert
            severity="warning"
            icon={<WarningAmberIcon />}
            sx={{ mb: "15px", borderRadius: "7px" }}
          >
            <strong>{clawbackCount} pending clawback{clawbackCount !== 1 ? "s" : ""}</strong> detected.
            These are negative deductions that will reduce the net payout.
            Settle them to remove from the ledger.
          </Alert>
        )}

        {/* Filter bar */}
        <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "15px" }}>
          <Box sx={{ px: { xs: 2, md: 4 }, py: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <TextField
              select label="Agent" size="small" value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              sx={{ width: 200 }}
            >
              <MenuItem value="">All Agents</MenuItem>
              {employees.map((e) => (
                <MenuItem key={e.id} value={String(e.id)}>
                  {e.user?.name ?? `Employee #${e.id}`}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="From" type="date" size="small" value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
            />
            <TextField
              label="To" type="date" size="small" value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
            />
            {hasFilters && (
              <Tooltip title="Clear filters">
                <IconButton size="small" onClick={clearFilters} sx={{ color: "text.secondary" }}>
                  <FilterListOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={{ ml: "auto" }}>
              <Typography fontSize={12} color="text.secondary">
                {rows.length} record{rows.length !== 1 ? "s" : ""}
                {clawbackCount > 0 && (
                  <Box component="span" sx={{ color: "error.main", fontWeight: 700 }}>
                    {" "}({clawbackCount} clawback{clawbackCount !== 1 ? "s" : ""})
                  </Box>
                )}
              </Typography>
            </Box>
          </Box>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* DataGrid */}
        <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            loading={loading}
            checkboxSelection={isSuperAdmin}
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(m) => setRowSelectionModel(m)}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowHeight={() => "auto"}
            disableRowSelectionOnClick
            getRowClassName={(p) =>
              (p.row as PendingPayout).type === "clawback" ? "clawback-row" : ""
            }
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f6f7f9" },
              "& .MuiDataGrid-cell": {
                fontSize: 13, borderColor: "divider", py: 1, alignItems: "center",
              },
              "& .MuiDataGrid-footerContainer": { borderTop: "1px solid", borderColor: "divider" },
              // Clawback rows — subtle red tint
              "& .clawback-row": {
                bgcolor: "#fff5f5",
                "&:hover": { bgcolor: "#ffeeee" },
                "&.Mui-selected": { bgcolor: "#ffdede", "&:hover": { bgcolor: "#ffcece" } },
              },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", py: 6 }}>
                  <PaidIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                  <Typography fontSize={15} fontWeight={600} color="text.secondary">
                    No pending payouts
                  </Typography>
                  <Typography fontSize={13} color="text.disabled" sx={{ mt: 0.5 }}>
                    {hasFilters ? "Try adjusting your filters" : "All commissions have been settled"}
                  </Typography>
                </Box>
              ),
            }}
          />
        </Card>
      </TabPanel>

      {/* ── Tab 2: Commission Slabs ───────────────────────────────────────── */}
      <TabPanel value={activeTab} index={1}>
        <CommissionSettings hideHeader />
      </TabPanel>

      {/* ── Add Adjustment Modal ──────────────────────────────────────────── */}
      <BootstrapDialog open={adjustOpen} onClose={handleAdjustClose} maxWidth="sm" fullWidth className="rmu-modal">
        <Box
          sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f6f7f9", padding: { xs: "15px 20px", md: "20px 25px" },
          }}
          className="rmu-modal-header"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TuneIcon sx={{ color: "#605DFF", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "15px", md: "17px" } }}>
              Add Manual Adjustment
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleAdjustClose}><ClearIcon /></IconButton>
        </Box>
        <Box className="rmu-modal-content">
          <Box sx={{ p: "25px" }} className="bg-white">
            {adjustError && <Alert severity="error" sx={{ mb: 2, borderRadius: "6px" }}>{adjustError}</Alert>}

            <Grid container spacing={2}>
              {/* Employee */}
              <Grid item xs={12}>
                <TextField
                  select label="Employee *" fullWidth size="small"
                  value={adjustForm.employee_id}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, employee_id: e.target.value }))}
                >
                  <MenuItem value="">— Select Employee —</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.id} value={String(e.id)}>
                      {e.user?.name ?? `Employee #${e.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Type */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select label="Adjustment Type *" fullWidth size="small"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, type: e.target.value as "bonus" | "clawback" }))}
                >
                  <MenuItem value="bonus">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrendingUpIcon sx={{ color: "#4caf50", fontSize: 18 }} />
                      <span>Bonus <em style={{ color: "#4caf50", fontStyle: "normal" }}>(+)</em></span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="clawback">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TrendingDownIcon sx={{ color: "#f44336", fontSize: 18 }} />
                      <span>Deduction / Clawback <em style={{ color: "#f44336", fontStyle: "normal" }}>(-)</em></span>
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount (£) *" type="number" fullWidth size="small"
                  inputProps={{ min: 0.01, step: "0.01" }}
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
                  helperText={
                    adjustForm.amount && !isNaN(Number(adjustForm.amount))
                      ? adjustForm.type === "clawback"
                        ? `Will deduct -£${Number(adjustForm.amount).toFixed(2)}`
                        : `Will add +£${Number(adjustForm.amount).toFixed(2)}`
                      : "Enter a positive number"
                  }
                  FormHelperTextProps={{
                    sx: {
                      color: adjustForm.type === "clawback" ? "error.main" : "#4caf50",
                      fontWeight: 600,
                    },
                  }}
                />
              </Grid>

              {/* Reason / Notes — required */}
              <Grid item xs={12}>
                <TextField
                  label="Reason / Notes *" fullWidth size="small" multiline rows={3}
                  placeholder={
                    adjustForm.type === "clawback"
                      ? "e.g. Booking #BK-0042 was refunded after payment was made."
                      : "e.g. Performance bonus for exceeding monthly targets."
                  }
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))}
                  helperText="Required — explain the reason for this adjustment"
                />
              </Grid>

              {/* Booking ID reference — optional */}
              <Grid item xs={12}>
                <TextField
                  label="Booking ID Reference" type="number" fullWidth size="small"
                  value={adjustForm.booking_id}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, booking_id: e.target.value }))}
                  helperText="Optional — link to a specific booking"
                />
              </Grid>

              {/* Preview pill */}
              {adjustForm.amount && !isNaN(Number(adjustForm.amount)) && Number(adjustForm.amount) > 0 && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      bgcolor: adjustForm.type === "clawback" ? "#fff5f5" : "#f0fff4",
                      border: `1px solid ${adjustForm.type === "clawback" ? "#f4433633" : "#4caf5033"}`,
                      borderRadius: "8px", p: 1.5,
                      display: "flex", alignItems: "center", gap: 1.5,
                    }}
                  >
                    {adjustForm.type === "clawback"
                      ? <TrendingDownIcon sx={{ color: "error.main" }} />
                      : <TrendingUpIcon sx={{ color: "#4caf50" }} />}
                    <Box>
                      <Typography fontSize={13} fontWeight={700}
                        color={adjustForm.type === "clawback" ? "error.main" : "#4caf50"}>
                        {adjustForm.type === "clawback" ? "Deduction" : "Bonus"} of{" "}
                        {adjustForm.type === "clawback" ? "-" : "+"}£{Number(adjustForm.amount).toFixed(2)}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        will be added as a pending entry for the selected employee
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                <Button variant="outlined" color="inherit" onClick={handleAdjustClose}
                  sx={{ textTransform: "none", borderRadius: "6px" }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color={adjustForm.type === "clawback" ? "error" : "primary"}
                  onClick={handleAdjustSave}
                  disabled={saving}
                  sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none", minWidth: 130 }}
                >
                  {saving
                    ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                    : adjustForm.type === "clawback" ? "Apply Clawback" : "Apply Bonus"
                  }
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </BootstrapDialog>

      {/* ── Single Pay / Settle Confirm ───────────────────────────────────── */}
      <Dialog open={payTarget !== null} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {payTarget?.type === "clawback" ? "Settle Clawback" : "Confirm Payment"}
        </DialogTitle>
        <DialogContent>
          {payTarget?.type === "clawback" ? (
            <Alert severity="warning" sx={{ mb: 1.5, borderRadius: "6px" }}>
              Settling a clawback marks it as resolved. Ensure the deduction has been applied to the employee's payout before settling.
            </Alert>
          ) : null}
          <Typography>
            {payTarget?.type === "clawback"
              ? <>Mark the <strong style={{ color: "#f44336" }}>{fmt(payTarget?.amount ?? 0)}</strong> clawback for <strong>{empName(payTarget?.employee ?? null)}</strong> as settled?</>
              : <>Mark the <strong>{fmt(payTarget?.amount ?? 0)}</strong> commission for <strong>{empName(payTarget?.employee ?? null)}</strong> as paid?</>
            }
          </Typography>
          {payTarget?.notes && (
            <Typography fontSize={13} color="text.secondary" sx={{ mt: 1, fontStyle: "italic" }}>
              "{payTarget.notes}"
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setPayTarget(null)} variant="outlined" color="inherit"
            sx={{ textTransform: "none", borderRadius: "6px" }}>
            Cancel
          </Button>
          <Button
            onClick={handleMarkPaid}
            variant="contained"
            color={payTarget?.type === "clawback" ? "warning" : "success"}
            disabled={paying}
            sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none" }}
          >
            {paying
              ? <CircularProgress size={18} sx={{ color: "#fff" }} />
              : payTarget?.type === "clawback" ? "Confirm Settle" : "Confirm Payment"
            }
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
