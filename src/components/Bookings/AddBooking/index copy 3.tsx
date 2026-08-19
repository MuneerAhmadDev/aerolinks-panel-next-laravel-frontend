"use client";

import React, { useState, useEffect } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  Box,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Select,
  Alert,
  AlertTitle,
  IconButton,
  Link,
  Autocomplete,
  InputAdornment,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import api from "@/api/api";

// ---------- Sample Static Data ----------
const countryList = [
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "PK", label: "Pakistan" },
  { code: "CA", label: "Canada" },
];
const phoneCodes = [
  { code: "+44", label: "UK (+44)" },
  { code: "+1", label: "US (+1)" },
  { code: "+92", label: "Pakistan (+92)" },
];

// ---------- Helper Functions ----------
const getToday = () => new Date().toISOString().split("T")[0];
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};
const addMonths = (dateStr: string, months: number) => {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
};

// ---------- Custom Stepper Connector ----------
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    backgroundColor: theme.palette.primary.main,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    backgroundColor: theme.palette.primary.main,
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 1,
  },
}));

// ---------- Steps Array ----------
const flightSteps = ["Booking Details & Customers", "Flights", "Review & Submit"];
const otherSteps = [
  "Booking Details & Customers",
  "Flights",
  "Hotels",
  "Visa",
  "Transport",
  "Activities",
  "Review & Submit",
];

// ---------- Interfaces ----------

// Customer comes from API.
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
  alternatePhone?: string;
}

// For flights – each entry can apply cost globally or per selected customer.
interface FlightEntry {
  pnr: string;
  itinerary: string;
  customerIndices: number[];
  issuedFare: number;
  remarks: string;
  atol: boolean;
  globalCost: boolean;
  globalCostData?: { sellingCost: number; cost: number; internalCost: number };
  costs: { [customerIndex: number]: { sellingCost: number; cost: number; internalCost: number } };
}
type FlightDataGlobal = FlightEntry[];

// For hotels, we now allow selecting customers (similar to flights).
interface HotelEntry {
  hotelName: string;
  hotelAddress: string;
  mealType: string;
  roomAllocation: number;
  roomType: string;
  roomView: string;
  roomViewOther?: string;
  remarks: string;
  checkinDate: string;
  checkinTime: string;
  checkoutDate: string;
  nights: number;
  customerIndices: number[];
  globalCost: boolean;
  globalCostData?: { sellingCost: number; cost: number; internalCost: number };
  costs: { [customerIndex: number]: { sellingCost: number; cost: number; internalCost: number } };
  supplier_id?: number;
  sellingCost?: number; // Added property
  cost?: number;
  internalCost?: number;
}
type HotelData = HotelEntry[];

// For visas, same idea – allow selecting one or more customers.
interface VisaEntry {
  customerIndices: number[];
  globalCost: boolean;
  globalCostData?: { sellingCost: number; cost: number; internalCost: number };
  costs: { [customerIndex: number]: { sellingCost: number; cost: number; internalCost: number } };
  visa_type: string;
  previous_nationality?: string;
  validity?: string;
  airlineCode: string;
  flightCode: string;
  visaStatus: string;
  remarks: string;
  supplier: { id: number; name: string; email: string } | null;
}
type VisaData = VisaEntry[];

// Transport and Activities remain unchanged.
interface TransportData {
  required: boolean;
  vehicleType: string;
  pickupFrom: string;
  pickupTime: string;
  dropoff: string;
  sellingCost: number;
  cost: number;
  internalCost: number;
  supplier_id?: number;
}
interface ActivitiesData {
  required: boolean;
  activity_name: string;
  datetime: string;
  guide: string;
  guideCost?: number;
  sellingCost: number;
  cost: number;
  internalCost: number;
  supplier_id?: number;
}

interface Supplier {
  id: number;
  name: string;
  email: string;
}

