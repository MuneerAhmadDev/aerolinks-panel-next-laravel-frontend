"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Card, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, TextField,
  MenuItem, IconButton, Chip, Alert, CircularProgress,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useSnackbar } from "notistack";
import api from "@/api/api";

// ── Trezo modal style ─────────────────────────────────────────────────────────

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// ── Types ─────────────────────────────────────────────────────────────────────

interface Expense {
  id: number;
  title: string;
  amount: number;
  currency: string;
  office_location: string;
  exchange_rate: number;
  base_amount: number;
  category: string | null;
  date: string;
  receipt_url: string | null;
  notes: string | null;
  creator?: { id: number; name: string };
}

const CATEGORIES = [
  "Rent", "Utilities", "Salaries", "Marketing", "Software",
  "Travel", "Insurance", "Office Supplies", "Professional Fees", "Other",
];

const CURRENCIES = ["GBP", "PKR", "USD", "EUR", "AED", "SAR"];

const OFFICES: { value: string; label: string }[] = [
  { value: "UK", label: "UK Office" },
  { value: "PK", label: "Pakistan Office" },
];

const EMPTY_FORM = {
  title: "", amount: "", currency: "GBP", office_location: "UK",
  exchange_rate: "1", category: "",
  date: new Date().toISOString().slice(0, 10),
  receipt_url: "", notes: "",
};

const fmtGbp = (n: number) =>
  "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2 });

