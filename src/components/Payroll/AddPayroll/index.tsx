"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  createFilterOptions,
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
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import Link from "next/link";
import api from "@/api/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  user: { name: string };
}

interface BonusTypeOption {
  id: number;
  name: string;
  inputValue?: string;
  isNew?: boolean;
}

const bonusTypeFilter = createFilterOptions<BonusTypeOption>();

/** Matches CommissionSlab model fields returned by /api/payroll/preview */
interface CommissionTier {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number | null;  // null = no upper limit
  percentage: number;
}

interface PayrollPreview {
  employee_id: number;
  employee_name: string;
  basic_salary: number;
  salary_id: number | null;
  period_start: string;
  period_end: string;
  booking_count: number;
  total_sales: number;
  commission_rate: number;
  commission_amount: number;
  commission_tiers: CommissionTier[];
  bookings: { id: number; booking_number: string; selling_cost: number; booking_type: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as £1,234.56 */
const fmtGBP = (n: number) =>
  "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Attachment upload ────────────────────────────────────────────────────────

const AttachmentUpload: React.FC<{
  attachment: File | null;
  setAttachment: (f: File | null) => void;
}> = ({ attachment, setAttachment }) => (
  <Box
    onDrop={(e) => {
      e.preventDefault();
      if (e.dataTransfer.files[0]) setAttachment(e.dataTransfer.files[0]);
    }}
    onDragOver={(e) => e.preventDefault()}
    onClick={() => document.getElementById("payroll-attachment")?.click()}
    sx={{ border: "2px dashed #ccc", borderRadius: 2, p: 2, textAlign: "center", cursor: "pointer" }}
  >
    {attachment ? (
      <Box>
        <Typography variant="body2">{attachment.name}</Typography>
        <Button variant="text" color="error" size="small" onClick={(e) => { e.stopPropagation(); setAttachment(null); }}>
          Remove
        </Button>
      </Box>
    ) : (
      <Typography variant="body2" color="text.secondary">Drag & drop file here or click to select</Typography>
    )}
    <input id="payroll-attachment" type="file" hidden onChange={(e) => {
      if (e.target.files?.[0]) setAttachment(e.target.files[0]);
    }} />
  </Box>
);

// ─── Main component ───────────────────────────────────────────────────────────

const AddPayroll: React.FC = () => {
  // ── Employee & period ──────────────────────────────────────────────────────
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [periodStart, setPeriodStart]       = useState("");
  const [periodEnd, setPeriodEnd]           = useState("");

  // ── Preview data ───────────────────────────────────────────────────────────
  const [preview, setPreview]               = useState<PayrollPreview | null>(null);
  const [previewing, setPreviewing]         = useState(false);

  // ── Manual adjustments ────────────────────────────────────────────────────
  const [allowance,  setAllowance]          = useState(0);
  const [overtime,   setOvertime]           = useState(0);
  const [bonus,      setBonus]              = useState(0);
  const [bonusTypes, setBonusTypes]         = useState<BonusTypeOption[]>([]);
  const [bonusType,  setBonusType]          = useState<BonusTypeOption | null>(null);
  const [creatingBonusType, setCreatingBonusType] = useState(false);
  const [deduction,  setDeduction]          = useState(0);
  const [paymonth,   setPaymonth]           = useState("");
  const [paymentMethod, setPaymentMethod]   = useState("");
  const [bankName,   setBankName]           = useState("");
  const [accountNumber, setAccountNumber]   = useState("");
  const [chequeNumber, setChequeNumber]     = useState("");
  const [note,       setNote]               = useState("");
  const [attachment, setAttachment]         = useState<File | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [error,   setError]     = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  const commissionAmount = preview?.commission_amount ?? 0;
  const basicSalary      = preview?.basic_salary      ?? 0;
  const grossSalary      = basicSalary + commissionAmount + allowance + overtime + bonus;
  const netSalary        = grossSalary - deduction;

  // ── Fetch employees ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/employees").then((r) => setEmployees(Array.isArray(r.data) ? r.data : []));
  }, []);