// ---------- Main Component ----------
const AddBooking: React.FC = () => {
  // Step state
  const [step, setStep] = useState<number>(1);

  // Booking details
  const [bookingDate] = useState<string>(getToday());
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>(""); // Required for all bookings
  const [status, setStatus] = useState<string>("pending");
  const [bookingType, setBookingType] = useState<string>("Flight"); // Flight, Umrah, Holiday

  // Customers for this booking (manually added or selected)
  const [customers, setCustomers] = useState<Customer[]>([]);
  // Existing customers fetched from API (should be an array)
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);

  // Suppliers fetched from API
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Flights
  const [globalFlights, setGlobalFlights] = useState<FlightDataGlobal>([]);

  // Hotels – allow multiple hotel entries with customer selection (like flights)
  const [hotelEntries, setHotelEntries] = useState<HotelData>([]);

  // Visas – allow multiple visa entries with customer selection
  const [visas, setVisas] = useState<VisaData>([]);

  // Transport & Activities
  const [transport, setTransport] = useState<TransportData | null>(null);
  const [activities, setActivities] = useState<ActivitiesData | null>(null);

  // Field-level errors and global errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFlightOnly = bookingType === "Flight";
  const stepsToShow = isFlightOnly ? flightSteps : otherSteps;

  // ---------- Fetch Existing Customers and Suppliers from API ----------
  useEffect(() => {
    // Fetch existing customers – ensure API returns an array.
    api.get("/api/customers")
      .then((res) => {
        // If API returns an object, adjust accordingly:
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setExistingCustomers(data);
      })
      .catch((err) => console.error("Error fetching customers", err));

    // Fetch suppliers – ensure API returns an array.
    api.get("/api/suppliers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setSuppliers(data);
      })
      .catch((err) => console.error("Error fetching suppliers", err));
  }, []);

  // On mount, if no customer exists in booking, add one blank entry.
  useEffect(() => {
    if (customers.length === 0) {
      setCustomers([
        {
          id: 1,
          name: "",
          passport_number: "",
          passport_expiry: "",
          issuing_country: "",
          date_of_birth: "",
          is_leading: true,
          phoneCode: "+44",
          phone: "",
          alternatePhone: "",
        },
      ]);
    }
  }, []);

  // ---------- Navigation Functions ----------
  const nextStep = () => {
    setFieldErrors({});
    if (!departureDate) {
      setFieldErrors((prev) => ({ ...prev, departureDate: "Please fill in Departure Date." }));
      scrollToField("departureDate");
      return;
    }
    if (!returnDate) {
      setFieldErrors((prev) => ({ ...prev, returnDate: "Return Date is required." }));
      scrollToField("returnDate");
      return;
    }
    if (isFlightOnly) {
      const minExpiry = addMonths(returnDate, 6);
      customers.forEach((customer, index) => {
        if (!customer.passport_expiry || new Date(customer.passport_expiry) < new Date(minExpiry)) {
          setFieldErrors((prev) => ({
            ...prev,
            [`passport_expiry_${index}`]: `Passport expiry must be at least 6 months after Return Date (${minExpiry}).`,
          }));
          scrollToField(`passport_expiry_${index}`);
        }
      });
      if (Object.keys(fieldErrors).length > 0) return;
    }
    if (customers.length === 0) {
      setGlobalError("At least one customer is required.");
      scrollToField("customers");
      return;
    }
    if (customers.filter((c) => c.is_leading).length !== 1) {
      setGlobalError("Exactly one leading customer must be specified.");
      scrollToField("is_leading");
      return;
    }
    setGlobalError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setGlobalError(null);
    setStep((prev) => prev - 1);
  };

  const scrollToField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ---------- Booking Details Handlers (Step 1) ----------
  const handleBookingDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "departureDate") {
      setDepartureDate(value);
      setFieldErrors((prev) => ({ ...prev, departureDate: "" }));
    } else if (name === "returnDate") {
      setReturnDate(value);
      setFieldErrors((prev) => ({ ...prev, returnDate: "" }));
    }
  };

  // ---------- Customer Handlers (Step 1) ----------
  const handleCustomerChange = (index: number, field: string, value: any) => {
    const updated = [...customers];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "is_leading" && value === true) {
      updated.forEach((cust, i) => {
        if (i !== index) updated[i].is_leading = false;
      });
    }
    setCustomers(updated);
  };

  // For the existing customer search, we now allow multiple selections.
  const addCustomer = (customer?: Customer) => {
    if (customer) {
      if (!customers.find((c) => c.passport_number === customer.passport_number)) {
        setCustomers([...customers, customer]);
      }
    } else {
      setCustomers([
        ...customers,
        {
          id: customers.length + 1,
          name: "",
          passport_number: "",
          passport_expiry: "",
          issuing_country: "",
          date_of_birth: "",
          is_leading: customers.length === 0,
          phoneCode: "+44",
          phone: "",
          alternatePhone: "",
        },
      ]);
    }
  };

  const deleteCustomer = (index: number) => {
    const updated = [...customers];
    updated.splice(index, 1);
    if (updated.filter((c) => c.is_leading).length === 0 && updated.length > 0) {
      updated[0].is_leading = true;
    }
    setCustomers(updated);
  };

  // ---------- Flight Entry Handlers (Step 2) ----------
  const addGlobalFlightEntry = () => {
    const newEntry: FlightEntry = {
      pnr: "",
      itinerary: "",
      customerIndices: [],
      issuedFare: 0,
      remarks: "",
      atol: false,
      globalCost: true,
      globalCostData: { sellingCost: 0, cost: 0, internalCost: 0 },
      costs: {},
    };
    setGlobalFlights([...globalFlights, newEntry]);
  };

  const handleGlobalFlightEntryChange = (entryIndex: number, field: string, value: any) => {
    const updated = globalFlights.map((entry, i) =>
      i === entryIndex ? { ...entry, [field]: value } : entry
    );
    setGlobalFlights(updated);
  };

  const deleteGlobalFlightEntry = (entryIndex: number) => {
    setGlobalFlights(globalFlights.filter((_, i) => i !== entryIndex));
  };

  const toggleGlobalCostForEntry = (entryIndex: number, value: boolean) => {
    setGlobalFlights((prev) =>
      prev.map((entry, i) =>
        i === entryIndex ? { ...entry, globalCost: value } : entry
      )
    );
  };

  const updateGlobalCostForEntry = (entryIndex: number, field: "sellingCost" | "cost" | "internalCost", value: any) => {
    setGlobalFlights((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newGlobalCostData = entry.globalCostData || { sellingCost: 0, cost: 0, internalCost: 0 };
          newGlobalCostData[field] = Number(value);
          return { ...entry, globalCostData: newGlobalCostData };
        }
        return entry;
      })
    );
  };

  const updateFlightCostForCustomer = (entryIndex: number, customerIndex: number, field: "sellingCost" | "cost" | "internalCost", value: any) => {
    setGlobalFlights((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newCosts = { ...entry.costs };
          newCosts[customerIndex] = {
            sellingCost: newCosts[customerIndex]?.sellingCost || 0,
            cost: newCosts[customerIndex]?.cost || 0,
            internalCost: newCosts[customerIndex]?.internalCost || 0,
          };
          newCosts[customerIndex][field] = Number(value);
          return { ...entry, costs: newCosts };
        }
        return entry;
      })
    );
  };

  const getAvailableCustomers = (currentEntryIndex: number): Customer[] => {
    const selectedIndices = new Set<number>();
    globalFlights.forEach((entry, idx) => {
      if (idx !== currentEntryIndex) {
        entry.customerIndices.forEach((i) => selectedIndices.add(i));
      }
    });
    const currentSelection = globalFlights[currentEntryIndex]?.customerIndices || [];
    return customers.filter((_, index) =>
      currentSelection.includes(index) ? true : !selectedIndices.has(index)
    );
  };

  // ---------- Hotel Booking Handlers (Step 3) ----------
  const addHotelEntry = () => {
    const newEntry: HotelEntry = {
      hotelName: "",
      hotelAddress: "",
      mealType: "",
      roomAllocation: 0,
      roomType: "",
      roomView: "",
      roomViewOther: "",
      remarks: "",
      checkinDate: "",
      checkinTime: "",
      checkoutDate: "",
      nights: 0,
      customerIndices: [],
      globalCost: true,
      globalCostData: { sellingCost: 0, cost: 0, internalCost: 0 },
      costs: {},
      supplier_id: undefined,
    };
    setHotelEntries([...hotelEntries, newEntry]);
  };

  const handleHotelEntryChange = (index: number, field: string, value: any) => {
    const updated = hotelEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setHotelEntries(updated);
  };

  const deleteHotelEntry = (index: number) => {
    setHotelEntries(hotelEntries.filter((_, i) => i !== index));
  };

  const handleHotelSupplierSelect = (event: any, newValue: any) => {
    if (hotelEntries.length > 0) {
      const lastIndex = hotelEntries.length - 1;
      handleHotelEntryChange(lastIndex, "supplier_id", newValue ? newValue.id : undefined);
    }
  };

  // ---------- Visa Booking Handlers (Step 4) ----------
  const addVisaEntry = () => {
    const newEntry: VisaEntry = {
      customerIndices: [],
      globalCost: true,
      globalCostData: { sellingCost: 0, cost: 0, internalCost: 0 },
      costs: {},
      visa_type: "",
      previous_nationality: "",
      validity: "",
      airlineCode: "",
      flightCode: "",
      visaStatus: "Pending",
      remarks: "",
      supplier: null,
    };
    setVisas([...visas, newEntry]);
  };

  const handleVisaEntryChange = (entryIndex: number, field: string, value: any) => {
    const updated = visas.map((entry, i) =>
      i === entryIndex ? { ...entry, [field]: value } : entry
    );
    setVisas(updated);
  };

  const toggleGlobalCostForVisa = (entryIndex: number, value: boolean) => {
    setVisas((prev) =>
      prev.map((entry, i) =>
        i === entryIndex ? { ...entry, globalCost: value } : entry
      )
    );
  };

  const updateGlobalCostForVisa = (entryIndex: number, field: "sellingCost" | "cost" | "internalCost", value: any) => {
    setVisas((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newGlobalCostData = entry.globalCostData || { sellingCost: 0, cost: 0, internalCost: 0 };
          newGlobalCostData[field] = Number(value);
          return { ...entry, globalCostData: newGlobalCostData };
        }
        return entry;
      })
    );
  };

  const updateVisaCostForCustomer = (entryIndex: number, customerIndex: number, field: "sellingCost" | "cost" | "internalCost", value: any) => {
    setVisas((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newCosts = { ...entry.costs };
          newCosts[customerIndex] = {
            sellingCost: newCosts[customerIndex]?.sellingCost || 0,
            cost: newCosts[customerIndex]?.cost || 0,
            internalCost: newCosts[customerIndex]?.internalCost || 0,
          };
          newCosts[customerIndex][field] = Number(value);
          return { ...entry, costs: newCosts };
        }
        return entry;
      })
    );
  };

  const getAvailableVisaCustomers = (entryIndex: number): Customer[] => {
    const selectedIndices = new Set<number>(visas[entryIndex]?.customerIndices || []);
    return customers.filter((_, index) => !selectedIndices.has(index));
  };

  const handleVisaCustomerSelect = (entryIndex: number, newValues: Customer[]) => {
    const indices = newValues.map((cust) => customers.indexOf(cust));
    setVisas((prev) =>
      prev.map((entry, i) =>
        i === entryIndex ? { ...entry, customerIndices: indices } : entry
      )
    );
  };

  const handleVisaSupplierSelect = (entryIndex: number, newValue: any) => {
    setVisas((prev) =>
      prev.map((entry, i) =>
        i === entryIndex ? { ...entry, supplier: newValue } : entry
      )
    );
  };

  const deleteVisaEntry = (entryIndex: number) => {
    setVisas(visas.filter((_, i) => i !== entryIndex));
  };

  // ---------- Transport & Activities Handlers (Steps 5 & 6) ----------
  const handleTransportToggle = (required: boolean) => {
    setTransport((prev) => ({ ...prev, required } as TransportData));
  };
  const handleTransportChange = (field: string, value: any) => {
    setTransport((prev) => ({ ...prev, [field]: value } as TransportData));
  };

  const handleActivitiesToggle = (required: boolean) => {
    setActivities((prev) => ({ ...prev, required } as ActivitiesData));
  };
  const handleActivitiesChange = (field: string, value: any) => {
    setActivities((prev) => ({ ...prev, [field]: value } as ActivitiesData));
  };

  const totalIssuedFare = globalFlights.reduce(
    (sum, entry) => sum + Number(entry.issuedFare || 0),
    0
  );

  const leadingCustomer = customers.find((c) => c.is_leading);

  // ---------- Final Submission ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccess(null);
    const payload: any = {
      booking_date: bookingDate,
      departure_date: departureDate,
      return_date: returnDate,
      status: status,
      booking_type: bookingType,
      passengers_count: customers.length,
      customers: customers,
      supplier_id: null,
    };
    if (bookingType === "Flight") {
      payload.flight_booking = globalFlights;
      payload.total_issued_fare = totalIssuedFare;
    } else {
      payload.flight_booking = globalFlights;
      payload.hotel_booking = hotelEntries;
      payload.visa_booking = visas;
      payload.transport_booking = transport;
      payload.activity_booking = activities;
    }
    console.log("Payload:", payload);
    try {
      const response = await api.post("/api/bookings", payload);
      if (response.status === 201) {
        setSuccess("Booking created successfully!");
      } else {
        setGlobalError("Failed to create booking.");
      }
    } catch (err: any) {
      console.error("Error:", err.response?.data || err.message);
      setGlobalError("An error occurred while creating the booking.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ padding: 2 }}>
      <Stepper activeStep={step - 1} alternativeLabel connector={<ColorlibConnector />} sx={{ mb: 4 }}>
        {stepsToShow.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* --- Step 1: Booking Details & Customers --- */}
      {step === 1 && (
        <Card sx={{ p: 2, mb: 2 }} id="booking-details">
          <Typography variant="h6" sx={{ mb: 2 }}>Booking Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Booking Date"
                type="date"
                name="bookingDate"
                value={bookingDate}
                fullWidth
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Departure Date"
                type="date"
                name="departureDate"
                value={departureDate}
                onChange={handleBookingDetailChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: getTomorrow() }}
                required
                id="departureDate"
                error={Boolean(fieldErrors["departureDate"])}
                helperText={fieldErrors["departureDate"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Return Date"
                type="date"
                name="returnDate"
                value={returnDate}
                onChange={handleBookingDetailChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: departureDate || getTomorrow() }}
                required
                id="returnDate"
                error={Boolean(fieldErrors["returnDate"])}
                helperText={fieldErrors["returnDate"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Passengers Count"
                type="number"
                value={customers.length}
                fullWidth
                InputProps={{ readOnly: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="status-label">Status</InputLabel>
                <Select labelId="status-label" name="status" value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="booking-type-label">Booking Type</InputLabel>
                <Select labelId="booking-type-label" name="bookingType" value={bookingType} label="Booking Type" onChange={(e) => setBookingType(e.target.value)}>
                  <MenuItem value="Flight">Flight</MenuItem>
                  <MenuItem value="Umrah">Umrah</MenuItem>
                  <MenuItem value="Holiday">Holiday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Existing Customer Search (from API) with multiple selection */}
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={Array.isArray(existingCustomers) ? existingCustomers : []}
              getOptionLabel={(option: Customer) => `${option.passport_number} - ${option.name}`}
              onChange={(event, newValues) => {
                if (Array.isArray(newValues)) {
                  newValues.forEach((newVal) => addCustomer(newVal));
                }
              }}
              renderInput={(params) => <TextField {...params} label="Search Existing Customers" />}
            />
          </Box>

          {/* Manual Customer Entries */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Customers</Typography>
            {customers.map((customer, index) => (
              <Box key={index} sx={{ border: "1px solid #ccc", p: 2, mb: 2, position: "relative" }} id="customers">
                <Typography variant="subtitle1">Customer {index + 1}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Name" value={customer.name} onChange={(e) => handleCustomerChange(index, "name", e.target.value)} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Passport Number" value={customer.passport_number} onChange={(e) => handleCustomerChange(index, "passport_number", e.target.value)} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Passport Expiry"
                      type="date"
                      value={customer.passport_expiry}
                      onChange={(e) => handleCustomerChange(index, "passport_expiry", e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: getTomorrow() }}
                      required
                      id={`passport_expiry_${index}`}
                      error={Boolean(fieldErrors[`passport_expiry_${index}`])}
                      helperText={fieldErrors[`passport_expiry_${index}`]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={countryList}
                      getOptionLabel={(option) => option.label}
                      value={countryList.find((country) => country.label === customer.issuing_country) || null}
                      onChange={(event, newValue) =>
                        handleCustomerChange(index, "issuing_country", newValue ? newValue.label : "")
                      }
                      renderInput={(params) => <TextField {...params} label="Issuing Country" required />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Date of Birth" type="date" value={customer.date_of_birth} onChange={(e) => handleCustomerChange(index, "date_of_birth", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel control={<Checkbox checked={customer.is_leading} onChange={(e) => handleCustomerChange(index, "is_leading", e.target.checked)} />} label="Leading Customer" />
                  </Grid>
                  {customer.is_leading && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Email" value={customer.email || ""} onChange={(e) => handleCustomerChange(index, "email", e.target.value)} fullWidth required />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Address" value={customer.address || ""} onChange={(e) => handleCustomerChange(index, "address", e.target.value)} fullWidth required />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Phone"
                          value={customer.phone || ""}
                          onChange={(e) => handleCustomerChange(index, "phone", e.target.value)}
                          fullWidth
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Select
                                  value={customer.phoneCode || "+44"}
                                  onChange={(e) => handleCustomerChange(index, "phoneCode", e.target.value)}
                                  variant="standard"
                                  disableUnderline
                                >
                                  {phoneCodes.map((code) => (
                                    <MenuItem key={code.code} value={code.code}>
                                      {code.code}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Alternate Phone" value={customer.alternatePhone || ""} onChange={(e) => handleCustomerChange(index, "alternatePhone", e.target.value)} fullWidth />
                      </Grid>
                    </>
                  )}
                </Grid>
                {customers.length > 1 && (
                  <IconButton onClick={() => deleteCustomer(index)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button variant="contained" onClick={() => addCustomer()}>Add New Customer</Button>
          </Box>

          {globalError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {globalError}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button disabled variant="contained">Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 2: Flights --- */}
      {step === 2 && (
        <Card sx={{ p: 2, mb: 2 }} id="flights">
          <Typography variant="h6" sx={{ mb: 2 }}>Flights</Typography>
          {globalFlights.map((entry, entryIndex) => (
            <Box key={entryIndex} sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}>
              <Typography variant="subtitle2">Flight Entry {entryIndex + 1}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="PNR No"
                    value={entry.pnr}
                    onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "pnr", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="PNR Itinerary"
                    value={entry.itinerary}
                    onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "itinerary", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={customers}
                    getOptionLabel={(option: Customer) => option.name || ""}
                    value={entry.customerIndices ? entry.customerIndices.map((i) => customers[i]) : []}
                    onChange={(event, newValue) => {
                      const indices = newValue.map((cust) => customers.indexOf(cust));
                      handleGlobalFlightEntryChange(entryIndex, "customerIndices", indices);
                    }}
                    renderInput={(params) => <TextField {...params} label="Select Customers" required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Issued Fare"
                    type="number"
                    value={entry.issuedFare}
                    onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "issuedFare", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Remarks"
                    value={entry.remarks}
                    onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "remarks", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Checkbox checked={entry.atol} onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "atol", e.target.checked)} />}
                    label="ATOL"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={entry.globalCost} onChange={(e) => toggleGlobalCostForEntry(entryIndex, e.target.checked)} />}
                  label="Use same cost for all selected customers"
                />
              </Box>

              {entry.globalCost ? (
                <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", backgroundColor: "#f9f9f9" }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Global Cost Details (applies to all selected customers)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Selling Cost"
                        type="number"
                        value={entry.globalCostData?.sellingCost || ""}
                        onChange={(e) => updateGlobalCostForEntry(entryIndex, "sellingCost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Cost"
                        type="number"
                        value={entry.globalCostData?.cost || ""}
                        onChange={(e) => updateGlobalCostForEntry(entryIndex, "cost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Internal Cost"
                        type="number"
                        value={entry.globalCostData?.internalCost || ""}
                        onChange={(e) => updateGlobalCostForEntry(entryIndex, "internalCost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                entry.customerIndices.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", backgroundColor: "#f9f9f9" }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Cost Details for Selected Customers:
                    </Typography>
                    {entry.customerIndices.map((custIndex) => {
                      const customer = customers[custIndex];
                      const costData = entry.costs[custIndex] || { sellingCost: 0, cost: 0, internalCost: 0 };
                      return (
                        <Box key={custIndex} sx={{ mb: 2, borderBottom: "1px solid #ddd", pb: 1 }}>
                          <Typography variant="body2">
                            {customer.name} (Passport: {customer.passport_number})
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Selling Cost"
                                type="number"
                                value={costData.sellingCost}
                                onChange={(e) => updateFlightCostForCustomer(entryIndex, custIndex, "sellingCost", e.target.value)}
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Cost"
                                type="number"
                                value={costData.cost}
                                onChange={(e) => updateFlightCostForCustomer(entryIndex, custIndex, "cost", e.target.value)}
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Internal Cost"
                                type="number"
                                value={costData.internalCost}
                                onChange={(e) => updateFlightCostForCustomer(entryIndex, custIndex, "internalCost", e.target.value)}
                                fullWidth
                                required
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })}
                  </Box>
                )
              )}

              <IconButton onClick={() => deleteGlobalFlightEntry(entryIndex)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addGlobalFlightEntry}>Add Flight Entry</Button>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Total Issued Fare: {totalIssuedFare}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 3: Hotel Booking --- */}
      {!isFlightOnly && step === 3 && (
        <Card sx={{ p: 2, mb: 2 }} id="hotels">
          <Typography variant="h6" sx={{ mb: 2 }}>Hotel Booking</Typography>
          {hotelEntries.map((entry, index) => (
            <Box key={index} sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}>
              <Typography variant="subtitle2">Hotel Entry {index + 1}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Hotel Name" value={entry.hotelName} onChange={(e) => handleHotelEntryChange(index, "hotelName", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Hotel Address" value={entry.hotelAddress} onChange={(e) => handleHotelEntryChange(index, "hotelAddress", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={customers}
                    getOptionLabel={(option: Customer) => option.name || ""}
                    value={entry.customerIndices ? entry.customerIndices.map((i) => customers[i]) : []}
                    onChange={(event, newValue) => {
                      const indices = newValue.map((cust) => customers.indexOf(cust));
                      handleHotelEntryChange(index, "customerIndices", indices);
                    }}
                    renderInput={(params) => <TextField {...params} label="Select Customers" required />}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel id="meal-type-label">Meal Type</InputLabel>
                    <Select
                      labelId="meal-type-label"
                      value={entry.mealType}
                      label="Meal Type"
                      onChange={(e) => handleHotelEntryChange(index, "mealType", e.target.value)}
                    >
                      <MenuItem value="Room Only">Room Only</MenuItem>
                      <MenuItem value="Breakfast">Breakfast</MenuItem>
                      <MenuItem value="Full board">Full board</MenuItem>
                      <MenuItem value="Half board">Half board</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Room Allocation" type="number" value={entry.roomAllocation} onChange={(e) => handleHotelEntryChange(index, "roomAllocation", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel id="room-type-label">Room Type</InputLabel>
                    <Select
                      labelId="room-type-label"
                      value={entry.roomType}
                      label="Room Type"
                      onChange={(e) => handleHotelEntryChange(index, "roomType", e.target.value)}
                    >
                      <MenuItem value="Single">Single</MenuItem>
                      <MenuItem value="Double">Double</MenuItem>
                      <MenuItem value="Triple">Triple</MenuItem>
                      <MenuItem value="Quadruple">Quadruple</MenuItem>
                      <MenuItem value="Quint">Quint</MenuItem>
                      <MenuItem value="Executive Sweet">Executive Sweet</MenuItem>
                      <MenuItem value="Residential Sweet">Residential Sweet</MenuItem>
                      <MenuItem value="Deluxe">Deluxe</MenuItem>
                      <MenuItem value="Classic">Classic</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {entry.roomType === "other" && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Other Room Type" value={entry.roomViewOther || ""} onChange={(e) => handleHotelEntryChange(index, "roomViewOther", e.target.value)} fullWidth required />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField label="Room View" value={entry.roomView} onChange={(e) => handleHotelEntryChange(index, "roomView", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Remarks" value={entry.remarks} onChange={(e) => handleHotelEntryChange(index, "remarks", e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Check-in Date" type="date" value={entry.checkinDate} onChange={(e) => handleHotelEntryChange(index, "checkinDate", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: getTomorrow() }} required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Check-in Time" type="time" value={entry.checkinTime} onChange={(e) => handleHotelEntryChange(index, "checkinTime", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Check-out Date" type="date" value={entry.checkoutDate} onChange={(e) => handleHotelEntryChange(index, "checkoutDate", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: entry.checkinDate || getTomorrow() }} required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Number of Nights" type="number" value={entry.nights} onChange={(e) => handleHotelEntryChange(index, "nights", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Selling Cost" type="number" value={entry.sellingCost} onChange={(e) => handleHotelEntryChange(index, "sellingCost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Cost" type="number" value={entry.cost} onChange={(e) => handleHotelEntryChange(index, "cost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Internal Cost" type="number" value={entry.internalCost} onChange={(e) => handleHotelEntryChange(index, "internalCost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={Array.isArray(suppliers) ? suppliers : []}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    onChange={handleHotelSupplierSelect}
                    renderInput={(params) => <TextField {...params} label="Supplier" required />}
                  />
                </Grid>
              </Grid>
              <IconButton onClick={() => deleteHotelEntry(index)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addHotelEntry}>Add Hotel Entry</Button>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 4: Visa Booking --- */}
      {!isFlightOnly && step === 4 && (
        <Card sx={{ p: 2, mb: 2 }} id="visa">
          <Typography variant="h6" sx={{ mb: 2 }}>Visa Booking</Typography>
          {visas.map((entry, entryIndex) => (
            <Box key={entryIndex} sx={{ border: "1px solid #ccc", p: 2, mb: 2, position: "relative" }}>
              <Typography variant="subtitle2">Visa Entry {entryIndex + 1}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={customers}
                    getOptionLabel={(option: Customer) => `${option.passport_number} - ${option.name}`}
                    value={entry.customerIndices ? entry.customerIndices.map((i) => customers[i]) : []}
                    onChange={(event, newValue) => {
                      const indices = newValue.map((cust) => customers.indexOf(cust));
                      handleVisaEntryChange(entryIndex, "customerIndices", indices);
                    }}
                    renderInput={(params) => <TextField {...params} label="Select Customers (by Passport)" required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id={`visa-type-label-${entryIndex}`}>Visa Type</InputLabel>
                    <Select
                      labelId={`visa-type-label-${entryIndex}`}
                      value={entry.visa_type}
                      label="Visa Type"
                      onChange={(e) => handleVisaEntryChange(entryIndex, "visa_type", e.target.value)}
                    >
                      <MenuItem value="Umrah Visa">Umrah Visa</MenuItem>
                      <MenuItem value="Tourist Visa">Tourist Visa</MenuItem>
                      <MenuItem value="EVW Visa">EVW Visa</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {entry.visa_type === "EVW Visa" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Previous Nationality"
                      value={entry.previous_nationality}
                      onChange={(e) => handleVisaEntryChange(entryIndex, "previous_nationality", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Airline Code"
                    value={entry.airlineCode}
                    onChange={(e) => handleVisaEntryChange(entryIndex, "airlineCode", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Flight Code"
                    value={entry.flightCode}
                    onChange={(e) => handleVisaEntryChange(entryIndex, "flightCode", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={entry.globalCost} onChange={(e) => toggleGlobalCostForVisa(entryIndex, e.target.checked)} />}
                    label="Use same cost for all selected customers"
                  />
                </Grid>
                {entry.globalCost ? (
                  <Box sx={{ width: "100%", mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Selling Cost"
                          type="number"
                          value={entry.globalCostData?.sellingCost || ""}
                          onChange={(e) => updateGlobalCostForVisa(entryIndex, "sellingCost", e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Cost"
                          type="number"
                          value={entry.globalCostData?.cost || ""}
                          onChange={(e) => updateGlobalCostForVisa(entryIndex, "cost", e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Internal Cost"
                          type="number"
                          value={entry.globalCostData?.internalCost || ""}
                          onChange={(e) => updateGlobalCostForVisa(entryIndex, "internalCost", e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  entry.customerIndices.length > 0 && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      {entry.customerIndices.map((custIndex) => {
                        const customer = customers[custIndex];
                        const costData = entry.costs[custIndex] || { sellingCost: 0, cost: 0, internalCost: 0 };
                        return (
                          <Box key={custIndex} sx={{ mb: 1, borderBottom: "1px solid #ddd", pb: 1 }}>
                            <Typography variant="body2">
                              {customer.name} (Passport: {customer.passport_number})
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Selling Cost"
                                  type="number"
                                  value={costData.sellingCost}
                                  onChange={(e) => updateVisaCostForCustomer(entryIndex, custIndex, "sellingCost", e.target.value)}
                                  fullWidth
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Cost"
                                  type="number"
                                  value={costData.cost}
                                  onChange={(e) => updateVisaCostForCustomer(entryIndex, custIndex, "cost", e.target.value)}
                                  fullWidth
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Internal Cost"
                                  type="number"
                                  value={costData.internalCost}
                                  onChange={(e) => updateVisaCostForCustomer(entryIndex, custIndex, "internalCost", e.target.value)}
                                  fullWidth
                                  required
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        );
                      })}
                    </Box>
                  )
                )}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id={`visa-status-label-${entryIndex}`}>Visa Status</InputLabel>
                    <Select
                      labelId={`visa-status-label-${entryIndex}`}
                      value={entry.visaStatus}
                      label="Visa Status"
                      onChange={(e) => handleVisaEntryChange(entryIndex, "visaStatus", e.target.value)}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Processing">Processing</MenuItem>
                      <MenuItem value="Issued">Issued</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Remarks"
                    value={entry.remarks}
                    onChange={(e) => handleVisaEntryChange(entryIndex, "remarks", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={Array.isArray(suppliers) ? suppliers : []}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={entry.supplier}
                    onChange={(event, newValue) => handleVisaSupplierSelect(entryIndex, newValue)}
                    renderInput={(params) => <TextField {...params} label="Supplier" required />}
                  />
                </Grid>
              </Grid>
              <IconButton onClick={() => deleteVisaEntry(entryIndex)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addVisaEntry}>Add Visa Entry</Button>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 5: Transport --- */}
      {!isFlightOnly && step === 5 && (
        <Card sx={{ p: 2, mb: 2 }} id="transport">
          <Typography variant="h6" sx={{ mb: 2 }}>Transport (Leading Customer Only)</Typography>
          {leadingCustomer ? (
            <Box sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{leadingCustomer.name}</Typography>
              <FormControlLabel
                control={<Checkbox checked={transport?.required || false} onChange={(e) => handleTransportToggle(e.target.checked)} />}
                label="Transport Required?"
              />
              {transport?.required && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Vehicle Type" value={transport?.vehicleType || ""} onChange={(e) => handleTransportChange("vehicleType", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Pickup From" value={transport?.pickupFrom || ""} onChange={(e) => handleTransportChange("pickupFrom", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Pickup Time" type="time" value={transport?.pickupTime || ""} onChange={(e) => handleTransportChange("pickupTime", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Dropoff" value={transport?.dropoff || ""} onChange={(e) => handleTransportChange("dropoff", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Selling Cost" type="number" value={transport?.sellingCost || ""} onChange={(e) => handleTransportChange("sellingCost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Cost" type="number" value={transport?.cost || ""} onChange={(e) => handleTransportChange("cost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Internal Cost" type="number" value={transport?.internalCost || ""} onChange={(e) => handleTransportChange("internalCost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={Array.isArray(suppliers) ? suppliers : []}
                        getOptionLabel={(option) => `${option.name} (${option.email})`}
                        onChange={(event, newValue) => handleTransportChange("supplier_id", newValue ? newValue.id : undefined)}
                        renderInput={(params) => <TextField {...params} label="Supplier" />}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="error">No leading customer selected.</Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 6: Activities --- */}
      {!isFlightOnly && step === 6 && (
        <Card sx={{ p: 2, mb: 2 }} id="activities">
          <Typography variant="h6" sx={{ mb: 2 }}>Activities (Leading Customer Only)</Typography>
          {leadingCustomer ? (
            <Box sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{leadingCustomer.name}</Typography>
              <FormControlLabel
                control={<Checkbox checked={activities?.required || false} onChange={(e) => handleActivitiesToggle(e.target.checked)} />}
                label="Activities Required?"
              />
              {activities?.required && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Activity Name" value={activities?.activity_name || ""} onChange={(e) => handleActivitiesChange("activity_name", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Date and Time" type="datetime-local" value={activities?.datetime || ""} onChange={(e) => handleActivitiesChange("datetime", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel id="guide-label">Guide</InputLabel>
                        <Select labelId="guide-label" value={activities?.guide || ""} label="Guide" onChange={(e) => handleActivitiesChange("guide", e.target.value)}>
                          <MenuItem value="Yes">Yes</MenuItem>
                          <MenuItem value="No">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {activities?.guide === "Yes" && (
                      <Grid item xs={12} sm={6}>
                        <TextField label="Guide Cost" type="number" value={activities?.guideCost || ""} onChange={(e) => handleActivitiesChange("guideCost", e.target.value)} fullWidth required />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField label="Selling Cost" type="number" value={activities?.sellingCost || ""} onChange={(e) => handleActivitiesChange("sellingCost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Cost" type="number" value={activities?.cost || ""} onChange={(e) => handleActivitiesChange("cost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Internal Cost" type="number" value={activities?.internalCost || ""} onChange={(e) => handleActivitiesChange("internalCost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={Array.isArray(suppliers) ? suppliers : []}
                        getOptionLabel={(option) => `${option.name} (${option.email})`}
                        onChange={(event, newValue) => handleActivitiesChange("supplier_id", newValue ? newValue.id : undefined)}
                        renderInput={(params) => <TextField {...params} label="Supplier" />}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="error">No leading customer selected.</Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Final Step: Review & Submit --- */}
      {((isFlightOnly && step === 3) || (!isFlightOnly && step === 7)) && (
        <Card sx={{ p: 2, mb: 2 }} id="review">
          <Typography variant="h6" sx={{ mb: 2 }}>Review & Submit</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Booking Date: {bookingDate}</Typography>
            <Typography variant="subtitle1">Departure Date: {departureDate}</Typography>
            <Typography variant="subtitle1">Return Date: {returnDate}</Typography>
            <Typography variant="subtitle1">Passengers Count: {customers.length}</Typography>
            <Typography variant="subtitle1">Status: {status}</Typography>
            <Typography variant="subtitle1">Booking Type: {bookingType}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Customers:</Typography>
            {customers.map((cust, i) => (
              <Box key={i} sx={{ ml: 2 }}>
                <Typography variant="body2">{cust.name} - {cust.passport_number}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Flights:</Typography>
            {globalFlights.map((flight, i) => (
              <Box key={i} sx={{ ml: 2 }}>
                <Typography variant="body2">
                  PNR: {flight.pnr} | Itinerary: {flight.itinerary} | Issued Fare: {flight.issuedFare}
                </Typography>
                <Typography variant="body2">
                  Selected Customers: {flight.customerIndices.map((idx) => customers[idx]?.name).join(", ")}
                </Typography>
                {flight.globalCost ? (
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Global Cost Applied: Selling Cost: {flight.globalCostData?.sellingCost || 0}, Cost: {flight.globalCostData?.cost || 0}, Internal Cost: {flight.globalCostData?.internalCost || 0}
                  </Typography>
                ) : (
                  <Box sx={{ ml: 2 }}>
                    {flight.customerIndices.map((custIndex) => {
                      const costData = flight.costs[custIndex];
                      return (
                        <Typography key={custIndex} variant="body2">
                          {customers[custIndex]?.name}: Selling Cost: {costData?.sellingCost || 0}, Cost: {costData?.cost || 0}, Internal Cost: {costData?.internalCost || 0}
                        </Typography>
                      );
                    })}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
          {!isFlightOnly && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Hotel Entries:</Typography>
                {hotelEntries.map((entry, i) => (
                  <Box key={i} sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      {entry.hotelName} - {entry.hotelAddress} | Meal: {entry.mealType} | Room: {entry.roomAllocation} x {entry.roomType}
                    </Typography>
                    <Typography variant="body2">
                      Customers: {entry.customerIndices.map((idx) => customers[idx]?.name).join(", ")}
                    </Typography>
                    <Typography variant="body2">
                      {entry.globalCost
                        ? `Global Cost - Selling Cost: ${entry.globalCostData?.sellingCost || 0}, Cost: ${entry.globalCostData?.cost || 0}, Internal Cost: ${entry.globalCostData?.internalCost || 0}`
                        : entry.customerIndices.map((idx) => {
                            const cd = entry.costs[idx];
                            return `${customers[idx]?.name}: Selling Cost: ${cd?.sellingCost || 0}, Cost: ${cd?.cost || 0}, Internal Cost: ${cd?.internalCost || 0}`;
                          }).join(" | ")}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Visa Entries:</Typography>
                {visas.map((visa, i) => (
                  <Box key={i} sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      Customers: {visa.customerIndices?.map((idx) => customers[idx]?.name).join(", ") || "Not selected"}
                    </Typography>
                    <Typography variant="body2">
                      Visa Type: {visa.visa_type} | Status: {visa.visaStatus}
                    </Typography>
                    <Typography variant="body2">
                      Airline Code: {visa.airlineCode} | Flight Code: {visa.flightCode}
                    </Typography>
                    <Typography variant="body2">
                      {visa.globalCost
                        ? `Global Cost - Selling Cost: ${visa.globalCostData?.sellingCost || 0}, Cost: ${visa.globalCostData?.cost || 0}, Internal Cost: ${visa.globalCostData?.internalCost || 0}`
                        : visa.customerIndices?.map((idx) => {
                            const cd = visa.costs[idx];
                            return `${customers[idx]?.name}: Selling Cost: ${cd?.sellingCost || 0}, Cost: ${cd?.cost || 0}, Internal Cost: ${cd?.internalCost || 0}`;
                          }).join(" | ")}
                    </Typography>
                    <Typography variant="body2">
                      Remarks: {visa.remarks}
                    </Typography>
                    <Typography variant="body2">
                      Supplier: {visa.supplier ? `${visa.supplier.name} (${visa.supplier.email})` : "Not selected"}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Transport:</Typography>
                {transport && (
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2">Vehicle: {transport.vehicleType} | Selling Cost: {transport.sellingCost}</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Activities:</Typography>
                {activities && (
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2">Activity: {activities.activity_name} | Selling Cost: {activities.sellingCost}</Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" type="submit">Submit Booking</Button>
          </Box>
        </Card>
      )}

      {globalError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {globalError}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <AlertTitle>Success</AlertTitle>
          {success} <Link href="/bookings">Go to Bookings</Link>
        </Alert>
      )}
    </Box>
  );
};

export default AddBooking;
