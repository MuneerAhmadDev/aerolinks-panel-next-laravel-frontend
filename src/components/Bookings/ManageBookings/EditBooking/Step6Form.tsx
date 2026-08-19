// File: app/bookings/manage-bookings/[bookingNumber]/components/Step6Form.tsx
"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Autocomplete,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";

export interface Supplier { id: number; name: string; email: string; }
export interface ActivityEntry {
  id?: number;
  activity_name: string;
  pickup_location: string;
  tour_datetime: string;
  has_guide: boolean;
  guide_cost?: number;
  cost: number;
  internal_cost: number;
  supplier_id?: number;
}

interface Props {
  data: ActivityEntry[];
  suppliers: Supplier[];
  onSave: (arr: ActivityEntry[]) => Promise<void>;
  onCancel: () => void;
  canSeeInternalCosts?: boolean;
}

export default function Step6Form({ data, suppliers, onSave, onCancel, canSeeInternalCosts }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([...data]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntry = () =>
    setEntries(e => [
      ...e,
      {
        activity_name: "",
        pickup_location: "",
        tour_datetime: "",
        has_guide: false,
        guide_cost: 0,
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
        {entries.map((a, i) => (
          <Grid container spacing={2} alignItems="flex-end" key={i} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <TextField
                label="Activity"
                value={a.activity_name}
                onChange={e => {
                  const v = e.target.value;
                  setEntries(en => { const c = [...en]; c[i].activity_name = v; return c; });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Pickup Location"
                value={a.pickup_location}
                onChange={e => { const v=e.target.value; setEntries(en=>{const c=[...en];c[i].pickup_location=v;return c;}); }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Date & Time"
                type="datetime-local"
                value={a.tour_datetime}
                onChange={e => { const v=e.target.value; setEntries(en=>{const c=[...en];c[i].tour_datetime=v;return c;}); }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => removeEntry(i)}><DeleteIcon /></IconButton>
            </Grid>

            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Guide</InputLabel>
                <Select
                  value={a.has_guide ? "Yes" : "No"}
                  label="Guide"
                  onChange={e => { const v=e.target.value === "Yes"; setEntries(en=>{const c=[...en];c[i].has_guide=v;return c;}); }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {a.has_guide && (
              <Grid item xs={3}>
                <TextField
                  label="Guide Cost"
                  type="number"
                  value={a.guide_cost === 0 ? "" : a.guide_cost}
                  onChange={e => { const v=+e.target.value; setEntries(en=>{const c=[...en];c[i].guide_cost=v;return c;}); }}
                  fullWidth
                />
              </Grid>
            )}

            <Grid item xs={2}>
              <TextField
                label="Cost"
                type="number"
                value={a.cost === 0 ? "" : a.cost}
                onChange={e => { const v=+e.target.value; setEntries(en=>{const c=[...en];c[i].cost=v;return c;}); }}
                fullWidth
              />
            </Grid>

            {canSeeInternalCosts && (
            <Grid item xs={2}>
              <TextField
                label="Internal Cost"
                type="number"
                value={a.internal_cost === 0 ? "" : a.internal_cost}
                onChange={e => { const v=+e.target.value; setEntries(en=>{const c=[...en];c[i].internal_cost=v;return c;}); }}
                fullWidth
              />
            </Grid>
            )}

            <Grid item xs={4}>
              <Autocomplete
                options={sortSuppliersByType(suppliers, "Activities")}
                groupBy={(opt) => supplierGroupLabel(opt, "Activities")}
                getOptionLabel={opt => `${opt.name} (${opt.email})`}
                value={suppliers.find(s => s.id === a.supplier_id) || null}
                onChange={(_, sel) => setEntries(en=>{const c=[...en];c[i].supplier_id=sel?.id;return c;})}
                renderInput={params => <TextField {...params} label="Supplier" />}
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Box sx={{ mt: 1 }}>
          <Button onClick={addEntry}>Add Activity</Button>
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