  // ── Fetch bonus types ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/bonus-types").then((r) => setBonusTypes(Array.isArray(r.data) ? r.data : []));
  }, []);

  // Create a new bonus type on the fly (used when the typed value has no match)
  const handleCreateBonusType = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Someone else may have already created this exact type — reuse it instead of erroring.
    const existing = bonusTypes.find((bt) => bt.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setBonusType(existing);
      return;
    }

    setCreatingBonusType(true);
    try {
      const res = await api.post("/api/bonus-types", { name: trimmed });
      const created: BonusTypeOption = res.data;
      setBonusTypes((prev) => [...prev, created]);
      setBonusType(created);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to create bonus type."
      );
    } finally {
      setCreatingBonusType(false);
    }
  }, [bonusTypes]);

  // ── Default period = current month ─────────────────────────────────────────
  useEffect(() => {
    const now   = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setPeriodStart(first);
    setPeriodEnd(last);
    setPaymonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  // ── Fetch preview ──────────────────────────────────────────────────────────
  const fetchPreview = useCallback(async () => {
    if (!selectedEmployee || !periodStart || !periodEnd) return;
    setPreviewing(true);
    setPreview(null);
    setError(null);
    try {
      const res = await api.get("/api/payroll/preview", {
        params: {
          employee_id:  selectedEmployee.id,
          period_start: periodStart,
          period_end:   periodEnd,
        },
      });
      setPreview(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to fetch payroll preview."
      );
    } finally {
      setPreviewing(false);
    }
  }, [selectedEmployee, periodStart, periodEnd]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!preview)             { setError("Please fetch & calculate the payroll first."); return; }
    if (!preview.salary_id)   { setError("No salary record found for this employee. Please create one first."); return; }
    if (!paymonth)            { setError("Please select a pay month."); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("salary_id",         String(preview.salary_id));
      formData.append("payment_date",      new Date().toISOString().split("T")[0]);
      formData.append("paymonth",          `${paymonth}-01`);
      formData.append("commission_amount", String(commissionAmount));
      formData.append("gross_salary",      String(grossSalary));
      formData.append("net_salary",        String(netSalary));
      formData.append("deduction",         String(deduction));
      formData.append("allowance",         String(allowance));
      formData.append("overtime",          String(overtime));
      formData.append("bonus",             String(bonus));
      if (bonusType) formData.append("bonus_type_id", String(bonusType.id));
      formData.append("status",            "pending");
      formData.append("payment_method",    paymentMethod);
      formData.append("bank_name",         bankName);
      formData.append("account_number",    accountNumber);
      formData.append("cheque_number",     chequeNumber);
      formData.append("note",              note);
      if (attachment) formData.append("attachment", attachment);

      await api.post("/api/salary-details", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Payroll added successfully!");
      setSelectedEmployee(null);
      setPreview(null);
      setAllowance(0); setOvertime(0); setBonus(0); setBonusType(null); setDeduction(0);
      setPaymentMethod(""); setBankName(""); setAccountNumber("");
      setChequeNumber(""); setNote(""); setAttachment(null);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "An error occurred while adding payroll."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Card
      sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: "18px", sm: "20px", lg: "25px" } }}
      className="rmui-card"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>

          {/* ── Step 1: Employee & Period ── */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              1. Select Employee & Pay Period
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={employees}
              getOptionLabel={(o) => o.user?.name ?? String(o.id)}
              value={selectedEmployee}
              onChange={(_e, v) => { setSelectedEmployee(v); setPreview(null); }}
              renderInput={(params) => <TextField {...params} label="Employee" required />}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Period Start"
              type="date"
              fullWidth
              value={periodStart}
              onChange={(e) => { setPeriodStart(e.target.value); setPreview(null); }}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Period End"
              type="date"
              fullWidth
              value={periodEnd}
              onChange={(e) => { setPeriodEnd(e.target.value); setPreview(null); }}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={2} sx={{ display: "flex", alignItems: "flex-start" }}>
            <Button
              variant="outlined"
              startIcon={previewing ? <CircularProgress size={16} /> : <CalculateIcon />}
              onClick={fetchPreview}
              disabled={!selectedEmployee || !periodStart || !periodEnd || previewing}
              sx={{ textTransform: "none", borderRadius: "6px", height: 56, width: "100%" }}
            >
              {previewing ? "Fetching…" : "Fetch & Calculate"}
            </Button>
          </Grid>

          {/* ── Commission Preview Panel ── */}
          {preview && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
                  2. Commission Breakdown
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                  <Chip
                    label={`${preview.booking_count} booking${preview.booking_count !== 1 ? "s" : ""} found`}
                    variant="outlined"
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`Total Sales: ${fmtGBP(preview.total_sales)}`}
                    variant="outlined"
                    color="info"
                    size="small"
                  />
                  <Chip
                    label={`Commission Rate: ${preview.commission_rate}%`}
                    variant="outlined"
                    color={preview.commission_rate > 0 ? "success" : "default"}
                    size="small"
                  />
                  <Chip
                    label={`Commission: ${fmtGBP(preview.commission_amount)}`}
                    color="success"
                    size="small"
                  />
                </Box>
              </Grid>

              {preview.commission_tiers.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Employee Commission Tiers
                  </Typography>
                  <Table size="small" sx={{ "& td, & th": { py: 0.5, px: 1 } }}>
                    <TableHead>
                      <TableRow sx={{ background: "#f8f9fa" }}>
                        <TableCell>Min Sales</TableCell>
                        <TableCell>Max Sales</TableCell>
                        <TableCell>Rate %</TableCell>
                        <TableCell>Active</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.commission_tiers.map((tier) => {
                        const isActive = tier.percentage === preview.commission_rate;
                        return (
                          <TableRow
                            key={tier.id ?? `${tier.min_amount}-${tier.percentage}`}
                            sx={isActive ? { bgcolor: "#f0fff4" } : undefined}
                          >
                            <TableCell>{fmtGBP(tier.min_amount)}</TableCell>
                            <TableCell>
                              {tier.max_amount != null ? fmtGBP(tier.max_amount) : (
                                <Typography component="span" fontSize={12} color="text.secondary">No limit</Typography>
                              )}
                            </TableCell>
                            <TableCell>{tier.percentage}%</TableCell>
                            <TableCell>
                              {isActive && <Chip label="Active" size="small" color="success" />}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Grid>
              )}

              {preview.bookings.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    Bookings in Period
                  </Typography>
                  <Box sx={{ maxHeight: 160, overflowY: "auto" }}>
                    <Table size="small" sx={{ "& td, & th": { py: 0.5, px: 1 } }}>
                      <TableHead>
                        <TableRow sx={{ background: "#f8f9fa" }}>
                          <TableCell>Booking #</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.bookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>{b.booking_number}</TableCell>
                            <TableCell>{b.booking_type}</TableCell>
                            <TableCell>{fmtGBP(b.selling_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Grid>
              )}

              {/* ── Step 3: Adjustments ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
                  3. Adjustments & Totals
                </Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  label="Basic Salary"
                  value={fmtGBP(preview.basic_salary)}
                  fullWidth
                  disabled
                  variant="filled"
                  InputProps={{ sx: { "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed" } } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Commission"
                  value={fmtGBP(commissionAmount)}
                  fullWidth
                  disabled
                  variant="filled"
                  InputProps={{ sx: { "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed" } } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Allowance" type="number" fullWidth value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Overtime" type="number" fullWidth value={overtime}
                  onChange={(e) => setOvertime(Number(e.target.value))} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Bonus" type="number" fullWidth value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Autocomplete
                  freeSolo
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  loading={creatingBonusType}
                  options={bonusTypes}
                  value={bonusType}
                  onChange={(_, newValue) => {
                    if (!newValue) { setBonusType(null); return; }
                    if (typeof newValue === "string") {
                      handleCreateBonusType(newValue);
                    } else if (newValue.isNew) {
                      handleCreateBonusType(newValue.inputValue ?? newValue.name);
                    } else {
                      setBonusType(newValue);
                    }
                  }}
                  filterOptions={(options, params) => {
                    const filtered = bonusTypeFilter(options, params);
                    const { inputValue } = params;
                    const exists = options.some(
                      (o) => inputValue.toLowerCase() === o.name.toLowerCase()
                    );
                    if (inputValue !== "" && !exists) {
                      filtered.push({ id: -1, name: inputValue, inputValue, isNew: true });
                    }
                    return filtered;
                  }}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.inputValue ?? option.name
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.isNew ? `+ Add "${option.name}" as new bonus type` : option.name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Bonus Type" placeholder="Select or type new…" />
                  )}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Deduction" type="number" fullWidth value={deduction}
                  onChange={(e) => setDeduction(Number(e.target.value))} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Gross Salary"
                  value={fmtGBP(grossSalary)}
                  fullWidth
                  disabled
                  variant="filled"
                  InputProps={{ sx: { "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed" } } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Net Salary"
                  value={fmtGBP(netSalary)}
                  fullWidth
                  disabled
                  variant="filled"
                  InputProps={{ sx: { "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed" } } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Pay Month"
                  type="month"
                  fullWidth
                  required
                  value={paymonth}
                  onChange={(e) => setPaymonth(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ── Step 4: Payment Info ── */}
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
                  4. Payment Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="">Select…</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Bank Name" fullWidth value={bankName}
                  onChange={(e) => setBankName(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Account Number" fullWidth value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Cheque Number" fullWidth value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Note" fullWidth multiline rows={2} value={note}
                  onChange={(e) => setNote(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <AttachmentUpload attachment={attachment} setAttachment={setAttachment} />
              </Grid>
            </>
          )}
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <AlertTitle>{success}</AlertTitle>
            <Link href="/payroll/payroll-list">View Payroll List</Link>
          </Alert>
        )}

        {preview && (
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              sx={{ textTransform: "capitalize", borderRadius: "6px" }}
              onClick={() => { setSelectedEmployee(null); setPreview(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ textTransform: "capitalize", borderRadius: "6px", px: 4 }}
            >
              {submitting ? <CircularProgress size={20} /> : "Add Payroll"}
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default AddPayroll;
