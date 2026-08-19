"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Card, Grid, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton,
  Chip, Alert, CircularProgress, Tooltip, Divider,
  MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  Skeleton, Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import CalculateIcon from "@mui/icons-material/Calculate";
import LayersIcon from "@mui/icons-material/Layers";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useSnackbar } from "notistack";
import api from "@/api/api";

// ── Trezo modal style ─────────────────────────────────────────────────────────
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// ── Types ─────────────────────────────────────────────────────────────────────
interface Slab {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number | null;
  percentage: number;
  sort_order: number;
}

interface Employee { id: number; user?: { id: number; name: string }; }

interface PayrollResult {
  employee: { id: number; name: string };
  period: { month: number; year: number; label: string };
  booking_volume: number;
  booking_count: number;
  bookings: { id: number; booking_number: string; selling_cost: number; booking_date: string; status: string }[];
  matched_slab: Slab | null;
  commission_amount: number;
}

const EMPTY_FORM = { name: "", min_amount: "", max_amount: "", percentage: "", sort_order: "0" };
const fmt = (n: number) => "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2 });

// Tier colour palette (cycles for any number of slabs)
const TIER_COLORS = ["#605DFF", "#2196f3", "#4caf50", "#ff9800", "#e91e63", "#9c27b0"];

interface Props {
  /** Suppress the gradient page-header card (use when embedded inside another page header) */
  hideHeader?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CommissionSettings({ hideHeader = false }: Props) {
  const { enqueueSnackbar } = useSnackbar();

  const [slabs, setSlabs]       = useState<Slab[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Modal
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Slab | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Slab | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Payroll calculator
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [calcEmployee, setCalcEmployee]   = useState("");
  const [calcMonth, setCalcMonth]         = useState(new Date().toISOString().slice(0, 7));
  const [calcLoading, setCalcLoading]     = useState(false);
  const [calcResult, setCalcResult]       = useState<PayrollResult | null>(null);
  const [calcError, setCalcError]         = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSlabs = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get<Slab[]>("/api/finance/commission-slabs")
      .then((r) => setSlabs(r.data))
      .catch(() => setError("Failed to load commission slabs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSlabs(); }, [fetchSlabs]);

  useEffect(() => {
    api.get("/api/employees").then((r) => {
      setEmployees(Array.isArray(r.data) ? r.data : (r.data?.data ?? []));
    }).catch(() => {});
  }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (slab: Slab) => {
    setEditing(slab);
    setForm({
      name:       slab.name,
      min_amount: String(slab.min_amount),
      max_amount: slab.max_amount != null ? String(slab.max_amount) : "",
      percentage: String(slab.percentage),
      sort_order: String(slab.sort_order),
    });
    setFormError(null);
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.name.trim())  { setFormError("Slab name is required."); return; }
    if (form.min_amount === "" || isNaN(Number(form.min_amount))) {
      setFormError("Min amount is required."); return;
    }
    if (form.max_amount !== "" && Number(form.max_amount) <= Number(form.min_amount)) {
      setFormError("Max amount must be greater than min amount."); return;
    }
    if (!form.percentage || isNaN(Number(form.percentage))) {
      setFormError("Commission % is required."); return;
    }

    setSaving(true);
    setFormError(null);
    const payload = {
      name:       form.name,
      min_amount: Number(form.min_amount),
      max_amount: form.max_amount !== "" ? Number(form.max_amount) : null,
      percentage: Number(form.percentage),
      sort_order: Number(form.sort_order),
    };

    try {
      if (editing) {
        await api.put(`/api/finance/commission-slabs/${editing.id}`, payload);
        enqueueSnackbar("Slab updated.", { variant: "success" });
      } else {
        await api.post("/api/finance/commission-slabs", payload);
        enqueueSnackbar("Slab created.", { variant: "success" });
      }
      handleClose();
      fetchSlabs();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/finance/commission-slabs/${deleteTarget.id}`);
      enqueueSnackbar("Slab deleted.", { variant: "success" });
      setDeleteTarget(null);
      fetchSlabs();
    } catch {
      enqueueSnackbar("Delete failed.", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // ── Payroll calculator ────────────────────────────────────────────────────
  const handleCalculate = async () => {
    if (!calcEmployee) { setCalcError("Please select an employee."); return; }
    if (!calcMonth)    { setCalcError("Please select a month."); return; }
    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);
    try {
      const r = await api.get<PayrollResult>("/api/finance/calculate-payroll", {
        params: { employee_id: calcEmployee, month: calcMonth },
      });
      setCalcResult(r.data);
    } catch (err: any) {
      setCalcError(err?.response?.data?.message ?? "Calculation failed.");
    } finally {
      setCalcLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      {hideHeader ? (
        /* Compact sub-header when embedded inside the Commissions page */
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "20px", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LayersIcon sx={{ color: "#605DFF", fontSize: 22 }} />
            <Box>
              <Typography fontWeight={700} fontSize={16}>Commission Slabs</Typography>
              <Typography fontSize={12} color="text.secondary">
                Define performance-based commission tiers for all agents
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ textTransform: "none", borderRadius: "7px", boxShadow: "none", fontWeight: 700 }}
          >
            Add Slab
          </Button>
        </Box>
      ) : (
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
              <LayersIcon sx={{ color: "#fff", fontSize: 28 }} />
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff">Commission Slabs</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                  Define performance-based commission tiers for all agents
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained" startIcon={<AddIcon />} onClick={openAdd}
              sx={{ bgcolor: "#fff", color: "#605DFF", fontWeight: 700, borderRadius: "7px", textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: "#f0efff" } }}
            >
              Add Slab
            </Button>
          </Box>
        </Card>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }}>

        {/* ── Slab Table ────────────────────────────────────────────────── */}
        <Grid item xs={12} lg={7}>
          <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}>
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography fontWeight={700} fontSize={15}>Configured Tiers</Typography>
              <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }}>
                Agents are matched to the first slab whose range contains their monthly booking volume
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ p: 3 }}>
                {[1,2,3].map(n => <Skeleton key={n} variant="rounded" height={52} sx={{ mb: 1.5 }} />)}
              </Box>
            ) : slabs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <LayersIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary" fontSize={13}>No slabs configured yet.</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={openAdd}
                  sx={{ mt: 2, textTransform: "none", borderRadius: "6px" }}>
                  Add First Slab
                </Button>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { bgcolor: "#f6f7f9", fontWeight: 700, fontSize: 12, py: 1.2, color: "text.secondary" } }}>
                      <TableCell>Tier</TableCell>
                      <TableCell align="right">Min Volume</TableCell>
                      <TableCell align="right">Max Volume</TableCell>
                      <TableCell align="center">Rate</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slabs.map((slab, idx) => {
                      const color = TIER_COLORS[idx % TIER_COLORS.length];
                      return (
                        <TableRow key={slab.id} hover sx={{ "& td": { fontSize: 13, py: 1.25, borderColor: "divider" } }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
                              <Typography fontSize={13} fontWeight={600}>{slab.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(slab.min_amount)}</TableCell>
                          <TableCell align="right">
                            {slab.max_amount != null
                              ? <Typography fontSize={13} fontWeight={600}>{fmt(slab.max_amount)}</Typography>
                              : <Chip label="No limit" size="small" sx={{ bgcolor: "#605DFF22", color: "#605DFF", fontWeight: 600, height: 20, "& .MuiChip-label": { px: 1 }, fontSize: 11 }} />
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${slab.percentage}%`}
                              size="small"
                              sx={{ bgcolor: color + "22", color, fontWeight: 800, fontSize: 13, height: 24, "& .MuiChip-label": { px: 1.5 } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEdit(slab)}>
                                  <EditIcon fontSize="small" sx={{ color: "#605DFF" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => setDeleteTarget(slab)}>
                                  <DeleteIcon fontSize="small" sx={{ color: "#f44336" }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>

          {/* Visual tier ladder */}
          {!loading && slabs.length > 0 && (
            <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: 2, md: 3 } }}>
              <Typography fontWeight={700} fontSize={14} sx={{ mb: 2 }}>Tier Ladder</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {slabs.map((slab, idx) => {
                  const color = TIER_COLORS[idx % TIER_COLORS.length];
                  const widthPct = Math.min(20 + idx * 15, 100);
                  return (
                    <Box key={slab.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography fontSize={12} color="text.secondary" sx={{ width: 70, flexShrink: 0, textAlign: "right" }}>
                        {slab.name}
                      </Typography>
                      <Box sx={{ flex: 1, position: "relative", height: 28, bgcolor: "#f6f7f9", borderRadius: 1.5, overflow: "hidden" }}>
                        <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${widthPct}%`, bgcolor: color + "44", borderRadius: 1.5, transition: "width 0.4s ease" }} />
                        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", px: 1.5 }}>
                          <Typography fontSize={11} fontWeight={700} sx={{ color }}>
                            {fmt(slab.min_amount)} – {slab.max_amount != null ? fmt(slab.max_amount) : "∞"}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip label={`${slab.percentage}%`} size="small"
                        sx={{ bgcolor: color + "22", color, fontWeight: 800, height: 22, "& .MuiChip-label": { px: 1 }, fontSize: 12, flexShrink: 0 }} />
                    </Box>
                  );
                })}
              </Box>
            </Card>
          )}
        </Grid>

        {/* ── Payroll Calculator ─────────────────────────────────────────── */}
        <Grid item xs={12} lg={5}>
          <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}>
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
              <CalculateIcon sx={{ color: "#605DFF", fontSize: 20 }} />
              <Typography fontWeight={700} fontSize={15}>Payroll Calculator</Typography>
            </Box>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select label="Employee" fullWidth size="small"
                    value={calcEmployee}
                    onChange={(e) => { setCalcEmployee(e.target.value); setCalcResult(null); setCalcError(null); }}
                    SelectProps={{
                      MenuProps: { sx: { "& .MuiMenuItem-root": { color: "text.primary" } } },
                    }}
                  >
                    <MenuItem value="" sx={{ color: "text.primary" }}>— Select Employee —</MenuItem>
                    {employees.map((e) => (
                      <MenuItem key={e.id} value={String(e.id)} sx={{ color: "text.primary" }}>
                        {e.user?.name ?? `Employee #${e.id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Month" type="month" fullWidth size="small"
                    InputLabelProps={{ shrink: true }}
                    value={calcMonth}
                    onChange={(e) => { setCalcMonth(e.target.value); setCalcResult(null); setCalcError(null); }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained" fullWidth onClick={handleCalculate}
                    disabled={calcLoading}
                    startIcon={calcLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CalculateIcon />}
                    sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none", py: 1.1 }}
                  >
                    {calcLoading ? "Calculating…" : "Calculate Commission"}
                  </Button>
                </Grid>
              </Grid>

              {calcError && <Alert severity="error" sx={{ mt: 2 }}>{calcError}</Alert>}

              {calcResult && (
                <Box sx={{ mt: 2.5 }}>
                  <Divider sx={{ mb: 2 }} />

                  {/* Result summary */}
                  <Box
                    sx={{
                      borderRadius: 2, overflow: "hidden",
                      border: "1px solid", borderColor: calcResult.matched_slab ? "#605DFF44" : "divider",
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ bgcolor: "#605DFF", px: 2, py: 1.5 }}>
                      <Typography fontWeight={800} color="#fff" fontSize={15}>
                        {calcResult.employee.name}
                      </Typography>
                      <Typography fontSize={12} sx={{ color: "rgba(255,255,255,0.8)" }}>
                        {calcResult.period.label}
                      </Typography>
                    </Box>

                    {/* KPIs */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid", borderColor: "divider" }}>
                      {[
                        { label: "Booking Volume", value: fmt(calcResult.booking_volume), color: "#605DFF" },
                        { label: "Bookings Count", value: String(calcResult.booking_count), color: "#2196f3" },
                      ].map((kpi) => (
                        <Box key={kpi.label} sx={{ p: 1.5, textAlign: "center", "&:first-of-type": { borderRight: "1px solid", borderColor: "divider" } }}>
                          <Typography fontSize={18} fontWeight={800} sx={{ color: kpi.color }}>{kpi.value}</Typography>
                          <Typography fontSize={11} color="text.secondary">{kpi.label}</Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Matched slab */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                      <Typography fontSize={12} color="text.secondary" sx={{ mb: 0.5 }}>Matched Tier</Typography>
                      {calcResult.matched_slab ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 18 }} />
                          <Typography fontWeight={700} fontSize={14}>{calcResult.matched_slab.name}</Typography>
                          <Chip
                            label={`${calcResult.matched_slab.percentage}%`}
                            size="small"
                            sx={{ bgcolor: "#4caf5022", color: "#4caf50", fontWeight: 800, height: 22, "& .MuiChip-label": { px: 1 } }}
                          />
                        </Box>
                      ) : (
                        <Typography fontSize={13} color="text.secondary" fontStyle="italic">
                          No slab matched — volume is outside all configured tiers
                        </Typography>
                      )}
                    </Box>

                    {/* Commission payout */}
                    <Box sx={{ px: 2, py: 2, bgcolor: calcResult.commission_amount > 0 ? "#4caf5008" : "#f6f7f9" }}>
                      <Typography fontSize={12} color="text.secondary">Commission Payout</Typography>
                      <Typography fontSize={28} fontWeight={900}
                        sx={{ color: calcResult.commission_amount > 0 ? "#4caf50" : "text.disabled", lineHeight: 1.2, mt: 0.25 }}>
                        {fmt(calcResult.commission_amount)}
                      </Typography>
                      {calcResult.matched_slab && (
                        <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.5 }}>
                          {fmt(calcResult.booking_volume)} × {calcResult.matched_slab.percentage}%
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Contributing bookings */}
                  {calcResult.bookings.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography fontSize={12} fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                        Contributing Bookings ({calcResult.bookings.length})
                      </Typography>
                      <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ "& th": { bgcolor: "#f6f7f9", fontWeight: 700, fontSize: 11, py: 1, color: "text.secondary" } }}>
                              <TableCell>Booking #</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell align="right">Value</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calcResult.bookings.map((b) => (
                              <TableRow key={b.id} sx={{ "& td": { fontSize: 12, py: 0.75, borderColor: "divider" } }}>
                                <TableCell sx={{ fontWeight: 600, color: "#605DFF" }}>{b.booking_number}</TableCell>
                                <TableCell color="text.secondary">{b.booking_date}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(b.selling_cost)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ "& td": { fontWeight: 700, py: 1, bgcolor: "#f6f7f9", fontSize: 12 } }}>
                              <TableCell colSpan={2}>Total Volume</TableCell>
                              <TableCell align="right">{fmt(calcResult.booking_volume)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Paper>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Add / Edit Slab Dialog ───────────────────────────────────────── */}
      <BootstrapDialog open={open} onClose={handleClose} maxWidth="xs" fullWidth className="rmu-modal">
        <Box
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f6f7f9", padding: { xs: "15px 20px", md: "20px 25px" } }}
          className="rmu-modal-header"
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "16px", md: "18px" } }}>
            {editing ? "Edit Slab" : "Add Commission Slab"}
          </Typography>
          <IconButton size="small" onClick={handleClose}><ClearIcon /></IconButton>
        </Box>
        <Box className="rmu-modal-content">
          <Box sx={{ p: "25px" }} className="bg-white">
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Tier Name *" fullWidth size="small" placeholder="e.g. Bronze, Silver, Gold"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Min Volume (£) *" type="number" fullWidth size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={form.min_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max Volume (£)" type="number" fullWidth size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={form.max_amount}
                  onChange={(e) => setForm((f) => ({ ...f, max_amount: e.target.value }))}
                  helperText="Leave blank for open-ended top tier"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Commission % *" type="number" fullWidth size="small"
                  inputProps={{ min: 0, max: 100, step: "0.01" }}
                  value={form.percentage}
                  onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sort Order" type="number" fullWidth size="small"
                  inputProps={{ min: 0, step: "1" }}
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  helperText="Lower = appears first"
                />
              </Grid>
              <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                <Button variant="outlined" color="inherit" onClick={handleClose} sx={{ textTransform: "none", borderRadius: "6px" }}>
                  Cancel
                </Button>
                <Button
                  variant="contained" onClick={handleSave} disabled={saving}
                  sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none", minWidth: 110 }}
                >
                  {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editing ? "Update Slab" : "Create Slab"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </BootstrapDialog>

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Slab</DialogTitle>
        <DialogContent>
          <Typography>
            Delete the <strong>{deleteTarget?.name}</strong> slab ({deleteTarget?.min_amount}
            {deleteTarget?.max_amount != null ? ` – ${deleteTarget.max_amount}` : "+"} = {deleteTarget?.percentage}%)?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined" color="inherit" sx={{ textTransform: "none", borderRadius: "6px" }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete} variant="contained" color="error"
            disabled={deleting} sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none" }}
          >
            {deleting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
