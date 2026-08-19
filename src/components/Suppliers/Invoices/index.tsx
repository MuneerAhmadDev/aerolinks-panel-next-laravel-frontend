"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptIcon from "@mui/icons-material/Receipt";
import api from "@/api/api";
import Swal from "sweetalert2";
import CurrencySelect from "@/components/Common/CurrencySelect";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Supplier {
  id: number;
  name: string;
  supplier_currency: string;
  supplier_currencies?: string[];
}

interface Invoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier: Supplier;
  booking_id: number | null;
  booking: { id: number; booking_number: string } | null;
  service_types: string[] | null;
  amount: number;
  conversion_rate: number;
  currency: string | null;
  is_paid: boolean;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

const SERVICE_TYPES = ["flight", "hotel", "visa", "transport", "activity"];

// Backend dates arrive as full ISO datetimes (e.g. "2026-06-30T00:00:00.000000Z")
// since due_date/paid_date are cast to `date` on the model. Two different shapes
// are needed: a short display string for the grid, and a plain YYYY-MM-DD for
// <input type="date"> in the edit form (which renders blank on anything else).
const toDateInputValue = (value?: string | null): string => (value ? value.slice(0, 10) : "");

const formatDateDisplay = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Component ───────────────────────────────────────────────────────────────

const SupplierInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterPaid, setFilterPaid] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    supplier_id: "",
    booking_number: "",
    service_types: [] as string[],
    amount: "",
    conversion_rate: "1.00",
    currency: "",
    due_date: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterSupplier) params.supplier_id = filterSupplier;
      if (filterPaid !== "") params.is_paid = filterPaid;
      if (filterService) params.service_type = filterService;
      if (filterFrom) params.date_from = filterFrom;
      if (filterTo) params.date_to = filterTo;

      const res = await api.get("/api/invoices", { params });
      setInvoices(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filterSupplier, filterPaid, filterService, filterFrom, filterTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    api.get("/api/suppliers").then((r) => setSuppliers(r.data.data ?? []));
  }, []);

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditInvoice(null);
    setForm({
      supplier_id: "",
      booking_number: "",
      service_types: [],
      amount: "",
      conversion_rate: "1.00",
      currency: "",
      due_date: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setForm({
      supplier_id: String(inv.supplier_id),
      booking_number: inv.booking?.booking_number ?? "",
      service_types: inv.service_types ?? [],
      amount: String(inv.amount),
      conversion_rate: String(inv.conversion_rate),
      currency: inv.currency ?? "",
      due_date: toDateInputValue(inv.due_date),
      notes: inv.notes ?? "",
    });
    setDialogOpen(true);
  };

  // When supplier changes, pre-fill currency from their first accepted currency
  const handleSupplierChange = (id: string) => {
    const sup = suppliers.find((s) => String(s.id) === id);
    const firstCurrency = sup?.supplier_currencies?.[0] ?? sup?.supplier_currency ?? "";
    setForm((f) => ({
      ...f,
      supplier_id: id,
      currency: firstCurrency || f.currency,
    }));
  };

  const selectedFormSupplier = suppliers.find((s) => String(s.id) === form.supplier_id);
  const selectedFormSupplierCurrencies =
    selectedFormSupplier?.supplier_currencies?.length
      ? selectedFormSupplier.supplier_currencies
      : selectedFormSupplier?.supplier_currency
      ? [selectedFormSupplier.supplier_currency]
      : [];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Resolve booking_id from booking_number if provided
      let booking_id: number | null = null;
      if (form.booking_number.trim()) {
        try {
          const res = await api.get(`/api/bookings/${form.booking_number.trim()}`);
          booking_id = res.data?.booking?.id ?? res.data?.id ?? null;
        } catch {
          // booking not found – leave null
        }
      }

      const payload: Record<string, unknown> = {
        supplier_id:     Number(form.supplier_id),
        booking_id,
        service_types:   form.service_types.length ? form.service_types : null,
        amount:          Number(form.amount),
        conversion_rate: Number(form.conversion_rate) || 1,
        currency:        form.currency || null,
        due_date:        form.due_date,
        notes:           form.notes || null,
      };

      if (editInvoice) {
        await api.put(`/api/invoices/${editInvoice.id}`, payload);
      } else {
        await api.post("/api/invoices", payload);
      }

      setDialogOpen(false);
      fetchInvoices();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save invoice.";
      Swal.fire("Error", msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Mark paid ──────────────────────────────────────────────────────────────

  const handleMarkPaid = async (inv: Invoice) => {
    const { isConfirmed } = await Swal.fire({
      title: "Mark as Paid?",
      text: `${inv.invoice_number} — ${inv.supplier.name}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark paid",
      confirmButtonColor: "#605DFF",
    });
    if (!isConfirmed) return;

    await api.put(`/api/invoices/${inv.id}`, {
      is_paid:   true,
      paid_date: new Date().toISOString().split("T")[0],
    });
    fetchInvoices();
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (inv: Invoice) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete Invoice?",
      text: `${inv.invoice_number} will be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#f44336",
    });
    if (!isConfirmed) return;

    await api.delete(`/api/invoices/${inv.id}`);
    fetchInvoices();
  };

  // ── DataGrid columns ───────────────────────────────────────────────────────

  const columns: GridColDef[] = [
    {
      field: "invoice_number",
      headerName: "Invoice #",
      width: 150,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <ReceiptIcon fontSize="small" sx={{ color: "#605DFF" }} />
          <strong>{p.value}</strong>
        </Box>
      ),
    },
    {
      field: "supplier",
      headerName: "Supplier",
      width: 170,
      valueGetter: (_v: unknown, row: Invoice) => row.supplier?.name ?? "-",
    },
    {
      field: "service_types",
      headerName: "Services",
      width: 160,
      renderCell: (p: GridRenderCellParams<Invoice>) =>
        p.row.service_types?.length ? (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.5, flexWrap: "wrap" }}>
            {p.row.service_types.map((t) => (
              <Chip
                key={t}
                label={t.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ textTransform: "uppercase", fontSize: 10, height: 20 }}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Typography variant="caption" color="text.disabled" sx={{ m: 0 }}>—</Typography>
          </Box>
        ),
    },
    {
      field: "booking",
      headerName: "Booking #",
      width: 120,
      valueGetter: (_v: unknown, row: Invoice) => row.booking?.booking_number ?? "—",
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 150,
      renderCell: (p: GridRenderCellParams<Invoice>) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ m: 0 }}>
            {p.row.currency || ""} {Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
        </Box>
      ),
    },
    {
      field: "conversion_rate",
      headerName: "Conv. Rate",
      width: 100,
      valueFormatter: (v: unknown) => `× ${Number(v).toFixed(2)}`,
    },
    {
      field: "due_date",
      headerName: "Due Date",
      width: 120,
      valueFormatter: (v: unknown) => formatDateDisplay(v as string),
    },
    {
      field: "is_paid",
      headerName: "Status",
      width: 110,
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={p.value ? "Paid" : "Unpaid"}
          size="small"
          color={p.value ? "success" : "warning"}
          variant={p.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "paid_date",
      headerName: "Paid On",
      width: 120,
      valueGetter: (_v: unknown, row: Invoice) => formatDateDisplay(row.paid_date),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      renderCell: (p: GridRenderCellParams<Invoice>) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", height: "100%" }}>
          {!p.row.is_paid && (
            <Tooltip title="Mark as Paid">
              <IconButton size="small" color="success" onClick={() => handleMarkPaid(p.row)}>
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(p.row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalAmount  = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidAmount   = invoices.filter((i) => i.is_paid).reduce((s, i) => s + Number(i.amount), 0);
  const unpaidAmount = totalAmount - paidAmount;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Stats row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Invoices", value: invoices.length, color: "#605DFF" },
          { label: "Total Amount",   value: `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#2196f3" },
          { label: "Paid",           value: `$${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,  color: "#4caf50" },
          { label: "Outstanding",    value: `$${unpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#ff9800" },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card
              sx={{
                p: 2,
                borderLeft: `4px solid ${s.color}`,
                boxShadow: "none",
                borderRadius: "7px",
              }}
              className="rmui-card"
            >
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main card */}
      <Card
        sx={{ boxShadow: "none", borderRadius: "7px", p: { xs: "18px", sm: "20px", lg: "25px" } }}
        className="rmui-card"
      >
        {/* Toolbar */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Supplier Invoices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ textTransform: "none", borderRadius: "6px" }}
          >
            New Invoice
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Supplier</InputLabel>
              <Select
                value={filterSupplier}
                label="Supplier"
                onChange={(e) => setFilterSupplier(e.target.value)}
              >
                <MenuItem value="">All Suppliers</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterPaid}
                label="Status"
                onChange={(e) => setFilterPaid(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="0">Unpaid</MenuItem>
                <MenuItem value="1">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select
                value={filterService}
                label="Service"
                onChange={(e) => setFilterService(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {SERVICE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={invoices}
            columns={columns}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{ border: "none", "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8f9fa" } }}
          />
        )}
      </Card>

      {/* ─── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editInvoice ? `Edit ${editInvoice.invoice_number}` : "New Supplier Invoice"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {/* Supplier */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={form.supplier_id}
                  label="Supplier"
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  {suppliers.map((s) => {
                    const codes = s.supplier_currencies?.length ? s.supplier_currencies : [s.supplier_currency];
                    return (
                      <MenuItem key={s.id} value={String(s.id)}>
                        {s.name} <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.secondary" }}>({codes.join(", ")})</Typography>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Supplier's accepted currencies — persistent reference, not just a one-time pre-fill */}
            {form.supplier_id && selectedFormSupplierCurrencies.length > 0 && (
              <Grid item xs={12} sx={{ mt: -1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="caption" color="text.secondary">
                    Accepts:
                  </Typography>
                  {selectedFormSupplierCurrencies.map((code) => (
                    <Chip
                      key={code}
                      label={code}
                      size="small"
                      clickable
                      onClick={() => setForm((f) => ({ ...f, currency: code }))}
                      color={form.currency === code ? "primary" : "default"}
                      variant={form.currency === code ? "filled" : "outlined"}
                      sx={{ height: 22, fontSize: 11 }}
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Booking number (optional) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Booking # (optional)"
                fullWidth
                size="small"
                value={form.booking_number}
                onChange={(e) => setForm((f) => ({ ...f, booking_number: e.target.value }))}
                placeholder="e.g. AL100001"
              />
            </Grid>

            {/* Service types — an invoice can bundle charges across more than one */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                size="small"
                disableCloseOnSelect
                options={SERVICE_TYPES}
                getOptionLabel={(t) => t.charAt(0).toUpperCase() + t.slice(1)}
                value={form.service_types}
                onChange={(_e, newValue) => setForm((f) => ({ ...f, service_types: newValue }))}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox size="small" style={{ marginRight: 8 }} checked={selected} />
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Service Types" placeholder="Select…" />
                )}
              />
            </Grid>

            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                fullWidth
                required
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </Grid>

            {/* Currency */}
            <Grid item xs={6} sm={3}>
              <CurrencySelect
                value={form.currency}
                onChange={(code) => setForm((f) => ({ ...f, currency: code }))}
                label="Currency"
                size="small"
              />
            </Grid>

            {/* Conversion rate */}
            <Grid item xs={6} sm={3}>
              <TextField
                label="Conv. Rate"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: "0.0001" }}
                value={form.conversion_rate}
                onChange={(e) => setForm((f) => ({ ...f, conversion_rate: e.target.value }))}
                helperText="1 = same currency"
              />
            </Grid>

            {/* Due date */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Due Date"
                fullWidth
                required
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Grid>

            {/* Converted total preview */}
            {form.amount && Number(form.conversion_rate) > 0 && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    background: "#f0f4ff",
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    display: "flex",
                    gap: 3,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Original:&nbsp;
                    <strong>{form.currency} {Number(form.amount).toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Converted:&nbsp;
                    <strong>${(Number(form.amount) * Number(form.conversion_rate)).toFixed(2)}</strong>
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.supplier_id || !form.amount || !form.due_date}
            sx={{ textTransform: "none" }}
          >
            {saving ? <CircularProgress size={20} /> : (editInvoice ? "Save Changes" : "Create Invoice")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierInvoices;
