// File: app/bookings/manage-bookings/[bookingNumber]/components/Step5Form.tsx
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
  Autocomplete,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";

export interface Supplier { id: number; name: string; email: string; }
export interface TransportEntry {
  id?: number;
  vehicle_type: string;
  pickup_location: string;
  pickup_time: string;
  dropoff_location: string;
  cost: number;
  internal_cost: number;
  supplier_id?: number;
}

interface Props {
  data: TransportEntry[];
  suppliers: Supplier[];
  onSave: (arr: TransportEntry[]) => Promise<void>;
  onCancel: () => void;
  canSeeInternalCosts?: boolean;
}

export default function Step5Form({ data, suppliers, onSave, onCancel, canSeeInternalCosts }: Props) {
  const [entries, setEntries] = useState<TransportEntry[]>([...data]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntry = () =>
    setEntries(e => [
      ...e,
      {
        vehicle_type: "",
        pickup_location: "",
        pickup_time: "",
        dropoff_location: "",
        cost: 0,
        internal_cost: 0,
        supplier_id: undefined,
      },
    ]);

  const removeEntry = (idx: number) => setEntries(e => e.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(entries);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogContent dividers>
        {entries.map((t, i) => (
          <Grid container spacing={2} alignItems="flex-end" key={i} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <TextField
                label="Vehicle Type"
                value={t.vehicle_type}
                onChange={e => {
                  const v = e.target.value;
                  setEntries(en => { const c = [...en]; c[i].vehicle_type = v; return c; });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Pickup Location"
                value={t.pickup_location}
                onChange={e => { const v=e.target.value; setEntries(en=>{const c=[...en];c[i].pickup_location=v;return c;}); }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Pickup Time"
                type="time"
                value={t.pickup_time}
                onChange={e => { const v=e.target.value; setEntries(en=>{const c=[...en];c[i].pickup_time=v;return c;}); }}
                InputLabelProps={{ shrink:true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Dropoff Location"
                value={t.dropoff_location}
                onChange={e => { const v=e.target.value; setEntries(en=>{const c=[...en];c[i].dropoff_location=v;return c;}); }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => removeEntry(i)}><DeleteIcon /></IconButton>
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Cost"
                type="number"
                value={t.cost === 0 ? "" : t.cost}
                onChange={e => { const v=+e.target.value; setEntries(en=>{const c=[...en];c[i].cost=v;return c;}); }}
                fullWidth
              />
            </Grid>
            {canSeeInternalCosts && (
            <Grid item xs={2}>
              <TextField
                label="Internal Cost"
                type="number"
                value={t.internal_cost === 0 ? "" : t.internal_cost}
                onChange={e => { const v=+e.target.value; setEntries(en=>{const c=[...en];c[i].internal_cost=v;return c;}); }}
                fullWidth
              />
            </Grid>
            )}
            <Grid item xs={4}>
              <Autocomplete
                options={sortSuppliersByType(suppliers, "transport")}
                groupBy={(opt) => supplierGroupLabel(opt, "transport")}
                getOptionLabel={opt => `${opt.name} (${opt.email})`}
                value={suppliers.find(s => s.id === t.supplier_id) || null}
                onChange={(_, sel) => setEntries(en=>{const c=[...en];c[i].supplier_id=sel?.id;return c;})}
                renderInput={params => <TextField {...params} label="Supplier" />}
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Box sx={{ mt: 1 }}>
          <Button onClick={addEntry}>Add Transport</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {error && <Alert severity="error" sx={{ mr: 1 }}>{error}</Alert>}
        <LoadingButton loading={loading} variant="contained" onClick={handleSave}>Save</LoadingButton>
      </DialogActions>
    </>
  );
}
