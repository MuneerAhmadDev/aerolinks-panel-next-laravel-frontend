// File: app/bookings/manage-bookings/[bookingNumber]/components/Step4Form.tsx
"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Autocomplete,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";

export interface Supplier { id: number; name: string; email: string; }
export interface VisaEntry {
  id?: number;
  visa_type: string;
  previous_nationality?: string;
  airline_code: string;
  flight_code: string;
  visa_status: string;
  remarks: string;
  cost: number;
  internal_cost: number;
  supplier_id?: number;
}

interface Props {
  data: VisaEntry[];
  suppliers: Supplier[];
  onSave: (arr: VisaEntry[]) => Promise<void>;
  onCancel: () => void;
  canSeeInternalCosts?: boolean;
}

export default function Step4Form({ data, suppliers, onSave, onCancel, canSeeInternalCosts }: Props) {
  const [entries, setEntries] = useState<VisaEntry[]>(() =>
    data.map((v) => {
      // The API returns cost under the nested visa_booking_costs records
      // (a single "global" record per visa booking), not flat cost/internal_cost
      // fields — derive them so the edit form isn't stuck showing 0.
      const costRecords: any[] = Array.isArray((v as any).visa_booking_costs)
        ? (v as any).visa_booking_costs
        : [];
      const globalRecord = costRecords.find((cr) => cr.costable_type === "global") ?? costRecords[0];
      return {
        ...v,
        cost: v.cost ?? Number(globalRecord?.cost ?? 0),
        internal_cost: v.internal_cost ?? Number(globalRecord?.internal_cost ?? 0),
      };
    })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntry = () =>
    setEntries(e => [
      ...e,
      {
        visa_type: "",
        previous_nationality: "",
        airline_code: "",
        flight_code: "",
        visa_status: "Pending",
        remarks: "",
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
        {entries.map((v, i) => (
          <Grid container spacing={2} alignItems="flex-end" key={i} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Visa Type</InputLabel>
                <Select
                  value={v.visa_type}
                  label="Visa Type"
                  onChange={e => {
                    const val = e.target.value;
                    setEntries(en => {
                      const c = [...en]; c[i].visa_type = val; return c;
                    });
                  }}
                >
                  <MenuItem value="umrah">Umrah Visa</MenuItem>
                  <MenuItem value="tourist">Tourist Visa</MenuItem>
                  <MenuItem value="evw">EVW Visa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Prev Nationality"
                value={v.previous_nationality}
                onChange={e => {
                  const val = e.target.value;
                  setEntries(en => { const c = [...en]; c[i].previous_nationality = val; return c; });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Airline"
                value={v.airline_code}
                onChange={e => { const val = e.target.value; setEntries(en => { const c=[...en]; c[i].airline_code=val; return c; }); }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Flight"
                value={v.flight_code}
                onChange={e => { const val=e.target.value; setEntries(en => { const c=[...en]; c[i].flight_code=val; return c; }); }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => removeEntry(i)}><DeleteIcon /></IconButton>
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Visa Status"
                value={v.visa_status}
                onChange={e => { const val=e.target.value; setEntries(en=>{const c=[...en];c[i].visa_status=val;return c;}); }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Cost"
                type="number"
                value={v.cost === 0 ? "" : v.cost}
                onChange={e => { const val=+e.target.value; setEntries(en=>{const c=[...en];c[i].cost=val;return c;}); }}
                fullWidth
              />
            </Grid>
            {canSeeInternalCosts && (
            <Grid item xs={3}>
              <TextField
                label="Internal Cost"
                type="number"
                value={v.internal_cost === 0 ? "" : v.internal_cost}
                onChange={e => { const val=+e.target.value; setEntries(en=>{const c=[...en];c[i].internal_cost=val;return c;}); }}
                fullWidth
              />
            </Grid>
            )}
            <Grid item xs={4}>
              <Autocomplete
                options={sortSuppliersByType(suppliers, "visa")}
                groupBy={(opt) => supplierGroupLabel(opt, "visa")}
                getOptionLabel={opt => `${opt.name} (${opt.email})`}
                value={suppliers.find(s => s.id === v.supplier_id) || null}
                onChange={(_, sel) => setEntries(en => { const c=[...en];c[i].supplier_id=sel?.id;return c; })}
                renderInput={params=><TextField {...params} label="Supplier" />}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 1 }}>
              <TextField
                label="Remarks"
                value={v.remarks}
                onChange={e => {const val=e.target.value;setEntries(en=>{const c=[...en];c[i].remarks=val;return c;});}}
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Box sx={{ mt: 1 }}>
          <Button onClick={addEntry}>Add Visa</Button>
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
