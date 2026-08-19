// app/bookings/manage-bookings/[bookingNumber]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CardContent,
  CardActions,
  CardHeader,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/api/api";

// ---------- Shared Helpers & Static Data ----------
const countryList = [
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "PK", label: "Pakistan" },
  { code: "CA", label: "Canada" },
];
const getTomorrow = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
};
const addMonths = (dateStr: string, m: number) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + m);
  return d.toISOString().split("T")[0];
};

// ---------- Types ----------
interface Supplier { id: number; name: string; email: string; }

interface Customer {
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
interface FlightCostEntry {
  customer_id: number;
  cost: number;
  internal_cost: number;
}

interface FlightBookingCost {
  id: number;
  flight_booking_id: number;
  costable_type: "global" | "single";
  costable_id: number;
  issued_fare: number;
  cost: number| [];
  internal_cost: number;
  // …any other fields you need
}

type FlightEntryExtended = FlightEntry & {
  // bring in the raw pivot from the API
  flight_booking_costs?: FlightBookingCost[];

  // your extra form fields:
  issuedFare: number;
  globalCost: boolean;
  globalCostData: {
    cost: number;
    internal_cost: number;
  };
  costs: Array<{
    customer_id: number;
    cost: number;
    internal_cost: number;
  }>;
};

interface FlightEntry { 
  id?: number; 
  pnr: string; 
  itinerary: string; 
  remarks: string; 
  atol: boolean; 
  // new fields for edit
  issuedFare: number;
  globalCost: boolean;
  globalCostData: { cost: number; internal_cost: number };
  // costs: { customer_id: number; cost: number; internal_cost: number }[];
  costs: Array<{
    customer_id: number;
    cost: number;
    internal_cost: number;
  }>;
  
}

interface HotelEntry {
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
}
interface VisaEntry {
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
interface TransportEntry {
  id?: number;
  vehicle_type: string;
  pickup_from: string;
  pickup_time: string;
  dropoff: string;
  cost: number;
  internal_cost: number;
  supplier_id?: number;
}
interface ActivityEntry {
  id?: number;
  activity_name: string;
  pickup_location: string;
  datetime: string;
  guide: string;
  guideCost?: number;
  cost: number;
  internal_cost: number;
  supplier_id?: number;
}
interface PaymentEntry { id?: number; amount: number; payment_date: string; payment_method: string; }

interface BookingDetails {
  id: number;
  booking_number: string;
  booking_date: string;
  departure_date: string;
  return_date: string;
  status: string;
  booking_type: string;
  selling_cost: number;
  passengers_count: number;
  customers: Customer[];
  flight_bookings: FlightEntry[];
  hotel_bookings: HotelEntry[];
  visa_bookings: VisaEntry[];
  transport_bookings: TransportEntry[];
  activities_bookings: ActivityEntry[];
  payments: PaymentEntry[];
}


// ---------- Step 1 Form (Booking Details & Customers) ----------
type Step1Data = Partial<BookingDetails> & { customers: Customer[] };
const Step1Form: React.FC<{
  data: Step1Data;
  onSave: (d: Step1Data) => Promise<void>;
  onCancel: () => void;
}> = ({ data, onSave, onCancel }) => {
  const [departure, setDeparture] = useState(data.departure_date || "");
  const [ret, setRet] = useState(data.return_date || "");
  const [status, setStatus] = useState(data.status || "pending");
  const [btype, setBtype] = useState<string>(data.booking_type || "flight");
  const [sellCost, setSellCost] = useState(data.selling_cost?.toString() || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalErr, setGlobalErr] = useState<string | null>(null);

  // Map incoming payload.customers → our local Customer[], pulling pivot.is_leading
  // and contact.* into the fields the form expects.
  const [customers, setCustomers] = useState<Customer[]>(() =>
    (data.customers || []).map((c) => ({
      id: c.id,
      name: c.name,
      passport_number: c.passport_number,
      passport_expiry: c.passport_expiry,
      issuing_country: c.issuing_country,
      date_of_birth: c.date_of_birth,
      is_leading: Boolean((c as any).pivot?.is_leading),
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
      .then((r) => setExisting(Array.isArray(r.data) ? r.data : r.data.data))
      .catch(() => {});
  }, []);

  // ensure only one checkbox can be “lead”
  const handleLeading = (idx: number) => {
    setCustomers((cs) =>
      cs.map((c, i) => ({ ...c, is_leading: i === idx }))
    );
  };

  const validateAndSave = async () => {
    const errs: Record<string, string> = {};
    if (!departure) errs.departure_date = "Required";
    if (!ret) errs.return_date = "Required";
    if (!sellCost) errs.selling_cost = "Required";
    if (btype === "flight") {
      const minExp = addMonths(ret, 6);
      customers.forEach((c, i) => {
        if (!c.passport_expiry || c.passport_expiry < minExp) {
          errs[`passport_expiry_${i}`] = `Expiry ≥ ${minExp}`;
        }
      });
    }
    if (!customers.length) setGlobalErr("At least one customer");
    if (customers.filter((c) => c.is_leading).length !== 1)
      setGlobalErr("Exactly one leading customer");
    setErrors(errs);
    if (Object.keys(errs).length || globalErr) return;

    // strip our local-only props if needed, then save
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
                label="Booking Date"
                type="date"
                value={data.booking_date}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Departure"
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.departure_date}
                helperText={errors.departure_date}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Return"
                type="date"
                value={ret}
                onChange={(e) => setRet(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.return_date}
                helperText={errors.return_date}
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

          {/* Add existing */}
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
                      onChange={(e) =>
                        setCustomers((cs) => {
                          const c = [...cs];
                          c[i].name = e.target.value;
                          return c;
                        })
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Passport#"
                      value={cust.passport_number}
                      onChange={(e) =>
                        setCustomers((cs) => {
                          const c = [...cs];
                          c[i].passport_number = e.target.value;
                          return c;
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
                          const c = [...cs];
                          c[i].passport_expiry = e.target.value;
                          return c;
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                      error={!!errors[`passport_expiry_${i}`]}
                      helperText={errors[`passport_expiry_${i}`]}
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
                    <FormControl fullWidth>
                      <InputLabel>Country</InputLabel>
                      <Select
                        value={cust.issuing_country}
                        label="Country"
                        onChange={(e) =>
                          setCustomers((cs) => {
                            const c = [...cs];
                            c[i].issuing_country = e.target.value;
                            return c;
                          })
                        }
                      >
                        {countryList.map((c) => (
                          <MenuItem key={c.code} value={c.label}>
                            {c.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Leading passenger contact info */}
                {cust.is_leading && (
                  <Box mt={3}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Contact Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          label="Email"
                          value={cust.email || ""}
                          onChange={(e) =>
                            setCustomers((cs) => {
                              const c = [...cs];
                              c[i].email = e.target.value;
                              return c;
                            })
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Address"
                          value={cust.address || ""}
                          onChange={(e) =>
                            setCustomers((cs) => {
                              const c = [...cs];
                              c[i].address = e.target.value;
                              return c;
                            })
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          label="Phone Code"
                          value={cust.phoneCode || ""}
                          onChange={(e) =>
                            setCustomers((cs) => {
                              const c = [...cs];
                              c[i].phoneCode = e.target.value;
                              return c;
                            })
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={2}>
                        <TextField
                          label="Phone"
                          value={cust.phone || ""}
                          onChange={(e) =>
                            setCustomers((cs) => {
                              const c = [...cs];
                              c[i].phone = e.target.value;
                              return c;
                            })
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Alternate Phone"
                          value={cust.alternate_phone || ""}
                          onChange={(e) =>
                            setCustomers((cs) => {
                              const c = [...cs];
                              c[i].alternate_phone = e.target.value;
                              return c;
                            })
                          }
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
        <Button onClick={validateAndSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </>
  );
};




// ---------- Step 2 Form (Flights) ----------
type FieldError = {
  [field: string]:
    | string
    | { [idx: number]: { cost?: string; internal_cost?: string } }
    | undefined;
  costs?: { [idx: number]: { cost?: string; internal_cost?: string } };
};
type Step2Props = {
  data: FlightEntryExtended[];
  // data: FlightEntry[];
  customers: Customer[]; 
  // onSave: (arr: FlightEntry[]) => Promise<void>;
  onSave: (arr: FlightEntryExtended[]) => Promise<void>;
  onCancel: () => void;
};
const Step2Form: React.FC<Step2Props> = ({
  data,
  customers,
  onSave,
  onCancel,
}) => {
  // initialize each entry from API + defaults
  const [loading, setLoading] = useState(false);  // ← 2) loading flag

  interface EntryErrors {
    pnr?: string;
    itinerary?: string;
    remarks?: string;
    issuedFare?: string;
    globalCostData?: {
      cost?: string;
      internal_cost?: string;
    };
    costs?: {
      [passengerIndex: number]: {
        cost?: string;
        internal_cost?: string;
      };
    };
  }
  // const [fieldErrors, setFieldErrors] = useState<EntryErrors[]>(() =>
  //   data.map(() => ({}))
  // );  
  const [entries, setEntries] = useState<FlightEntryExtended[]>(
    () =>
      data.map((d) => {
        // grab whatever came back from the server
        const costsData: any[] = (d as any).flight_booking_costs ?? [];
  
        // defaults: global cost of zero
        let issuedFare = 0;
        let globalCost = true;
        let globalCostData = { cost: 0, internal_cost: 0 };
        // for per-passenger default, seed an array so UI always shows one line per customer
        let costs = customers.map((c) => ({
          customer_id: c.id,
          cost: 0,
          internal_cost: 0,
        }));
  
        if (costsData.length) {
          // all cost records share the same issued_fare
          issuedFare = parseFloat(costsData[0].issued_fare);
          if (costsData[0].costable_type === "global") {
            // global‐mode
            globalCost = true;
            globalCostData = {
              cost: parseFloat(costsData[0].cost),
              internal_cost: parseFloat(costsData[0].internal_cost),
            };
          } else {
            // per‐customer mode
            globalCost = false;
            costs = costsData.map((c) => ({
              customer_id: c.costable_id,
              cost: parseFloat(c.cost),
              internal_cost: parseFloat(c.internal_cost),
            }));
          }
        }
  
        return {
          id: d.id,
          pnr: d.pnr,
          itinerary: d.itinerary,
          remarks: d.remarks,
          atol: d.atol,
          issuedFare,
          globalCost,
          globalCostData,
          costs,
        };
      })
  );
  // 2) one FieldError object per entry
  const [fieldErrors, setFieldErrors] = useState<EntryErrors[]>(() =>
    entries.map(() => ({costs: {}}))
  );
  // 3) refs so we can focus the first errored field
  const inputRefs = useRef<Array<Record<string, HTMLInputElement | null>>>(
    entries.map(() => ({}))
  );
  // 4) loading flag
  

  // whenever you add/remove entries: reset errors & refs
  useEffect(() => {
    setFieldErrors(entries.map(() => ({})));
    inputRefs.current = entries.map(() => ({}));
  }, [entries.length]);
  // if you ever add/remove entries, reset errors & refs
  
  const updateEntry = (
    idx: number,
    changes: Partial<FlightEntryExtended>
  ) =>
    setEntries((e) =>
      e.map((ent, i) => (i === idx ? { ...ent, ...changes } : ent))
    );

  const removeEntry = (idx: number) =>
    setEntries((e) => e.filter((_, i) => i !== idx));

  const addEntry = () =>
    setEntries((e) => [
      ...e,
      {
        pnr: "",
        itinerary: "",
        remarks: "",
        atol: false,
        issuedFare: 0,
        globalCost: true,
        globalCostData: {
          cost: Number(e[0]?.flight_booking_costs?.[0]?.cost) || 0,
          internal_cost:
            Number(e[0]?.flight_booking_costs?.[0]?.internal_cost) || 0,
        },
        costs: customers.map((c) => ({
          customer_id: c.id,
          cost: 0,
          internal_cost: 0,
        })),
      },
    ]);
    const [saving, setSaving] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const newFieldErrors: Record<string, { costs?: { 0: { cost: string } } | undefined; }>[] = entries.map(() => ({}));

    const handleSave = async () => {
      setFieldErrors(entries.map(() => ({})));
      setGlobalError(null);
      setSaving(true);
  
      try {
        await onSave(entries);
      } catch (err: any) {
        // Laravel 422
        if (err.response?.status === 422 && err.response.data.errors) {
          const errs: Record<string, string[]> = err.response.data.errors;
          const newFieldErrors: Record<string, { costs?: { [key: number]: { cost?: string } } | undefined; }>[] = entries.map(() => ({}));
          let firstRef: HTMLInputElement | null = null;
  
          Object.entries(errs).forEach(([fullKey, msgs]) => {
            // fullKey might come in as "0.issuedFare" or just "issuedFare"
            let idx = 0;
            let field = fullKey;
  
            if (fullKey.includes(".")) {
              const [iStr, f] = fullKey.split(".");
              if (!isNaN(+iStr)) {
                idx = +iStr;
                field = f;
              }
            }
  
            
            if (field === "costs") {
              // now newFieldErrors[idx].costs is always defined
              (newFieldErrors[idx].costs as { [key: number]: { cost: string } })[0] = { cost: msgs[0] };

            } else {
              (newFieldErrors[idx] as any)[field] = msgs[0];
            }
  
            // grab the ref for the very first error
            if (!firstRef && inputRefs.current[idx]?.[field]) {
              firstRef = inputRefs.current[idx]![field];
            }
          });
  
          setFieldErrors(newFieldErrors as Record<string, { costs?: { [key: number]: { cost?: string } } | undefined; }>[]); 
          // focus the first errored input
          if (firstRef) (firstRef as HTMLInputElement).focus();
        } else {
          setGlobalError(err.message || "Something went wrong");
        }
      } finally {
        setSaving(false);
      }
    };
  return (
    <>
      <DialogContent dividers>
      {globalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {globalError}
          </Alert>
        )}
        {entries.map((f, i) => (
          <Box
            key={i}
            sx={{
              mb: 3,
              p: 2,
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              position: "relative",
            }}
          >
            <IconButton
              size="small"
              sx={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => removeEntry(i)}
            >
              <DeleteIcon />
            </IconButton>

            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={3}>
                
                <TextField
                  label="PNR"
                  value={f.pnr}
                  onChange={(e) => updateEntry(i, { pnr: e.target.value })}
                  error={!!fieldErrors[i].pnr}
                  helperText={typeof fieldErrors[i].pnr === "string" ? fieldErrors[i].pnr : undefined}
                  inputRef={(el) =>
                    (inputRefs.current[i].pnr = el)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Itinerary"
                  value={f.itinerary}
                  onChange={(e) =>
                    updateEntry(i, { itinerary: e.target.value })
                  }
                  error={!!fieldErrors[i].itinerary}
                  helperText={typeof fieldErrors[i].itinerary === "string" ? fieldErrors[i].itinerary : undefined}
                  inputRef={(el) =>
                    (inputRefs.current[i].itinerary = el)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Remarks"
                  value={f.remarks}
                  onChange={(e) =>
                    updateEntry(i, { remarks: e.target.value })
                  }
                  error={!!fieldErrors[i].remarks}
                  helperText={typeof fieldErrors[i].remarks === "string" ? fieldErrors[i].remarks : undefined}
                  inputRef={(el) =>
                    (inputRefs.current[i].remarks = el)
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={f.atol}
                      onChange={(e) =>
                        updateEntry(i, { atol: e.target.checked })
                      }
                    />
                  }
                  label="ATOL"
                />
              </Grid>

              <Grid item xs={4}>
                <TextField
                  label="Issued Fare"
                  type="number"
                  value={f.issuedFare}
                  onChange={(e) =>
                    updateEntry(i, { issuedFare: +e.target.value })
                  }
                  error={!!fieldErrors[i].issuedFare}
                  helperText={typeof fieldErrors[i].issuedFare === 'string' ? fieldErrors[i].issuedFare : undefined}
                  inputRef={(el) =>
                    (inputRefs.current[i].issuedFare = el)
                  }

                  fullWidth
                />
              </Grid>
              <Grid item xs={8}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={f.globalCost}
                      onChange={(e) =>
                        updateEntry(i, { globalCost: e.target.checked })
                      }
                    />
                  }
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
                    value={f.globalCostData.cost}
                    onChange={(e) =>
                      updateEntry(i, {
                        globalCostData: {
                          ...f.globalCostData,
                          cost: +e.target.value,
                        },
                      })
                    }
                    error={!!(fieldErrors[i].globalCostData as { cost?: string })?.cost}
                    helperText={(fieldErrors[i].globalCostData as { cost?: string })?.cost}
                    inputRef={(el) =>
                      (inputRefs.current[i].globalCostData_cost = el)
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Global Internal Cost"
                    type="number"
                    value={f.globalCostData.internal_cost}
                    onChange={(e) =>
                      updateEntry(i, {
                        globalCostData: {
                          ...f.globalCostData,
                          internal_cost: +e.target.value,
                        },
                      })
                    }
                    error={!!(fieldErrors[i].globalCostData as { internal_cost?: string })?.internal_cost}
                    helperText={(fieldErrors[i].globalCostData as { internal_cost?: string })?.internal_cost}
                    inputRef={(el) =>
                      (inputRefs.current[i].globalCostData_internal_cost = el)
                    }
                    fullWidth
                  />
                </Grid>
              </Grid>
            ) : (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Per-Passenger Costs
                </Typography>
                {f.costs.map((c, ci) => {
                  const cust = customers.find((x) => x.id === c.customer_id);
                  return (
                    <Grid
                      container
                      spacing={2}
                      alignItems="center"
                      key={c.customer_id}
                      sx={{ mb: 1 }}
                    >
                      <Grid item xs={4}>
                        <Typography>{cust?.name}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Cost"
                          type="number"
                          value={c.cost}
                          onChange={(e) =>
                            updateEntry(i, {
                              costs: f.costs.map((cc, k) =>
                                k === ci
                                  ? { ...cc, cost: +e.target.value }
                                  : cc
                              ),
                            })
                          }
                          error={!!fieldErrors[i].costs?.[ci]?.cost}
                          helperText={fieldErrors[i].costs?.[ci]?.cost}
                          inputRef={(el) =>
                            (inputRefs.current && inputRefs.current[i] && (inputRefs.current[i][`costs_${ci}_cost`] = el))
                          }
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Internal Cost"
                          type="number"
                          value={c.internal_cost}
                          onChange={(e) =>
                            updateEntry(i, {
                              costs: f.costs.map((cc, k) =>
                                k === ci
                                  ? {
                                      ...cc,
                                      internal_cost: +e.target.value,
                                    }
                                  : cc
                              ),
                            })
                          }
                          error={!!fieldErrors[i].costs?.[ci]?.internal_cost}
                          helperText={fieldErrors[i].costs?.[ci]?.internal_cost}
                          inputRef={(el) =>{
                            if (inputRefs.current[i]) {
                              inputRefs.current[i][`costs_${ci}_internal`] = el;
                            }
                          }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  );
                })}
              </Box>
            )}
          </Box>
        ))}

        <Button onClick={addEntry} sx={{ mt: 1 }}>
          Add Flight Booking
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        
        <LoadingButton 
           variant="contained"
           loading={loading}                  // ← show spinner when true
           onClick={async () => {            // ← wrap your onSave
             setLoading(true);
             try {
               await onSave(entries);
             } finally {
               setLoading(false);
             }
           }}
         >
           Save
         </LoadingButton>
      </DialogActions>
    </>
  );
};

// ---------- Step 3 Form (Hotels) ----------
type Step3Props = {
  data: HotelEntry[];
  suppliers: Supplier[];
  onSave: (arr: HotelEntry[]) => Promise<void>;
  onCancel: () => void;
};
const Step3Form: React.FC<Step3Props> = ({ data, suppliers, onSave, onCancel }) => {
  const [entries, setEntries] = useState<HotelEntry[]>([...data]);
  const add = () =>
    setEntries((e) => [
      ...e,
      {
        hotel_name: "",
        hotel_address: "",
        meal_type: "",
        room_allocation: 1,
        room_type: "",
        room_view: "",
        remarks: "",
        check_in_date: getTomorrow(),
        check_in_time: "12:00",
        check_out_date: getTomorrow(),
        nights: 1,
        cost: 0,
        internal_cost: 0,
        supplier_id: undefined,
      },
    ]);
  const del = (i: number) =>
    setEntries((e) => e.filter((_, idx) => idx !== i));

  return (
    <>
      <DialogContent dividers>
        {entries.map((h, i) => (
          <Box key={i} sx={{ mb: 2, borderBottom: "1px solid #eee", pb: 2 }}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={4}>
                <TextField
                  label="Hotel Name"
                  value={h.hotel_name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
                      const c = [...en];
                      c[i].meal_type = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton onClick={() => del(i)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="flex-end" sx={{ mt: 1 }}>
              <Grid item xs={2}>
                <TextField
                  label="Rooms"
                  type="number"
                  value={h.room_allocation}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setEntries((en) => {
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
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

            <Grid container spacing={2} alignItems="flex-end" sx={{ mt: 1 }}>
              <Grid item xs={2}>
                <TextField
                  label="Nights"
                  type="number"
                  value={h.nights}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setEntries((en) => {
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
                  value={h.cost}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setEntries((en) => {
                      const c = [...en];
                      c[i].cost = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Internal Cost"
                  type="number"
                  value={h.internal_cost}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setEntries((en) => {
                      const c = [...en];
                      c[i].internal_cost = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
                  value={suppliers.find((s) => s.id === h.supplier_id) || null}
                  onChange={(_, sel) =>
                    setEntries((en) => {
                      const c = [...en];
                      c[i].supplier_id = sel?.id;
                      return c;
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Supplier" />
                  )}
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="Remarks"
              value={h.remarks}
              onChange={(e) => {
                const v = e.target.value;
                setEntries((en) => {
                  const c = [...en];
                  c[i].remarks = v;
                  return c;
                });
              }}
              fullWidth
              sx={{ mt: 1 }}
            />
          </Box>
        ))}
        <Button onClick={add}>Add Hotel</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(entries)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};

// ---------- Step 4 Form (Visa) ----------
type Step4Props = {
  data: VisaEntry[];
  suppliers: Supplier[];
  onSave: (arr: VisaEntry[]) => Promise<void>;
  onCancel: () => void;
};
const Step4Form: React.FC<Step4Props> = ({ data, suppliers, onSave, onCancel }) => {
  const [entries, setEntries] = useState<VisaEntry[]>([...data]);
  const add = () =>
    setEntries((e) => [
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
  const del = (i: number) =>
    setEntries((e) => e.filter((_, idx) => idx !== i));

  return (
    <>
      <DialogContent dividers>
        {entries.map((v, i) => (
          <Grid
            container
            spacing={2}
            key={i}
            alignItems="flex-end"
            sx={{ mb: 1 }}
          >
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Visa Type</InputLabel>
                <Select
                  value={v.visa_type}
                  label="Visa Type"
                  onChange={(e) => {
                    const val = e.target.value;
                    setEntries((en) => {
                      const c = [...en];
                      c[i].visa_type = val;
                      return c;
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
                onChange={(e) => {
                  const val = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].previous_nationality = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Airline"
                value={v.airline_code}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].airline_code = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Flight"
                value={v.flight_code}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].flight_code = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => del(i)}>
                <DeleteIcon />
              </IconButton>
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Visa Status"
                value={v.visa_status}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].visa_status = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                label="Remarks"
                value={v.remarks}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].remarks = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={2}>
              <TextField
                label="Cost"
                type="number"
                value={v.cost}
                onChange={(e) => {
                  const val = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].cost = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={2}>
              <TextField
                label="Internal Cost"
                type="number"
                value={v.internal_cost}
                onChange={(e) => {
                  const val = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].internal_cost = val;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={4}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
                value={suppliers.find((s) => s.id === v.supplier_id) || null}
                onChange={(_, sel) =>
                  setEntries((en) => {
                    const c = [...en];
                    c[i].supplier_id = sel?.id;
                    return c;
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" />
                )}
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Button onClick={add}>Add Visa</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(entries)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};

// ---------- Step 5 Form (Transport) ----------
type Step5Props = {
  data: TransportEntry[];
  suppliers: Supplier[];
  onSave: (arr: TransportEntry[]) => Promise<void>;
  onCancel: () => void;
};
const Step5Form: React.FC<Step5Props> = ({ data, suppliers, onSave, onCancel }) => {
  const [entries, setEntries] = useState<TransportEntry[]>([...data]);
  const add = () =>
    setEntries((e) => [
      ...e,
      {
        vehicle_type: "",
        pickup_from: "",
        pickup_time: "",
        dropoff: "",
        cost: 0,
        internal_cost: 0,
        supplier_id: undefined,
      },
    ]);
  const del = (i: number) =>
    setEntries((e) => e.filter((_, idx) => idx !== i));

  return (
    <>
      <DialogContent dividers>
        {entries.map((t, i) => (
          <Grid
            container
            spacing={2}
            key={i}
            alignItems="flex-end"
            sx={{ mb: 1 }}
          >
            <Grid item xs={3}>
              <TextField
                label="Vehicle"
                value={t.vehicle_type}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].vehicle_type = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Pickup"
                value={t.pickup_from}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].pickup_from = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Time"
                type="time"
                value={t.pickup_time}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].pickup_time = v;
                    return c;
                  });
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Dropoff"
                value={t.dropoff}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].dropoff = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => del(i)}>
                <DeleteIcon />
              </IconButton>
            </Grid>

            <Grid item xs={2}>
              <TextField
                label="Cost"
                type="number"
                value={t.cost}
                onChange={(e) => {
                  const v = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].cost = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={2}>
              <TextField
                label="Internal Cost"
                type="number"
                value={t.internal_cost}
                onChange={(e) => {
                  const v = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].internal_cost = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={4}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
                value={suppliers.find((s) => s.id === t.supplier_id) || null}
                onChange={(_, sel) =>
                  setEntries((en) => {
                    const c = [...en];
                    c[i].supplier_id = sel?.id;
                    return c;
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" />
                )}
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Button onClick={add}>Add Transport</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(entries)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};

// ---------- Step 6 Form (Activities) ----------
type Step6Props = {
  data: ActivityEntry[];
  suppliers: Supplier[];
  onSave: (arr: ActivityEntry[]) => Promise<void>;
  onCancel: () => void;
};
const Step6Form: React.FC<Step6Props> = ({
  data,
  suppliers,
  onSave,
  onCancel,
}) => {
  const [entries, setEntries] = useState<ActivityEntry[]>([...data]);
  const add = () =>
    setEntries((e) => [
      ...e,
      {
        activity_name: "",
        pickup_location: "",
        datetime: "",
        guide: "No",
        guideCost: 0,
        cost: 0,
        internal_cost: 0,
        supplier_id: undefined,
      },
    ]);
  const del = (i: number) =>
    setEntries((e) => e.filter((_, idx) => idx !== i));

  return (
    <>
      <DialogContent dividers>
        {entries.map((a, i) => (
          <Grid
            container
            spacing={2}
            key={i}
            alignItems="flex-end"
            sx={{ mb: 1 }}
          >
            <Grid item xs={3}>
              <TextField
                label="Activity"
                value={a.activity_name}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].activity_name = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Pickup Loc"
                value={a.pickup_location}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].pickup_location = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                label="Date & Time"
                type="datetime-local"
                value={a.datetime}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].datetime = v;
                    return c;
                  });
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => del(i)}>
                <DeleteIcon />
              </IconButton>
            </Grid>

            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Guide</InputLabel>
                <Select
                  value={a.guide}
                  label="Guide"
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntries((en) => {
                      const c = [...en];
                      c[i].guide = v;
                      return c;
                    });
                  }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {a.guide === "Yes" && (
              <Grid item xs={3}>
                <TextField
                  label="Guide Cost"
                  type="number"
                  value={a.guideCost}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setEntries((en) => {
                      const c = [...en];
                      c[i].guideCost = v;
                      return c;
                    });
                  }}
                  fullWidth
                />
              </Grid>
            )}

            <Grid item xs={2}>
              <TextField
                label="Cost"
                type="number"
                value={a.cost}
                onChange={(e) => {
                  const v = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].cost = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={2}>
              <TextField
                label="Internal Cost"
                type="number"
                value={a.internal_cost}
                onChange={(e) => {
                  const v = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].internal_cost = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>

            <Grid item xs={4}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
                value={suppliers.find((s) => s.id === a.supplier_id) || null}
                onChange={(_, sel) =>
                  setEntries((en) => {
                    const c = [...en];
                    c[i].supplier_id = sel?.id;
                    return c;
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Supplier" />
                )}
                fullWidth
              />
            </Grid>
          </Grid>
        ))}
        <Button onClick={add}>Add Activity</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(entries)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};

// ---------- Step 7 Form (Payments) ----------
type Step7Props = {
  data: PaymentEntry[];
  maxTotal: number;
  onSave: (arr: PaymentEntry[]) => Promise<void>;
  onCancel: () => void;
};
const Step7Form: React.FC<Step7Props> = ({
  data,
  maxTotal,
  onSave,
  onCancel,
}) => {
  const [entries, setEntries] = useState<PaymentEntry[]>([...data]);
  const [error, setError] = useState<string | null>(null);

  const add = () =>
    setEntries((e) => [
      ...e,
      { amount: 0, payment_date: "", payment_method: "" },
    ]);
  const del = (i: number) =>
    setEntries((e) => e.filter((_, idx) => idx !== i));

  const total = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const trySave = async () => {
    if (total > maxTotal) {
      setError(`Total payments (${total}) exceed selling cost (${maxTotal}).`);
      return;
    }
    await onSave(entries);
  };

  return (
    <>
      <DialogContent dividers>
        {entries.map((p, i) => (
          <Grid
            container
            spacing={2}
            key={i}
            alignItems="flex-end"
            sx={{ mb: 1 }}
          >
            <Grid item xs={3}>
              <TextField
                label="Amount"
                type="number"
                value={p.amount}
                onChange={(e) => {
                  const v = +e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].amount = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Payment Date"
                type="datetime-local"
                value={p.payment_date}
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].payment_date = v;
                    return c;
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
                onChange={(e) => {
                  const v = e.target.value;
                  setEntries((en) => {
                    const c = [...en];
                    c[i].payment_method = v;
                    return c;
                  });
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton onClick={() => del(i)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button onClick={add}>Add Payment</Button>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={trySave}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};

// ---------- BookingViewPage ----------
export default function BookingViewPage() {
  const { bookingNumber } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openStep, setOpenStep] = useState<number | null>(null);

  const stepLabels = [
    "Details & Customers",
    "Flights",
    "Hotels",
    "Visa",
    "Transport",
    "Activities",
    "Payments",
  ];

  // fetch booking & suppliers
  useEffect(() => {
    if (bookingNumber) {
      api.get<BookingDetails>(`/api/bookings/${bookingNumber}`)
        //  .then((r) => setBooking(r.data))
        .then((r) => {
          console.log("🚀 booking payload:", r.data);
          setBooking(r.data);
        })
         .catch(() => router.replace("/404"));
    }
    api.get("/api/suppliers")
       .then((res) => {
         const p = res.data;
         const list = Array.isArray(p)
           ? p
           : Array.isArray((p as any).data)
             ? (p as any).data
             : Array.isArray((p as any).suppliers)
               ? (p as any).suppliers
               : [];
         setSuppliers(list);
       })
       .catch(console.error);
  }, [bookingNumber, router]);

  if (!booking)
    return <Typography sx={{ p: 2 }}>Loading booking…</Typography>;
  // compute which steps are visible
  const isFlight = booking.booking_type === "flight";
  const allowedSteps = isFlight
    ? [0, 1, 6]                // Details & Customers, Flights, Payments
    : [0, 1, 2, 3, 4, 5, 6];   // all steps
  const close = () => setOpenStep(null);

  const handleStepSave = async (step: number, data: any) => {
    // Step 0
    if (step === 0) {
      // await api.patch(`/api/bookings/${booking.id}`, data);
      await api.patch(`/api/bookings/${booking.id}`, {
        booking_date: booking.booking_date,  // ← include booking_date here
        ...data
      });
      setBooking((b) => (b ? { ...b, ...data } : b));
    }
    // Flight bookings

    // Inside your BookingViewPage.handleStepSave:
if (step === 1) {
  // 0) figure out which ones were deleted:
  const sentIds = (data as FlightEntry[]).map((f) => f.id).filter(Boolean) as number[];
  for (const old of booking.flight_bookings) {
    if (old.id && !sentIds.includes(old.id)) {
      await api.delete(`/api/flight-bookings/${old.id}`);
    }
  }

  // 1) Update existing or create new
  for (const f of data as FlightEntry[]) {
    const payload = {
      booking_id: booking.id,
      pnr: f.pnr,
      itinerary: f.itinerary,
      remarks: f.remarks,
      atol: f.atol,
      issuedFare: f.issuedFare,
      globalCost: f.globalCost,
      globalCostData: f.globalCostData,
      costs: f.costs,
    };

    if (f.id) {
      // existing → PATCH
      await api.patch(`/api/flight-bookings/${f.id}`, payload);
    } else {
      // new → POST
      await api.post("/api/flight-bookings", payload);
    }
  }

  // // 2) Refresh local state
  setBooking((b) =>
    b
      ? {
          ...b,
          flight_bookings: data as FlightEntry[],
        }
      : b
  );
}


    // Hotel bookings
    if (step === 2) {
      for (const h of booking.hotel_bookings)
        if (h.id) await api.delete(`/api/hotel-bookings/${h.id}`);
      for (const h of data as HotelEntry[])
        await api.post("/api/hotel-bookings", { booking_id: booking.id, ...h });
      setBooking((b) => (b ? { ...b, hotel_bookings: data } : b));
    }
    // Visa bookings
    if (step === 3) {
      for (const v of booking.visa_bookings)
        if (v.id) await api.delete(`/api/visa-bookings/${v.id}`);
      for (const v of data as VisaEntry[])
        await api.post("/api/visa-bookings", { booking_id: booking.id, ...v });
      setBooking((b) => (b ? { ...b, visa_bookings: data } : b));
    }
    // Transport bookings
    if (step === 4) {
      for (const t of booking.transport_bookings)
        if (t.id) await api.delete(`/api/transport-bookings/${t.id}`);
      for (const t of data as TransportEntry[])
        await api.post("/api/transport-bookings", { booking_id: booking.id, ...t });
      setBooking((b) => (b ? { ...b, transport_bookings: data } : b));
    }
    // Activity bookings
    if (step === 5) {
      for (const a of booking.activities_bookings)
        if (a.id) await api.delete(`/api/activity-bookings/${a.id}`);
      for (const a of data as ActivityEntry[])
        await api.post("/api/activity-bookings", { booking_id: booking.id, ...a });
      setBooking((b) => (b ? { ...b, activities_bookings: data } : b));
    }
    // Payments
    // ---------- Step 6: Payments ----------
  if (step === 6) {
    // 1. PATCH any edited payments
    for (const p of data as PaymentEntry[]) {
      if (p.id) {
        await api.patch(`/api/booking-payments/${p.id}`, p);
      }
    }
    // 2. POST any newly added payments
    for (const p of data as PaymentEntry[]) {
      if (!p.id) {
        await api.post("/api/booking-payments", {
          booking_id: booking.id,
          ...p,
        });
      }
    }
    // 3. DELETE any payments the user removed
    const keptIds = (data as PaymentEntry[])
      .map((p) => p.id)
      .filter((id): id is number => id !== undefined);

    for (const old of booking.payments) {
      if (old.id && !keptIds.includes(old.id)) {
        await api.delete(`/api/booking-payments/${old.id}`);
      }
    }

    // Finally, update local state
    setBooking((b) => (b ? { ...b, payments: data } : b));
  }

    close();
  };

  return (
    <Box sx={{ p: 2 }}>
      {stepLabels.map((label, idx) => (
        allowedSteps.includes(idx) && (
          <Accordion key={idx} defaultExpanded sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{label}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {idx === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography><strong>Booking #:</strong> {booking.booking_number}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Date:</strong> {booking.booking_date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Departure:</strong> {booking.departure_date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Return:</strong> {booking.return_date}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Cost:</strong> {booking.selling_cost}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Status:</strong> {booking.status}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Passengers:</strong> {booking.customers.length}</Typography>
                  </Grid>
                </Grid>
              )}
              {idx === 1 && booking.flight_bookings.map((f, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography>PNR: {f.pnr}</Typography>
                  <Typography>Itin: {f.itinerary}</Typography>
                  <Typography>ATOL: {f.atol ? "Yes" : "No"}</Typography>
                  <Typography>Rem: {f.remarks}</Typography>
                </Box>
              ))}
              {idx === 2 && booking.hotel_bookings.map((h, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography>Hotel: {h.hotel_name}</Typography>
                  <Typography>Addr: {h.hotel_address}</Typography>
                  <Typography>Meal: {h.meal_type}</Typography>
                  <Typography>Rooms: {h.room_allocation}×{h.room_type} ({h.room_view})</Typography>
                  <Typography>{h.check_in_date}→{h.check_out_date} ({h.nights} nights)</Typography>
                  <Typography>Cost: {h.cost} | Int: {h.internal_cost}</Typography>
                  <Typography>Supp: {suppliers.find(s => s.id === h.supplier_id)?.name || "—"}</Typography>
                </Box>
              ))}
              {idx === 3 && booking.visa_bookings.map((v, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography>Type: {v.visa_type}</Typography>
                  <Typography>Status: {v.visa_status}</Typography>
                  <Typography>Air/Flight: {v.airline_code}/{v.flight_code}</Typography>
                  <Typography>Cost: {v.cost} | Int: {v.internal_cost}</Typography>
                  <Typography>Rem: {v.remarks}</Typography>
                  <Typography>Supp: {suppliers.find(s => s.id === v.supplier_id)?.name || "—"}</Typography>
                </Box>
              ))}
              {idx === 4 && booking.transport_bookings.map((t, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography>Veh: {t.vehicle_type}</Typography>
                  <Typography>Pickup: {t.pickup_from}@{t.pickup_time}</Typography>
                  <Typography>Drop: {t.dropoff}</Typography>
                  <Typography>Cost: {t.cost} | Int: {t.internal_cost}</Typography>
                  <Typography>Supp: {suppliers.find(s => s.id === t.supplier_id)?.name || "—"}</Typography>
                </Box>
              ))}
              {idx === 5 && booking.activities_bookings.map((a, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography>Act: {a.activity_name}</Typography>
                  <Typography>Pickup: {a.pickup_location}</Typography>
                  <Typography>Date: {a.datetime}</Typography>
                  <Typography>Guide: {a.guide}{a.guide==="Yes" && ` (Cost:${a.guideCost})`}</Typography>
                  <Typography>Cost: {a.cost} | Int: {a.internal_cost}</Typography>
                  <Typography>Supp: {suppliers.find(s=>s.id===a.supplier_id)?.name||"—"}</Typography>
                </Box>
              ))}
              {idx === 6 && booking.payments.map((p, i) => (
                <Box key={i} sx={{ mb: 1 }}>
                  <Typography>Amt: {p.amount}</Typography>
                  <Typography>Date: {p.payment_date}</Typography>
                  <Typography>Method: {p.payment_method}</Typography>
                </Box>
              ))}

              <Box textAlign="right" mt={1}>
                <Button
                  startIcon={<EditIcon />}
                  variant="contained"
                  size="small"
                  onClick={() => setOpenStep(idx)}
                >
                  Edit
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      ))}

      {/* Global Edit Dialog */}
     
      <Dialog fullWidth maxWidth="md" open={openStep !== null} onClose={close}>
        <DialogTitle>Edit — {openStep !== null && stepLabels[openStep]}</DialogTitle>
        {allowedSteps.includes(0) && openStep === 0 && (
          <Step1Form data={booking} onSave={d => handleStepSave(0,d)} onCancel={close}/>
        )}
        {allowedSteps.includes(0) && openStep === 1 && (
          <Step2Form data={booking.flight_bookings} customers={booking.customers} onSave={arr=>handleStepSave(1,arr)} onCancel={close}/>
        )}
        {allowedSteps.includes(0) && openStep === 2 && (
          <Step3Form data={booking.hotel_bookings} suppliers={suppliers} onSave={arr=>handleStepSave(2,arr)} onCancel={close}/>
        )}
        {allowedSteps.includes(0) && openStep === 3 && (
          <Step4Form data={booking.visa_bookings} suppliers={suppliers} onSave={arr=>handleStepSave(3,arr)} onCancel={close}/>
        )}
        {allowedSteps.includes(0) && openStep === 4 && (
          <Step5Form data={booking.transport_bookings} suppliers={suppliers} onSave={arr=>handleStepSave(4,arr)} onCancel={close}/>
        )}
        {allowedSteps.includes(0) && openStep === 5 && (
          <Step6Form data={booking.activities_bookings} suppliers={suppliers} onSave={arr=>handleStepSave(5,arr)} onCancel={close}/>
        )}
        {allowedSteps.includes(0) && openStep === 6 && (
          <Step7Form data={booking.payments} maxTotal={booking.selling_cost} onSave={arr=>handleStepSave(6,arr)} onCancel={close}/>
        )}

      </Dialog>
  </Box>
  );
}

