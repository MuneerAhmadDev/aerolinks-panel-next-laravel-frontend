// File: app/bookings/manage-bookings/[bookingNumber]/components/Step7Form.tsx

"use client";

import React, { useState } from "react";
import {
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  IconButton,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LoadingButton from "@mui/lab/LoadingButton";

export interface PaymentEntry {
  id?: number;
  amount: number;
  payment_date: string;
  payment_method: string;
}

interface Props {
  data: PaymentEntry[];
  maxTotal: number;
  onSave: (arr: PaymentEntry[]) => Promise<void>;
  onCancel: () => void;
}

export default function Step7Form({ data, maxTotal, onSave, onCancel }: Props) {
  const [entries, setEntries] = useState<PaymentEntry[]>([...data]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const addEntry = () =>
    setEntries(e => [
      ...e,
      { amount: 0, payment_date: "", payment_method: "" },
    ]);

  const removeEntry = (idx: number) => setEntries(e => e.filter((_, i) => i !== idx));

  const total = entries.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleSave = async () => {
    if (entries.some(e => Number(e.amount) <= 0)) {
      setError("Each payment amount must be greater than zero.");
      return;
    }
    if (total > maxTotal) {
      setError(`Total payments (${total.toFixed(2)}) exceed selling cost (${maxTotal}).`);
      return;
    }
    // await onSave(entries);
    // onCancel();
    setLoading(true);
    try {
      await onSave(entries);
      onCancel();
    } catch (err) {
      setLoading(false);
      setError("Failed to save payments. Please try again.");
    }
  };

  return (
    <>
      <DialogContent dividers>
        {entries.map((p, i) => (
          <Grid container spacing={2} alignItems="flex-end" key={i} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <TextField
                label="Amount"
                type="number"
                value={p.amount === 0 ? "" : p.amount}
                onChange={e => {
                  const v = +e.target.value;
                  setEntries(en => {
                    const c = [...en]; c[i].amount = v; return c;
                  });
                }}
                inputProps={{ min: 0.01, step: 0.01 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Payment Date"
                type="datetime-local"
                value={p.payment_date}
                onChange={e => {
                  const v = e.target.value;
                  setEntries(en => {
                    const c = [...en]; c[i].payment_date = v; return c;
                  });
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Method"
                value={p.payment_method}
                onChange={e => {
                  const v = e.target.value;
                  setEntries(en => {
                    const c = [...en]; c[i].payment_method = v; return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => removeEntry(i)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Box sx={{ mt: 2 }}>
          <Typography>
            Total Entered: {total.toFixed(2)} / {maxTotal}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </Box>
        <Button onClick={addEntry} sx={{ mt: 2 }}>
          Add Payment
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {/* <Button variant="contained" onClick={handleSave}>
          Save
        </Button> */}
        <LoadingButton variant="contained" onClick={handleSave} loading={loading}>Save</LoadingButton>

      </DialogActions>
    </>
  );
}