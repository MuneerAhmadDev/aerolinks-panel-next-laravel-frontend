// File: app/bookings/manage-bookings/[bookingNumber]/components/Step3Form.tsx
"use client";
import React, { useState } from "react";
import {
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  TextField,
  IconButton,
  Autocomplete,
  Alert
} from "@mui/material";

import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";
export interface Supplier { id: number; name: string; email: string; }
export interface HotelEntry {
  id?: number;
  hotel_name: string;
  hotel_address: string;
  meal_type: string;
  room_allocation: number;
  room_type: string;
  room_view: string;
  remarks: string;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  nights: number;
  cost: number;
  internal_cost: number;
  supplier_id?: number;
} // assuming shared types file

interface Props {
  data: HotelEntry[];
  suppliers: Supplier[];
  onSave: (arr: HotelEntry[]) => Promise<void>;
  onCancel: () => void;
  canSeeInternalCosts?: boolean;
}

export default function Step3Form({ data, suppliers, onSave, onCancel, canSeeInternalCosts }: Props) {
  const [entries, setEntries] = useState<HotelEntry[]>([...data]);
  const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
  
  const addEntry = () =>
    setEntries(e => [
      ...e,
      {
        hotel_name: "",
        hotel_address: "",
        meal_type: "",
        room_allocation: 1,
        room_type: "",
        room_view: "",
        remarks: "",
        check_in_date: new Date().toISOString().split("T")[0],
        check_in_time: "12:00",
        check_out_date: new Date().toISOString().split("T")[0],
        nights: 1,
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
        {entries.map((h, i) => (
          <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <TextField
                  label="Hotel Name"
                  value={h.hotel_name}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].hotel_name = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Address"
                  value={h.hotel_address}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].hotel_address = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Meal Type"
                  value={h.meal_type}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].meal_type = v;
                      return c;
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
            <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={2}>
                <TextField
                  label="Rooms"
                  type="number"
                  value={h.room_allocation === 0 ? "" : h.room_allocation}
                  onChange={e => {
                    const v = +e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].room_allocation = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="Type"
                  value={h.room_type}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].room_type = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  label="View"
                  value={h.room_view}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].room_view = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Check-In"
                  type="date"
                  value={h.check_in_date}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].check_in_date = v;
                      return c;
                    });
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Check-Out"
                  type="date"
                  value={h.check_out_date}
                  onChange={e => {
                    const v = e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].check_out_date = v;
                      return c;
                    });
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={2}>
                <TextField
                  label="Nights"
                  type="number"
                  value={h.nights === 0 ? "" : h.nights}
                  onChange={e => {
                    const v = +e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].nights = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Cost"
                  type="number"
                  value={h.cost === 0 ? "" : h.cost}
                  onChange={e => {
                    const v = +e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].cost = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              {canSeeInternalCosts && (
              <Grid item xs={3}>
                <TextField
                  label="Internal Cost"
                  type="number"
                  value={h.internal_cost === 0 ? "" : h.internal_cost}
                  onChange={e => {
                    const v = +e.target.value;
                    setEntries(en => {
                      const c = [...en];
                      c[i].internal_cost = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              )}
              <Grid item xs={4}>
                <Autocomplete
                  options={sortSuppliersByType(suppliers, "hotel")}
                  groupBy={(opt) => supplierGroupLabel(opt, "hotel")}
                  getOptionLabel={opt => `${opt.name} (${opt.email})`}
                  value={suppliers.find(s => s.id === h.supplier_id) || null}
                  onChange={(_, sel) =>
                    setEntries(en => {
                      const c = [...en];
                      c[i].supplier_id = sel?.id;
                      return c;
                    })
                  }
                  renderInput={params => <TextField {...params} label="Supplier" />}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 1 }}>
              <TextField
                label="Remarks"
                value={h.remarks}
                onChange={e => {
                  const v = e.target.value;
                  setEntries(en => {
                    const c = [...en];
                    c[i].remarks = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Box>
          </Box>
        ))}
        <Button onClick={addEntry}>Add Hotel</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        {/* <Button variant="contained" onClick={handleSave}>Save</Button> */}
                <LoadingButton variant="contained" onClick={handleSave} loading={loading}>Save</LoadingButton>
        
      </DialogActions>
    </>
  );
}
