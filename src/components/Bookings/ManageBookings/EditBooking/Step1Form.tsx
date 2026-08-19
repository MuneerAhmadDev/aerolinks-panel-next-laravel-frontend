// File: app/bookings/manage-bookings/[bookingNumber]/components/Step1Form.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/api/api";
import { defaultCountries } from "react-international-phone";

// Full country list (name + ISO2 code), reusing the data already bundled
// with react-international-phone so it stays in sync with the phone inputs.
const countryList = defaultCountries
  .map(([name, iso2]) => ({ code: iso2.toUpperCase(), label: name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export interface Customer {
  id: number;
  name: string;
  passport_number: string;
  passport_expiry: string;
  issuing_country: string;
  date_of_birth: string;
  is_leading: boolean;
  email?: string;
  address?: string;
  phone?: string;
  phoneCode?: string;
  alternate_phone?: string;
  contact?: {
    email?: string;
    address?: string;
    phone_code?: string;
    phone?: string;
    alternate_phone?: string;
  };
}

export interface Step1Data {
  booking_date: string;
  departure_date: string;
  return_date: string;
  status: string;
  booking_type: string;
  selling_cost: number;
  passengers_count: number;
  customers: Customer[];
}

interface Props {
  data: Step1Data;
  onSave: (d: Step1Data) => Promise<void>;
  onCancel: () => void;
}

export default function Step1Form({ data, onSave, onCancel }: Props) {
  const [departure, setDeparture] = useState(data.departure_date || "");
  const [ret, setRet] = useState(data.return_date || "");
  const [status, setStatus] = useState(data.status || "pending");
  const [btype, setBtype] = useState(data.booking_type || "flight");
  const [sellCost, setSellCost] = useState(
    data.selling_cost?.toString() || ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalErr, setGlobalErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize customers from API payload, pulling pivot.is_leading and contact.*
//   const [customers, setCustomers] = useState<Customer[]>(() =>
//     (data.customers || []).map((c) => ({
//       id: c.id,
//       name: c.name,
//       passport_number: c.passport_number,
//       passport_expiry: c.passport_expiry,
//       issuing_country: c.issuing_country,
//       date_of_birth: c.date_of_birth,
//       is_leading: Boolean((c as any).pivot?.is_leading),
//       email: c.email || "",
//       address: c.address || "",
//       phoneCode: c.phoneCode || "",
//       phone: c.phone || "",
//       alternate_phone: c.alternate_phone || "",
//     }))
//   );
const [customers, setCustomers] = useState<Customer[]>(() =>
    (data.customers || []).map((c) => ({
      id: c.id,
      name: c.name,
      passport_number: c.passport_number,
      passport_expiry: c.passport_expiry,
      issuing_country: c.issuing_country,
      date_of_birth: c.date_of_birth,
    //   is_leading: Boolean((c as any).pivot?.is_leading),
    // pivot.is_leading === 1 marks the lead passenger
    is_leading: (c as any).pivot?.is_leading === 1,
      // pulled from contact sub-object
      email: c.contact?.email || "",
      address: c.contact?.address || "",
      phoneCode: c.contact?.phone_code || "",
      phone: c.contact?.phone || "",
      alternate_phone: c.contact?.alternate_phone || "",
    }))
  );
  

  const [existing, setExisting] = useState<Customer[]>([]);
  useEffect(() => {
    api
      .get("/api/customers")
      .then((r) =>
        setExisting(Array.isArray(r.data) ? r.data : (r.data as any).data)
      )
      .catch(() => {});
  }, []);

  // Only one can be leading
  const handleLeading = (idx: number) =>
    setCustomers((cs) =>
      cs.map((c, i) => ({ ...c, is_leading: i === idx }))
    );

//   const validate = (): boolean => {
//     setGlobalErr(null);
//     const errs: Record<string, string> = {};
//     if (!departure) errs.departure_date = "Required";
//     if (!ret) errs.return_date = "Required";
//     if (!sellCost) errs.selling_cost = "Required";
//     if (customers.length === 0) setGlobalErr("At least one customer");
//     if (customers.filter((c) => c.is_leading).length !== 1)
//       setGlobalErr("Exactly one leading customer");
//     setErrors(errs);
//     return Object.keys(errs).length === 0 && !globalErr;
//   };

const validate = (): boolean => {
    const errs: Record<string, string> = {};
    let gErr: string | null = null;
  
    // field‐level
    if (!departure)        errs.departure_date = "Required";
    if (!ret)              errs.return_date    = "Required";
    if (!sellCost)         errs.selling_cost   = "Required";
  
    // global
    if (customers.length === 0) {
      gErr = "At least one customer";
    } else if (customers.filter((c) => c.is_leading).length !== 1) {
      gErr = "Exactly one leading customer";
    }
  
    setErrors(errs);
    setGlobalErr(gErr);
  
    // succeed only if no field errors and no global error
    return Object.keys(errs).length === 0 && gErr === null;
  };
  

//   const handleSave = async () => {
//     if (!validate()) return;
//     setLoading(true);
//     try {
//       await onSave({
//         booking_date: data.booking_date,
//         departure_date: departure,
//         return_date: ret,
//         status,
//         booking_type: btype,
//         selling_cost: +sellCost,
//         passengers_count: customers.length,
//         customers,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

const handleSave = async () => {
    if (!validate()) return;
  
    setLoading(true);
    try {
      await onSave({
        booking_date: data.booking_date,
        departure_date: departure,
        return_date: ret,
        status,
        booking_type: btype,
        selling_cost: +sellCost,
        passengers_count: customers.length,
        customers,
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <DialogContent dividers>
        {/* Booking Details */}
        <Box mb={4}>
          <Typography variant="h6">Booking Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Departure"
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                error={!!errors.departure_date}
                helperText={errors.departure_date}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Return"
                type="date"
                value={ret}
                onChange={(e) => setRet(e.target.value)}
                error={!!errors.return_date}
                helperText={errors.return_date}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Selling Cost"
                type="number"
                value={sellCost}
                onChange={(e) => setSellCost(e.target.value)}
                error={!!errors.selling_cost}
                helperText={errors.selling_cost}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="issued">Issued</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={btype}
                  label="Type"
                  onChange={(e) => setBtype(e.target.value)}
                >
                  <MenuItem value="flight">Flight</MenuItem>
                  <MenuItem value="umrah">Umrah</MenuItem>
                  <MenuItem value="holiday">Holiday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Passengers */}
        <Box>
          <Typography variant="h6">Passengers</Typography>
          <Divider sx={{ mb: 2 }} />

          <Autocomplete
            multiple
            options={existing}
            getOptionLabel={(opt) => `${opt.passport_number} – ${opt.name}`}
            onChange={(_, arr) =>
              setCustomers((cs) => [
                ...cs,
                ...arr.filter(
                  (n) =>
                    !cs.some((c) => c.passport_number === n.passport_number)
                ),
              ])
            }
            renderInput={(params) => (
              <TextField {...params} label="Add Existing Customers" />
            )}
            sx={{ mb: 3 }}
          />

          {customers.map((cust, i) => (
            <Card key={i} variant="outlined" sx={{ mb: 2 }}>
              <CardHeader
                title={cust.name || "New Passenger"}
                action={
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={cust.is_leading}
                        onChange={() => handleLeading(i)}
                      />
                    }
                    label="Lead"
                  />
                }
              />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={4}>
                    <TextField
                      label="Name"
                      value={cust.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomers((cs) => {
                          const copy = [...cs];
                          copy[i].name = v;
                          return copy;
                        });
                      }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Passport#"
                      value={cust.passport_number}
                      onChange={(e) =>
                        setCustomers((cs) => {
                          const copy = [...cs];
                          copy[i].passport_number = e.target.value;
                          return copy;
                        })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Expiry"
                      type="date"
                      value={cust.passport_expiry}
                      onChange={(e) =>
                        setCustomers((cs) => {
                          const copy = [...cs];
                          copy[i].passport_expiry = e.target.value;
                          return copy;
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() =>
                        setCustomers((cs) => cs.filter((_, idx) => idx !== i))
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={4}>
                    <Autocomplete
                      options={countryList}
                      getOptionLabel={(o) => o.label}
                      value={
                        countryList.find(
                          (c) => c.label === cust.issuing_country || c.code === cust.issuing_country
                        ) || null
                      }
                      onChange={(_, v) =>
                        setCustomers((cs) => {
                          const copy = [...cs];
                          copy[i].issuing_country = v ? v.label : "";
                          return copy;
                        })
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Country" fullWidth />
                      )}
                    />
                  </Grid>
                </Grid>

                {cust.is_leading && (
                  <Box mt={3}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1">Contact Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          label="Email"
                          value={cust.email || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomers((cs) => {
                              const copy = [...cs];
                              copy[i].email = v;
                              return copy;
                            });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Address"
                          value={cust.address || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomers((cs) => {
                              const copy = [...cs];
                              copy[i].address = v;
                              return copy;
                            });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          label="Phone Code"
                          value={cust.phoneCode || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomers((cs) => {
                              const copy = [...cs];
                              copy[i].phoneCode = v;
                              return copy;
                            });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          label="Phone"
                          value={cust.phone || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomers((cs) => {
                              const copy = [...cs];
                              copy[i].phone = v;
                              return copy;
                            });
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Alternate Phone"
                          value={cust.alternate_phone || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomers((cs) => {
                              const copy = [...cs];
                              copy[i].alternate_phone = v;
                              return copy;
                            });
                          }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}

          {globalErr && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {globalErr}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={loading}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </>
  );
}
