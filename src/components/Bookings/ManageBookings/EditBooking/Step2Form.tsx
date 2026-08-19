// File: app/bookings/manage-bookings/[bookingNumber]/components/Step2Form.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Alert,
  Typography,
  IconButton,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";
import RichTextEditor from "@/components/RichTextEditor";

export interface FlightEntryExtended {
  id?: number;
  pnr: string;
  itinerary: string;
  remarks: string;
  atol: boolean;
  issuedFare: number;
  globalCost: boolean;
  globalCostData: { cost: number; internal_cost: number };
  costs: Array<{ customer_id: number; cost: number; internal_cost: number }>;
  supplier_id?: number;
}
export interface Customer { id: number; name: string; passport_number: string; }
export interface Supplier { id: number; name: string; email?: string; }

type EntryErrors = {
  pnr?: string;
  itinerary?: string;
  remarks?: string;
  issuedFare?: string;
  globalCostData?: { cost?: string; internal_cost?: string };
  costs?: { [idx: number]: { cost?: string; internal_cost?: string } };
};

interface Props {
  data: FlightEntryExtended[];
  customers: Customer[];
  suppliers: Supplier[];
  onSave: (arr: FlightEntryExtended[]) => Promise<void>;
  onCancel: () => void;
  canSeeInternalCosts?: boolean;
}