const fmtLocal = (n: number, currency: string) => {
  if (currency === "GBP") return fmtGbp(n);
  return currency + " " + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2 });
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExpenseLedger() {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows]           = useState<Expense[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);          // 0-indexed (DataGrid)
  const [pageSize, setPageSize]   = useState(10);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Filter bar
  const [filterFrom, setFilterFrom]   = useState("");
  const [filterTo, setFilterTo]       = useState("");
  const [filterCat, setFilterCat]     = useState("");
  const [filterOffice, setFilterOffice] = useState("");

  // Modal
  const [open, setOpen]             = useState(false);
  const [editing, setEditing]       = useState<Expense | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const isBaseCurrency = form.currency === "GBP";

  // Compute preview base_amount when form values change
  const previewBase = isBaseCurrency
    ? Number(form.amount) || 0
    : (Number(form.amount) || 0) * (Number(form.exchange_rate) || 1);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = { page: page + 1, per_page: pageSize };
    if (filterFrom)   params.from     = filterFrom;
    if (filterTo)     params.to       = filterTo;
    if (filterCat)    params.category = filterCat;
    if (filterOffice) params.office   = filterOffice;

    api.get("/api/finance/expenses", { params })
      .then((r) => {
        setRows(r.data.data ?? []);
        setTotal(r.data.total ?? 0);
      })
      .catch(() => setError("Failed to load expenses."))
      .finally(() => setLoading(false));
  }, [page, pageSize, filterFrom, filterTo, filterCat, filterOffice]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (row: Expense) => {
    setEditing(row);
    setForm({
      title:           row.title,
      amount:          String(row.amount),
      currency:        row.currency,
      office_location: row.office_location ?? "UK",
      exchange_rate:   String(row.exchange_rate ?? 1),
      category:        row.category ?? "",
      date:            row.date,
      receipt_url:     row.receipt_url ?? "",
      notes:           row.notes ?? "",
    });
    setFormError(null);
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditing(null); };

  const handleCurrencyChange = (currency: string) => {
    setForm((f) => ({
      ...f,
      currency,
      exchange_rate: currency === "GBP" ? "1" : f.exchange_rate === "1" ? "" : f.exchange_rate,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError("A valid amount is required."); return;
    }
    if (!isBaseCurrency && (!form.exchange_rate || isNaN(Number(form.exchange_rate)) || Number(form.exchange_rate) <= 0)) {
      setFormError("Exchange rate is required for non-GBP currencies."); return;
    }
    if (!form.date) { setFormError("Date is required."); return; }

    setSaving(true);
    setFormError(null);

    const payload: Record<string, unknown> = {
      title:           form.title,
      amount:          Number(form.amount),
      currency:        form.currency,
      office_location: form.office_location,
      category:        form.category || null,
      date:            form.date,
      receipt_url:     form.receipt_url || null,
      notes:           form.notes || null,
    };
    if (!isBaseCurrency) {
      payload.exchange_rate = Number(form.exchange_rate);
    }

    try {
      if (editing) {
        await api.put(`/api/finance/expenses/${editing.id}`, payload);
        enqueueSnackbar("Expense updated.", { variant: "success" });
      } else {
        await api.post("/api/finance/expenses", payload);
        enqueueSnackbar("Expense added.", { variant: "success" });
      }
      handleClose();
      fetchExpenses();
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/finance/expenses/${deleteId}`);
      enqueueSnackbar("Expense deleted.", { variant: "success" });
      setDeleteId(null);
      fetchExpenses();
    } catch {
      enqueueSnackbar("Delete failed.", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: GridColDef[] = [
    {
      field: "date", headerName: "Date", width: 110,
      renderCell: (p: GridRenderCellParams) => (
        <Typography fontSize={13}>{p.value}</Typography>
      ),
    },
    {
      field: "title", headerName: "Title", flex: 1, minWidth: 150,
      renderCell: (p: GridRenderCellParams) => (
        <Typography fontSize={13} fontWeight={600}>{p.value}</Typography>
      ),
    },
    {
      field: "office_location", headerName: "Office", width: 110,
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={p.value === "PK" ? "Pakistan" : "UK"}
          size="small"
          sx={{
            bgcolor: p.value === "PK" ? "#0ea5e922" : "#22c55e22",
            color: p.value === "PK" ? "#0ea5e9" : "#16a34a",
            fontWeight: 600, height: 22,
            "& .MuiChip-label": { px: 1 },
          }}
        />
      ),
    },
    {
      field: "category", headerName: "Category", width: 140,
      renderCell: (p: GridRenderCellParams) => p.value ? (
        <Chip
          label={p.value}
          size="small"
          sx={{ bgcolor: "#605DFF22", color: "#605DFF", fontWeight: 600, height: 22, "& .MuiChip-label": { px: 1 } }}
        />
      ) : <Typography fontSize={12} color="text.secondary">—</Typography>,
    },
    {
      field: "amount", headerName: "Local Amount", width: 140, align: "right", headerAlign: "right",
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ textAlign: "right" }}>
          <Typography fontSize={13} fontWeight={700} color="#f44336">
            {fmtLocal(p.row.amount, p.row.currency)}
          </Typography>
          {p.row.currency !== "GBP" && (
            <Typography fontSize={11} color="text.secondary">
              @ {Number(p.row.exchange_rate).toFixed(4)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "base_amount", headerName: "GBP Equivalent", width: 140, align: "right", headerAlign: "right",
      renderCell: (p: GridRenderCellParams) => (
        <Typography fontSize={13} fontWeight={700} color={p.row.currency === "GBP" ? "#f44336" : "#605DFF"}>
          {fmtGbp(p.row.base_amount ?? p.row.amount)}
        </Typography>
      ),
    },
    {
      field: "receipt_url", headerName: "Receipt", width: 80, sortable: false,
      renderCell: (p: GridRenderCellParams) => p.value ? (
        <Tooltip title="View receipt">
          <IconButton size="small" href={p.value} target="_blank" rel="noreferrer">
            <OpenInNewIcon fontSize="small" sx={{ color: "#605DFF" }} />
          </IconButton>
        </Tooltip>
      ) : <Typography fontSize={12} color="text.secondary">—</Typography>,
    },
    {
      field: "creator", headerName: "Added By", width: 120,
      renderCell: (p: GridRenderCellParams) => (
        <Typography fontSize={12} color="text.secondary">{p.row.creator?.name ?? "—"}</Typography>
      ),
    },
    {
      field: "actions", headerName: "", width: 90, sortable: false, align: "center",
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(p.row as Expense)}>
              <EditIcon fontSize="small" sx={{ color: "#605DFF" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteId(p.row.id)}>
              <DeleteIcon fontSize="small" sx={{ color: "#f44336" }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const hasFilters = !!(filterFrom || filterTo || filterCat || filterOffice);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <Card
        className="rmui-card"
        sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #605DFF 0%, #8B89FF 60%, #a78bfa 100%)",
            px: { xs: 2.5, md: 4 }, py: { xs: 2, md: 2.5 },
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ReceiptLongIcon sx={{ color: "#fff", fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff">Expense Ledger</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Log and track all general business overhead expenses
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{
              bgcolor: "#fff", color: "#605DFF", fontWeight: 700,
              borderRadius: "7px", textTransform: "none", boxShadow: "none",
              "&:hover": { bgcolor: "#f0efff" },
            }}
          >
            Add Expense
          </Button>
        </Box>

        {/* Filter bar */}
        <Box
          sx={{
            px: { xs: 2, md: 4 }, py: 2,
            display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
            borderTop: "1px solid", borderColor: "divider",
          }}
        >
          <TextField
            label="From" type="date" size="small" value={filterFrom}
            onChange={(e) => { setPage(0); setFilterFrom(e.target.value); }}
            InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
          />
          <TextField
            label="To" type="date" size="small" value={filterTo}
            onChange={(e) => { setPage(0); setFilterTo(e.target.value); }}
            InputLabelProps={{ shrink: true }} sx={{ width: 150 }}
          />
          <TextField
            select label="Category" size="small" value={filterCat}
            onChange={(e) => { setPage(0); setFilterCat(e.target.value); }}
            sx={{ width: 160 }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField
            select label="Office" size="small" value={filterOffice}
            onChange={(e) => { setPage(0); setFilterOffice(e.target.value); }}
            sx={{ width: 150 }}
          >
            <MenuItem value="">All Offices</MenuItem>
            {OFFICES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          {hasFilters && (
            <Button
              size="small" variant="outlined" color="inherit"
              onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterCat(""); setFilterOffice(""); setPage(0); }}
              sx={{ textTransform: "none", borderRadius: "6px", fontSize: 12 }}
            >
              Clear Filters
            </Button>
          )}
          <Typography fontSize={12} color="text.secondary" sx={{ ml: "auto" }}>
            {total} expense{total !== 1 ? "s" : ""} found
          </Typography>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── DataGrid ──────────────────────────────────────────────────────── */}
      <Card className="rmui-card" sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f6f7f9" },
            "& .MuiDataGrid-cell": { fontSize: 13, borderColor: "divider" },
            "& .MuiDataGrid-footerContainer": { borderTop: "1px solid", borderColor: "divider" },
          }}
        />
      </Card>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <BootstrapDialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        className="rmu-modal"
      >
        <Box
          sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f6f7f9", padding: { xs: "15px 20px", md: "20px 25px" },
          }}
          className="rmu-modal-header"
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "16px", md: "18px" } }}>
            {editing ? "Edit Expense" : "Add New Expense"}
          </Typography>
          <IconButton size="small" onClick={handleClose}><ClearIcon /></IconButton>
        </Box>

        <Box className="rmu-modal-content">
          <Box sx={{ p: "25px" }} className="bg-white">
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  label="Title *" fullWidth size="small"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </Grid>

              {/* Amount + Currency */}
              <Grid item xs={6}>
                <TextField
                  label="Amount *" type="number" fullWidth size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select label="Currency" fullWidth size="small"
                  value={form.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Exchange Rate — hidden for GBP */}
              {!isBaseCurrency && (
                <Grid item xs={12}>
                  <TextField
                    label={`Exchange Rate (${form.currency} → GBP) *`}
                    type="number" fullWidth size="small"
                    inputProps={{ min: 0.000001, step: "0.0001" }}
                    value={form.exchange_rate}
                    onChange={(e) => setForm((f) => ({ ...f, exchange_rate: e.target.value }))}
                    helperText={
                      form.amount && form.exchange_rate
                        ? `GBP equivalent: ${fmtGbp(previewBase)}`
                        : "Enter the rate to convert to GBP"
                    }
                  />
                </Grid>
              )}

              {/* Office + Category */}
              <Grid item xs={6}>
                <TextField
                  select label="Office" fullWidth size="small"
                  value={form.office_location}
                  onChange={(e) => setForm((f) => ({ ...f, office_location: e.target.value }))}
                >
                  {OFFICES.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select label="Category" fullWidth size="small"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <MenuItem value="">— None —</MenuItem>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Date */}
              <Grid item xs={12}>
                <TextField
                  label="Date *" type="date" fullWidth size="small"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Grid>

              {/* Receipt URL */}
              <Grid item xs={12}>
                <TextField
                  label="Receipt URL" fullWidth size="small" placeholder="https://..."
                  value={form.receipt_url}
                  onChange={(e) => setForm((f) => ({ ...f, receipt_url: e.target.value }))}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Notes" fullWidth size="small" multiline rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Grid>

              {/* Actions */}
              <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                <Button variant="outlined" color="inherit" onClick={handleClose} sx={{ textTransform: "none", borderRadius: "6px" }}>
                  Cancel
                </Button>
                <Button
                  variant="contained" onClick={handleSave} disabled={saving}
                  sx={{ textTransform: "none", borderRadius: "6px", boxShadow: "none", minWidth: 100 }}
                >
                  {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editing ? "Update" : "Add Expense"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </BootstrapDialog>

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this expense? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" color="inherit" sx={{ textTransform: "none", borderRadius: "6px" }}>
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
