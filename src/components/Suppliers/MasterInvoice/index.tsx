"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useRouter } from "next/navigation";
import api from "@/api/api";
import CurrencySelect from "@/components/Common/CurrencySelect";

// ── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: number;
  name: string;
  supplier_currency?: string;
  supplier_currencies?: string[];
}

interface SupplierCharge {
  id: number;
  supplier_id: number;
  booking_id: number | null;
  service_type: string;
  description: string;
  amount: string | number;
  currency: string | null;
  status: string;
  created_at: string;
  booking?: { id: number; booking_number: string } | null;
}

// ── Service-type colour map ───────────────────────────────────────────────────

const SERVICE_COLORS: Record<string, "primary" | "success" | "warning" | "error" | "default"> = {
  flight:    "primary",
  hotel:     "success",
  transport: "warning",
  activity:  "error",
};

// ── Column definitions ────────────────────────────────────────────────────────

const columns: GridColDef[] = [
  {
    field: "service_type",
    headerName: "Type",
    width: 120,
    renderCell: ({ value }) => (
      <Chip
        label={String(value).toUpperCase()}
        color={SERVICE_COLORS[value] ?? "default"}
        size="small"
        sx={{ fontWeight: 700, fontSize: 11 }}
      />
    ),
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1,
    minWidth: 180,
  },
  {
    field: "booking_number",
    headerName: "Booking",
    width: 140,
    valueGetter: (_value: unknown, row: SupplierCharge) =>
      row.booking?.booking_number ?? "—",
  },
  {
    field: "amount",
    headerName: "Amount",
    width: 130,
    align: "right",
    headerAlign: "right",
    valueFormatter: (value: unknown) =>
      typeof value === "number" || typeof value === "string"
        ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0.00",
  },
  {
    field: "currency",
    headerName: "CCY",
    width: 80,
    valueGetter: (_value: unknown, row: SupplierCharge) => row.currency ?? "—",
  },
  {
    field: "created_at",
    headerName: "Logged",
    width: 140,
    valueFormatter: (value: unknown) =>
      value ? new Date(value as string).toLocaleDateString() : "—",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const MasterInvoice: React.FC = () => {
  const router = useRouter();

  // Supplier selection
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Charges
  const [charges, setCharges] = useState<SupplierCharge[]>([]);
  const [chargesLoading, setChargesLoading] = useState(false);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  // Form fields
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("");
  const [notes, setNotes] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Load suppliers ──────────────────────────────────────────────────────────

  useEffect(() => {
    api
      .get("/api/suppliers")
      .then((r) => {
        const list: Supplier[] = Array.isArray(r.data?.data)
          ? r.data.data
          : Array.isArray(r.data)
          ? r.data
          : [];
        setSuppliers(list);
      })
      .catch(() => {});
  }, []);

  // ── Load unbilled charges when supplier changes ─────────────────────────────

  const fetchCharges = useCallback(async (supplierId: number) => {
    setChargesLoading(true);
    setCharges([]);
    setSelectionModel([]);
    try {
      const r = await api.get("/api/supplier-charges", {
        params: { supplier_id: supplierId, status: "unbilled" },
      });
      setCharges(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch {
      setCharges([]);
    } finally {
      setChargesLoading(false);
    }
  }, []);

  const supplierCurrencies = selectedSupplier?.supplier_currencies?.length
    ? selectedSupplier.supplier_currencies
    : selectedSupplier?.supplier_currency
    ? [selectedSupplier.supplier_currency]
    : [];

  useEffect(() => {
    if (selectedSupplier) {
      fetchCharges(selectedSupplier.id);
      // Pre-fill currency from the supplier's first accepted currency
      const first = selectedSupplier.supplier_currencies?.[0] ?? selectedSupplier.supplier_currency;
      if (first) {
        setCurrency(first);
      }
    } else {
      setCharges([]);
      setSelectionModel([]);
    }
  }, [selectedSupplier, fetchCharges]);

  // ── Derived totals ──────────────────────────────────────────────────────────

  const selectedCharges = charges.filter((c) =>
    selectionModel.includes(c.id)
  );
  const totalAmount = selectedCharges.reduce(
    (sum, c) => sum + Number(c.amount ?? 0),
    0
  );

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedSupplier) return;
    if (selectionModel.length === 0) {
      setError("Please select at least one charge.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/supplier-charges/master-invoice", {
        charge_ids:  selectionModel,
        supplier_id: selectedSupplier.id,
        due_date:    dueDate,
        currency:    currency || null,
        notes:       notes || null,
      });
      setSuccess(true);
      setTimeout(() => router.push("/suppliers/invoices"), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to generate master invoice.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          gap: 2,
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 64, color: "#22c55e" }} />
        <Typography variant="h5" fontWeight={700}>
          Master Invoice Generated
        </Typography>
        <Typography color="text.secondary">
          Redirecting to invoices…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header card ── */}
      <Card
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #605DFF 0%, #8b5cf6 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <ReceiptLongOutlinedIcon sx={{ fontSize: 44, opacity: 0.9 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Generate Master Invoice
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Bundle multiple unbilled supplier charges into a single invoice
          </Typography>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* ── Left: supplier + filter ── */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              1. Select Supplier
            </Typography>
            <Autocomplete
              options={suppliers}
              getOptionLabel={(s) => s.name}
              value={selectedSupplier}
              onChange={(_e, val) => setSelectedSupplier(val)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Supplier"
                  placeholder="Search suppliers…"
                  variant="outlined"
                />
              )}
            />

            {selectedSupplier && (
              <Box mt={3}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} mb={2}>
                  2. Invoice Details
                </Typography>

                <TextField
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <Box mb={2}>
                  <CurrencySelect
                    value={currency}
                    onChange={setCurrency}
                    label="Invoice Currency"
                  />
                  {supplierCurrencies.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {selectedSupplier?.name} accepts:
                      </Typography>
                      {supplierCurrencies.map((code) => (
                        <Chip
                          key={code}
                          label={code}
                          size="small"
                          clickable
                          onClick={() => setCurrency(code)}
                          color={currency === code ? "primary" : "default"}
                          variant={currency === code ? "filled" : "outlined"}
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  placeholder="Optional internal notes…"
                />
              </Box>
            )}
          </Card>
        </Grid>

        {/* ── Right: charges grid ── */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              3. Select Charges to Bundle
            </Typography>

            {!selectedSupplier ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                  borderStyle: "dashed",
                }}
              >
                <Typography color="text.secondary">
                  Select a supplier to load their unbilled charges.
                </Typography>
              </Paper>
            ) : chargesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={36} sx={{ color: "#605DFF" }} />
              </Box>
            ) : charges.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                  borderStyle: "dashed",
                }}
              >
                <Typography color="text.secondary">
                  No unbilled charges found for this supplier.
                </Typography>
              </Paper>
            ) : (
              <DataGrid
                rows={charges}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={setSelectionModel}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: "rgba(96,93,255,0.06)",
                    fontWeight: 700,
                  },
                }}
              />
            )}

            {/* ── Summary footer ── */}
            {selectionModel.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(96,93,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="body2" color="text.secondary" flex={1}>
                  <strong>{selectionModel.length}</strong> charge
                  {selectionModel.length !== 1 ? "s" : ""} selected
                </Typography>
                <Typography variant="h6" fontWeight={700} color="#605DFF">
                  Total:{" "}
                  {totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {currency || ""}
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Error / Submit ── */}
      {error && (
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => router.push("/suppliers/invoices")}
          sx={{
            borderColor: "#605DFF",
            color: "#605DFF",
            borderRadius: 2,
            px: 3,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Tooltip
          title={
            !selectedSupplier
              ? "Select a supplier first"
              : selectionModel.length === 0
              ? "Select at least one charge"
              : !dueDate
              ? "Enter a due date"
              : ""
          }
        >
          <span>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !selectedSupplier ||
                selectionModel.length === 0 ||
                !dueDate
              }
              startIcon={
                submitting ? (
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                ) : (
                  <ReceiptLongOutlinedIcon />
                )
              }
              sx={{
                bgcolor: "#605DFF",
                "&:hover": { bgcolor: "#4b48cc" },
                borderRadius: 2,
                px: 4,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(96,93,255,0.35)",
              }}
            >
              {submitting ? "Generating…" : "Generate Master Invoice"}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MasterInvoice;