export default function Step2Form({ data, customers, suppliers, onSave, onCancel, canSeeInternalCosts }: Props) {
  const { bookingNumber } = useParams();
//   const [entries, setEntries] = useState<FlightEntryExtended[]>(() => data.map(d => ({ ...d })));
    // const [entries, setEntries] = useState<FlightEntryExtended[]>(() =>
    //     Array.isArray(data) ? data.map(d => ({ ...d })) : []
    // );
    const [entries, setEntries] = useState<FlightEntryExtended[]>(() =>
        Array.isArray(data)
          ? data.map(d => {
              // The API returns costs nested under `flight_booking_costs`
              // (one "global" record, or one "single" record per customer) —
              // not as `issuedFare`/`globalCostData`/`costs` directly on the
              // flight booking. Derive the form fields from those records.
              const costRecords: any[] = Array.isArray((d as any).flight_booking_costs)
                ? (d as any).flight_booking_costs
                : [];
              const globalRecord = costRecords.find((cr) => cr.costable_type === "global");
              const singleRecords = costRecords.filter((cr) => cr.costable_type === "single");
              const isGlobal = costRecords.length === 0 || Boolean(globalRecord);

              return {
                id: d.id,
                pnr: d.pnr,
                itinerary: d.itinerary,
                remarks: d.remarks,
                atol: d.atol,
                supplier_id: (d as any).supplier_id ?? undefined,
                issuedFare: Number(globalRecord?.issued_fare ?? costRecords[0]?.issued_fare ?? 0),
                globalCost: isGlobal,
                globalCostData: {
                  cost: Number(globalRecord?.cost ?? 0),
                  internal_cost: Number(globalRecord?.internal_cost ?? 0),
                },
                costs: Array.isArray(customers)
                  ? customers.map((c) => {
                      const rec = singleRecords.find((cr) => Number(cr.costable_id) === c.id);
                      return {
                        customer_id: c.id,
                        cost: Number(rec?.cost ?? 0),
                        internal_cost: Number(rec?.internal_cost ?? 0),
                      };
                    })
                  : [],
              };
            })
          : []
      );
  const [fieldErrors, setFieldErrors] = useState<EntryErrors[]>(() => entries.map(() => ({})));
  const inputRefs = useRef<Record<string, HTMLInputElement | null>[]>(entries.map(() => ({})));
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    setFieldErrors(entries.map(() => ({})));
    inputRefs.current = entries.map(() => ({}));
  }, [entries.length]);

  const updateEntry = (idx: number, changes: Partial<FlightEntryExtended>) =>
    setEntries(e => e.map((ent, i) => i === idx ? { ...ent, ...changes } : ent));

  const addEntry = () => setEntries(e => [
    ...e,
    {
      pnr: "",
      itinerary: "",
      remarks: "",
      atol: false,
      supplier_id: undefined,
      issuedFare: 0,
      globalCost: true,
      globalCostData: { cost: 0, internal_cost: 0 },
    //   costs: customers.map(c => ({ customer_id: c.id, cost: 0, internal_cost: 0 })),
    costs: Array.isArray(customers)
        ? customers.map(c => ({ customer_id: c.id, cost: 0, internal_cost: 0 }))
        : [],
    }
  ]);

  const removeEntry = (idx: number) => setEntries(e => e.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setLoading(true);
    setGlobalError(null);
    setFieldErrors(entries.map(() => ({})));
    try {
      await onSave(entries);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data.errors) {
        const errs = err.response.data.errors as Record<string, string[]>;
        const newErrors: EntryErrors[] = entries.map(() => ({}));
        let firstRef: HTMLInputElement | null = null;

        Object.entries(errs).forEach(([fullKey, msgs]) => {
          let idx = 0;
          let field = fullKey;
          if (fullKey.includes('.')) {
            const parts = fullKey.split('.');
            if (!isNaN(+parts[0])) { idx = +parts[0]; field = parts[1]; }
          }

          if (field === 'costs') {
            const [, , costIdxStr, costField] = fullKey.split('.');
            const costIdx = parseInt(costIdxStr, 10);
            newErrors[idx].costs = newErrors[idx].costs || {};
            newErrors[idx].costs![costIdx] = {
              ...(newErrors[idx].costs![costIdx] || {}),
              [costField]: msgs[0],
            };
            const refKey = `costs_${costIdx}_${costField}`;
            const refEl = inputRefs.current[idx]?.[refKey];
            if (!firstRef && refEl) firstRef = refEl;
          } else {
            (newErrors[idx] as any)[field] = msgs[0];
            const refEl = inputRefs.current[idx]?.[field];
            if (!firstRef && refEl) firstRef = refEl;
          }
        });

        setFieldErrors(newErrors);
        // firstRef?.focus();
        (firstRef as unknown as HTMLInputElement)?.focus();
      } else {
        setGlobalError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Booking #: {bookingNumber}
        </Typography>
        {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}

        {entries.map((f, i) => (
          <Box key={i} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, position: 'relative' }}>
            <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => removeEntry(i)}>
              <DeleteIcon />
            </IconButton>

            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={10}>
                <Autocomplete
                    multiple
                    options={customers}
                    getOptionLabel={(c) => c.name +' - ' + c.passport_number}
                    value={customers.filter((c) =>
                    f.costs.some((fc) => fc.customer_id === c.id)
                    )}
                    onChange={(_, newList) => {
                    // rebuild costs array preserving any existing cost values
                    const updatedCosts = newList.map((c) => {
                        const existing = f.costs.find((fc) => fc.customer_id === c.id);
                        return existing ?? { customer_id: c.id, cost: 0, internal_cost: 0 };
                    });
                    updateEntry(i, { costs: updatedCosts });
                    }}
                    renderInput={(params) => (
                    <TextField {...params} label="Passengers" placeholder="Select…" />
                    )}
                />
              </Grid>  
              <Grid item xs={4}>
                <TextField
                  label="PNR"
                  value={f.pnr}
                  onChange={e => updateEntry(i, { pnr: e.target.value })}
                  error={Boolean(fieldErrors[i]?.pnr)}
                  helperText={fieldErrors[i]?.pnr}
                  inputRef={el => {
                    if (!inputRefs.current[i]) inputRefs.current[i] = {};
                    inputRefs.current[i]['pnr'] = el;
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <Autocomplete
                  options={sortSuppliersByType(suppliers, "flight")}
                  groupBy={(opt) => supplierGroupLabel(opt, "flight")}
                  getOptionLabel={(s) => s.name}
                  value={suppliers.find((s) => s.id === f.supplier_id) || null}
                  onChange={(_, sel) => updateEntry(i, { supplier_id: sel?.id })}
                  renderInput={(params) => <TextField {...params} label="Supplier" />}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Remarks"
                  value={f.remarks}
                  onChange={e => updateEntry(i, { remarks: e.target.value })}
                  error={Boolean(fieldErrors[i]?.remarks)}
                  helperText={fieldErrors[i]?.remarks}
                  inputRef={el => {
                    if (!inputRefs.current[i]) inputRefs.current[i] = {};
                    inputRefs.current[i]['remarks'] = el;
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <FormControlLabel
                  control={<Checkbox checked={f.atol} onChange={e => updateEntry(i, { atol: e.target.checked })} />}  
                  label="ATOL"
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  label="Issued Fare"
                  type="number"
                  value={f.issuedFare === 0 ? "" : f.issuedFare}
                  onChange={e => updateEntry(i, { issuedFare: +e.target.value })}
                  error={Boolean(fieldErrors[i]?.issuedFare)}
                  helperText={fieldErrors[i]?.issuedFare}
                  inputRef={el => {
                    if (!inputRefs.current[i]) inputRefs.current[i] = {};
                    inputRefs.current[i]['issuedFare'] = el;
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={8}>
                <FormControlLabel
                  control={<Checkbox checked={f.globalCost} onChange={e => updateEntry(i, { globalCost: e.target.checked })} />}
                  label="Use Global Cost"
                />
              </Grid>
            </Grid>

            {f.globalCost ? (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Global Cost"
                    type="number"
                    value={f.globalCostData.cost === 0 ? "" : f.globalCostData.cost}
                    onChange={e => updateEntry(i, { globalCostData: { ...f.globalCostData, cost: +e.target.value } })}
                    error={Boolean(fieldErrors[i]?.globalCostData?.cost)}
                    helperText={fieldErrors[i]?.globalCostData?.cost}
                    inputRef={el => {
                      if (!inputRefs.current[i]) inputRefs.current[i] = {};
                      inputRefs.current[i]['globalCostData_cost'] = el;
                    }}
                    fullWidth
                  />
                </Grid>
                {canSeeInternalCosts && (
                <Grid item xs={6}>
                  <TextField
                    label="Global Internal Cost"
                    type="number"
                    value={f.globalCostData.internal_cost === 0 ? "" : f.globalCostData.internal_cost}
                    onChange={e => updateEntry(i, { globalCostData: { ...f.globalCostData, internal_cost: +e.target.value } })}
                    error={Boolean(fieldErrors[i]?.globalCostData?.internal_cost)}
                    helperText={fieldErrors[i]?.globalCostData?.internal_cost}
                    inputRef={el => {
                      if (!inputRefs.current[i]) inputRefs.current[i] = {};
                      inputRefs.current[i]['globalCostData_internal_cost'] = el;
                    }}
                    fullWidth
                  />
                </Grid>
                )}
              </Grid>
            ) : (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Per-Passenger Costs</Typography>
                {f.costs.map((c, ci) => {
                  const cust = customers.find(x => x.id === c.customer_id);
                  return (
                    <Grid container spacing={2} alignItems="center" key={c.customer_id} sx={{ mb: 1 }}>
                      <Grid item xs={4}><Typography>{cust?.name}</Typography></Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Cost"
                          type="number"
                          value={c.cost === 0 ? "" : c.cost}
                          onChange={e => updateEntry(i, { costs: f.costs.map((cc,k) => k===ci?{...cc,cost:+e.target.value}:cc) })}
                          error={Boolean(fieldErrors[i]?.costs?.[ci]?.cost)}
                          helperText={fieldErrors[i]?.costs?.[ci]?.cost}
                          inputRef={el => {
                            if (!inputRefs.current[i]) inputRefs.current[i] = {};
                            inputRefs.current[i][`costs_${ci}_cost`] = el;
                          }}
                          fullWidth
                        />
                      </Grid>
                      {canSeeInternalCosts && (
                      <Grid item xs={4}>
                        <TextField
                          label="Internal Cost"
                          type="number"
                          value={c.internal_cost === 0 ? "" : c.internal_cost}
                          onChange={e => updateEntry(i, { costs: f.costs.map((cc,k) => k===ci?{...cc,internal_cost:+e.target.value}:cc) })}
                          error={Boolean(fieldErrors[i]?.costs?.[ci]?.internal_cost)}
                          helperText={fieldErrors[i]?.costs?.[ci]?.internal_cost}
                          inputRef={el => {
                            if (!inputRefs.current[i]) inputRefs.current[i] = {};
                            inputRefs.current[i][`costs_${ci}_internal_cost`] = el;
                          }}
                          fullWidth
                        />
                      </Grid>
                      )}
                    </Grid>
                  );
                })}
              </Box>
            )}
            
            <Grid item xs={3}
                sx={{ mt: 4 }}
            >
                {/* <TextField
                  label="Itinerary"
                  value={f.itinerary}
                  onChange={e => updateEntry(i, { itinerary: e.target.value })}
                  error={Boolean(fieldErrors[i]?.itinerary)}
                  helperText={fieldErrors[i]?.itinerary}
                  inputRef={el => {
                    if (!inputRefs.current[i]) inputRefs.current[i] = {};
                    inputRefs.current[i]['itinerary'] = el;
                  }}
                  fullWidth
                /> */}
                <FormControl error={Boolean(fieldErrors[i]?.itinerary)}>
                    <RichTextEditor 
                        value={f.itinerary}
                        onChange={e => updateEntry(i, { itinerary: e })}
                        label="Itinerary"
                        // inputRef={el => {
                        // if (!inputRefs.current[i]) inputRefs.current[i] = {};
                        // inputRefs.current[i]['itinerary'] = el;
                        // }}
                        // fullWidth
                    />
                    <FormHelperText>{fieldErrors[i]?.itinerary}</FormHelperText>
                </FormControl>
              </Grid>
          </Box>
        ))}
        <Button onClick={addEntry} sx={{ mt: 1 }}>Add Flight Booking</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <LoadingButton variant="contained" onClick={handleSave} loading={loading}>Save</LoadingButton>
      </DialogActions>
    </>
  );
}