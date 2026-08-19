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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import api from "@/api/api";

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
// For Flight bookings (type "Flight") we show only three steps;
// For other types (Umrah/Holiday) we show all 6 service steps plus Review.
const flightSteps = [
  "Booking Details & Customers",
  "Flights",
  "Review & Submit",
];
const otherSteps = [
  "Booking Details & Customers",
  "Flights",
  "Hotels",
  "Visa",
  "Transport",
  "Activities",
  "Review & Submit",
];

// ---------- Sample Data ----------
const countryList = [
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "PK", label: "Pakistan" },
  { code: "CA", label: "Canada" },
  // ... more countries as needed
];

const phoneCodes = [
  { code: "+44", label: "UK (+44)" },
  { code: "+1", label: "US (+1)" },
  { code: "+92", label: "Pakistan (+92)" },
  // ... more codes as needed
];

// ---------- Interfaces ----------
interface Customer {
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

interface FlightEntry {
  pnr: string;
  itinerary: string;
  // Global flight entries allow selection of multiple customers.
  customerIndices: number[];
  sellingCost: number;
  issuedFare: number;
  cost: number;
  remarks: string;
  atol: boolean;
}

type FlightDataGlobal = FlightEntry[];

interface HotelEntry {
  hotelName: string;
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
  cost: number;
  internalCost: number;
  sellingCost: number;
  supplier?: string;
}

type HotelData = {
  required: boolean;
  entries: HotelEntry[];
};

interface VisaEntry {
  visaType: string;
  previousNationality?: string;
  validity?: string; // Optional field
  airlineCode: string;
  flightCode: string;
  cost: number;
  internalCost: number;
  sellingCost: number;
  visaStatus: string;
  remarks: string;
}

type VisaData = {
  required: boolean;
  entries: VisaEntry[];
};

interface TransportData {
  required: boolean;
  vehicleType: string;
  pickupFrom: string;
  pickupTime: string;
  dropoff: string;
  cost: number;
  internalCost: number;
  sellingCost: number;
  supplier?: string;
}

interface ActivitiesData {
  required: boolean;
  sightName: string;
  datetime: string;
  guide: string; // "Yes" or "No"
  guideCost?: number;
  cost: number;
  internalCost: number;
  sellingCost: number;
  supplier?: string;
}

// ---------- Main Component ----------
const AddBooking: React.FC = () => {
  // Step state
  const [step, setStep] = useState<number>(1);

  // Booking details (Step 1)
  const [bookingDate] = useState<string>(getToday());
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>(""); // Only for Flight bookings
  const [status, setStatus] = useState<string>("pending");
  const [bookingType, setBookingType] = useState<string>("Flight"); // Options: Flight, Umrah, Holiday

  // Customers (Step 1)
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Global flights state (Step 2)
  const [globalFlights, setGlobalFlights] = useState<FlightDataGlobal>([]);

  // For non‑Flight bookings (Hotels, Visa, Transport, Activities)
  const [hotels, setHotels] = useState<{ [key: number]: HotelData }>({});
  const [visas, setVisas] = useState<{ [key: number]: VisaData }>({});
  const [transport, setTransport] = useState<TransportData | null>(null);
  const [activities, setActivities] = useState<ActivitiesData | null>(null);

  // Field-specific errors (keyed by field ID)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // General error and success messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determine if we are doing Flight-only booking
  const isFlightOnly = bookingType === "Flight";

  // Steps to display based on booking type
  const stepsToShow = isFlightOnly ? flightSteps : otherSteps;

  // On mount, if no customer exists, add one
  useEffect(() => {
    if (customers.length === 0) {
      setCustomers([
        {
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
    // (You may also fetch existing customer options here.)
  }, []);

  // ---------- Navigation Functions ----------
  const nextStep = () => {
    // Clear field-specific errors
    setFieldErrors({});
    // Validate Step 1 (Booking Details & Customers)
    if (step === 1) {
      if (!departureDate) {
        setError("Please fill in Departure Date.");
        scrollToField("departureDate");
        return;
      }
      if (isFlightOnly && !returnDate) {
        setError("For Flight bookings, please specify a Return Date.");
        scrollToField("returnDate");
        return;
      }
      // For Flight bookings, ensure each customer's passport expiry is at least 6 months after Return Date
      if (isFlightOnly) {
        const minExpiry = addMonths(returnDate, 6);
        for (const customer of customers) {
          if (!customer.passport_expiry || new Date(customer.passport_expiry) < new Date(minExpiry)) {
            setError(
              `Passport expiry for ${customer.name || "a customer"} must be at least 6 months after Return Date (${minExpiry}).`
            );
            scrollToField("passport_expiry");
            return;
          }
        }
      }
      if (customers.length === 0) {
        setError("Please add at least one customer.");
        scrollToField("customers");
        return;
      }
      if (customers.filter((c) => c.is_leading).length !== 1) {
        setError("Exactly one leading customer must be specified.");
        scrollToField("is_leading");
        return;
      }
    }
    // Additional step validations can be added here if needed.
    setError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  // ---------- Helper: Scroll to Field ----------
  const scrollToField = (fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ---------- Handlers for Booking Details (Step 1) ----------
  const handleBookingDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "departureDate") {
      setDepartureDate(value);
    } else if (name === "returnDate") {
      setReturnDate(value);
    }
  };

  // ---------- Customers Handlers (Step 1) ----------
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

  const addCustomer = () => {
    setCustomers([
      ...customers,
      {
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
  };

  const deleteCustomer = (index: number) => {
    const updated = [...customers];
    updated.splice(index, 1);
    if (updated.filter((c) => c.is_leading).length === 0 && updated.length > 0) {
      updated[0].is_leading = true;
    }
    setCustomers(updated);
  };

  // ---------- Global Flights Handlers (Step 2) ----------
  const addGlobalFlightEntry = () => {
    const newEntry: FlightEntry = {
      pnr: "",
      itinerary: "",
      customerIndices: [],
      sellingCost: 0,
      issuedFare: 0,
      cost: 0,
      remarks: "",
      atol: false,
    };
    setGlobalFlights([...globalFlights, newEntry]);
  };

  const handleGlobalFlightEntryChange = (
    entryIndex: number,
    field: string,
    value: any
  ) => {
    const updated = globalFlights.map((entry, i) =>
      i === entryIndex ? { ...entry, [field]: value } : entry
    );
    setGlobalFlights(updated);
  };

  const deleteGlobalFlightEntry = (entryIndex: number) => {
    setGlobalFlights(globalFlights.filter((_, i) => i !== entryIndex));
  };

  // ---------- For Customer Selection in Flight Entry ----------
  // Returns available customers for the given flight entry, excluding those already selected in other flight entries.
  const getAvailableCustomers = (currentEntryIndex: number): Customer[] => {
    const selectedIndices = new Set<number>();
    globalFlights.forEach((entry, idx) => {
      if (idx !== currentEntryIndex) {
        entry.customerIndices.forEach((i) => selectedIndices.add(i));
      }
    });
    // In current entry, show those already selected plus those not yet selected in any other entry.
    const currentSelection =
      globalFlights[currentEntryIndex]?.customerIndices || [];
    return customers.filter((_, index) =>
      currentSelection.includes(index) ? true : !selectedIndices.has(index)
    );
  };

  // ---------- Handlers for Hotels (Step 3) ----------
  const addHotelEntry = (customerIndex: number) => {
    const newEntry: HotelEntry = {
      hotelName: "",
      mealType: "",
      roomAllocation: 0,
      roomType: "",
      roomView: "",
      remarks: "",
      checkinDate: "",
      checkinTime: "",
      checkoutDate: "",
      nights: 0,
      cost: 0,
      internalCost: 0,
      sellingCost: 0,
      supplier: "",
    };
    setHotels((prev) => ({
      ...prev,
      [customerIndex]: {
        required: true,
        entries: [...(prev[customerIndex]?.entries || []), newEntry],
      },
    }));
  };

  const handleHotelEntryChange = (
    customerIndex: number,
    entryIndex: number,
    field: string,
    value: any
  ) => {
    setHotels((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.map((entry, i) =>
        i === entryIndex ? { ...entry, [field]: value } : entry
      );
      return { ...prev, [customerIndex]: { ...customerData, entries: updatedEntries } };
    });
  };

  const deleteHotelEntry = (customerIndex: number, entryIndex: number) => {
    setHotels((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.filter((_, i) => i !== entryIndex);
      return { ...prev, [customerIndex]: { ...customerData, entries: updatedEntries } };
    });
  };

  // ---------- Handlers for Visa (Step 4) ----------
  const addVisaEntry = (customerIndex: number) => {
    const newEntry: VisaEntry = {
      visaType: "",
      airlineCode: "",
      flightCode: "",
      cost: 0,
      internalCost: 0,
      sellingCost: 0,
      visaStatus: "",
      remarks: "",
    };
    setVisas((prev) => ({
      ...prev,
      [customerIndex]: {
        required: true,
        entries: [...(prev[customerIndex]?.entries || []), newEntry],
      },
    }));
  };

  const handleVisaEntryChange = (
    customerIndex: number,
    entryIndex: number,
    field: string,
    value: any
  ) => {
    setVisas((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.map((entry, i) =>
        i === entryIndex ? { ...entry, [field]: value } : entry
      );
      return { ...prev, [customerIndex]: { ...customerData, entries: updatedEntries } };
    });
  };

  const deleteVisaEntry = (customerIndex: number, entryIndex: number) => {
    setVisas((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.filter((_, i) => i !== entryIndex);
      return { ...prev, [customerIndex]: { ...customerData, entries: updatedEntries } };
    });
  };

  // ---------- Handlers for Transport (Step 5) ----------
  const handleTransportToggle = (required: boolean) => {
    setTransport((prev) => ({ ...prev, required } as TransportData));
  };
  const handleTransportChange = (field: string, value: any) => {
    setTransport((prev) => ({ ...prev, [field]: value } as TransportData));
  };

  // ---------- Handlers for Activities (Step 6) ----------
  const handleActivitiesToggle = (required: boolean) => {
    setActivities((prev) => ({ ...prev, required } as ActivitiesData));
  };
  const handleActivitiesChange = (field: string, value: any) => {
    setActivities((prev) => ({ ...prev, [field]: value } as ActivitiesData));
  };

  // ---------- Compute Total Issued Fare ----------
  const totalIssuedFare = globalFlights.reduce(
    (sum, entry) => sum + Number(entry.issuedFare || 0),
    0
  );

  // ---------- Get Leading Customer ----------
  const leadingCustomer = customers.find((c) => c.is_leading);

  // ---------- Final Submission (Review & Submit Step) ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (customers.length === 0) {
      setError("At least one customer is required.");
      scrollToField("customers");
      return;
    }
    if (customers.filter((c) => c.is_leading).length !== 1) {
      setError("Exactly one leading customer must be specified.");
      scrollToField("is_leading");
      return;
    }
    const payload: any = {
      booking_date: bookingDate,
      departure_date: departureDate,
      status: status,
      booking_type: bookingType,
      passengers_count: customers.length,
      customers: customers,
      supplier_id: null, // supplier assignment later
    };
    if (bookingType === "Flight") {
      payload.return_date = returnDate;
      payload.flight_booking = globalFlights;
      payload.total_issued_fare = totalIssuedFare;
    } else {
      payload.flight_booking = globalFlights; // you may adjust if non-flight uses different flight data
      payload.hotel_booking = hotels;
      payload.visa_booking = visas;
      payload.transport_booking = transport;
      payload.activities_booking = activities;
    }
    console.log("Payload:", payload);
    try {
      const response = await api.post("/api/bookings", payload);
      if (response.status === 201) {
        setSuccess("Booking created successfully!");
        // Optionally reset form fields here.
      } else {
        setError("Failed to create booking.");
      }
    } catch (err: any) {
      console.error("Error:", err.response?.data || err.message);
      setError("An error occurred while creating the booking.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ padding: 2 }}>
      {/* Top Bar Stepper */}
      <Stepper
        activeStep={step - 1}
        alternativeLabel
        connector={<ColorlibConnector />}
        sx={{ mb: 4 }}
      >
        {stepsToShow.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ---------- Step 1: Booking Details & Customers ---------- */}
      {step === 1 && (
        <Card sx={{ p: 2, mb: 2 }} id="booking-details">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Booking Details
          </Typography>
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
              />
            </Grid>
            {bookingType === "Flight" && (
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
                />
              </Grid>
            )}
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
                <Select
                  labelId="status-label"
                  name="status"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="booking-type-label">Booking Type</InputLabel>
                <Select
                  labelId="booking-type-label"
                  name="bookingType"
                  value={bookingType}
                  label="Booking Type"
                  onChange={(e) => setBookingType(e.target.value)}
                >
                  <MenuItem value="Flight">Flight</MenuItem>
                  <MenuItem value="Umrah">Umrah</MenuItem>
                  <MenuItem value="Holiday">Holiday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Customers
            </Typography>
            {customers.map((customer, index) => (
              <Box
                key={index}
                sx={{
                  border: "1px solid #ccc",
                  p: 2,
                  mb: 2,
                  position: "relative",
                }}
                id="customers"
              >
                <Typography variant="subtitle1">
                  Customer {index + 1}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Name"
                      value={customer.name}
                      onChange={(e) =>
                        handleCustomerChange(index, "name", e.target.value)
                      }
                      fullWidth
                      required
                      id="name"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Passport Number"
                      value={customer.passport_number}
                      onChange={(e) =>
                        handleCustomerChange(index, "passport_number", e.target.value)
                      }
                      fullWidth
                      required
                      id="passport_number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Passport Expiry"
                      type="date"
                      value={customer.passport_expiry}
                      onChange={(e) =>
                        handleCustomerChange(index, "passport_expiry", e.target.value)
                      }
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: getTomorrow() }}
                      required
                      variant="filled"
                      sx={{
                        "& .MuiInputBase-root": {
                          border: "1px solid #D5D9E2",
                          backgroundColor: "#fff",
                          borderRadius: "7px",
                        },
                        "& .MuiInputBase-root::before": { border: "none" },
                      }}
                      id="passport_expiry"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={countryList}
                      getOptionLabel={(option) => option.label}
                      value={
                        countryList.find(
                          (country) => country.label === customer.issuing_country
                        ) || null
                      }
                      onChange={(event, newValue) =>
                        handleCustomerChange(
                          index,
                          "issuing_country",
                          newValue ? newValue.label : ""
                        )
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Issuing Country" required id="issuing_country" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      value={customer.date_of_birth}
                      onChange={(e) =>
                        handleCustomerChange(index, "date_of_birth", e.target.value)
                      }
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      required
                      id="date_of_birth"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={customer.is_leading}
                          onChange={(e) =>
                            handleCustomerChange(index, "is_leading", e.target.checked)
                          }
                          id="is_leading"
                        />
                      }
                      label="Leading Customer"
                    />
                  </Grid>
                  {customer.is_leading && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Email"
                          value={customer.email || ""}
                          onChange={(e) =>
                            handleCustomerChange(index, "email", e.target.value)
                          }
                          fullWidth
                          required
                          id="email"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Address"
                          value={customer.address || ""}
                          onChange={(e) =>
                            handleCustomerChange(index, "address", e.target.value)
                          }
                          fullWidth
                          required
                          id="address"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Phone"
                          value={customer.phone || ""}
                          onChange={(e) =>
                            handleCustomerChange(index, "phone", e.target.value)
                          }
                          fullWidth
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Select
                                  value={customer.phoneCode || "+44"}
                                  onChange={(e) =>
                                    handleCustomerChange(index, "phoneCode", e.target.value)
                                  }
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
                          id="phone"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Alternate Phone"
                          value={customer.alternatePhone || ""}
                          onChange={(e) =>
                            handleCustomerChange(index, "alternatePhone", e.target.value)
                          }
                          fullWidth
                          id="alternatePhone"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
                {customers.length > 1 && (
                  <IconButton
                    onClick={() => deleteCustomer(index)}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button variant="contained" onClick={addCustomer}>
              Add Customer
            </Button>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button disabled variant="contained">
              Back
            </Button>
            <Button variant="contained" onClick={nextStep}>
              Next
            </Button>
          </Box>
        </Card>
      )}

      {/* ---------- Step 2: Flights Section ---------- */}
      {step === 2 && (
        <Card sx={{ p: 2, mb: 2 }} id="flights">
          <Typography variant="h6" sx={{ mb: 2 }}>Flights</Typography>
          {globalFlights.map((entry, entryIndex) => (
            <Box
              key={entryIndex}
              sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}
              id={`flight_entry_${entryIndex}`}
            >
              <Typography variant="subtitle2">
                Flight Entry {entryIndex + 1}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="PNR No"
                    value={entry.pnr}
                    onChange={(e) =>
                      handleGlobalFlightEntryChange(entryIndex, "pnr", e.target.value)
                    }
                    fullWidth
                    required
                    id={`pnr_${entryIndex}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="PNR Itinerary"
                    value={entry.itinerary}
                    onChange={(e) =>
                      handleGlobalFlightEntryChange(entryIndex, "itinerary", e.target.value)
                    }
                    fullWidth
                    required
                    id={`itinerary_${entryIndex}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={getAvailableCustomers(entryIndex)}
                    getOptionLabel={(option: Customer) => option.name || ""}
                    value={
                      entry.customerIndices
                        ? entry.customerIndices.map((i) => customers[i])
                        : []
                    }
                    onChange={(event, newValue) => {
                      const indices = newValue.map((cust) =>
                        customers.indexOf(cust)
                      );
                      handleGlobalFlightEntryChange(entryIndex, "customerIndices", indices);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Customers"
                        required
                        id={`customers_flight_${entryIndex}`}
                      />
                    )}
                    id={`autocomplete_customers_${entryIndex}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Selling Cost"
                    type="number"
                    value={entry.sellingCost}
                    onChange={(e) =>
                      handleGlobalFlightEntryChange(entryIndex, "sellingCost", e.target.value)
                    }
                    fullWidth
                    required
                    id={`sellingCost_${entryIndex}`}
                  />
                  {fieldErrors[`sellingCost_${entryIndex}`] && (
                    <Typography color="error" variant="caption">
                      {fieldErrors[`sellingCost_${entryIndex}`]}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Issued Fare"
                    type="number"
                    value={entry.issuedFare}
                    onChange={(e) =>
                      handleGlobalFlightEntryChange(entryIndex, "issuedFare", e.target.value)
                    }
                    fullWidth
                    required
                    id={`issuedFare_${entryIndex}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cost"
                    type="number"
                    value={entry.cost}
                    onChange={(e) =>
                      handleGlobalFlightEntryChange(entryIndex, "cost", e.target.value)
                    }
                    fullWidth
                    required
                    id={`cost_${entryIndex}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Remarks"
                    value={entry.remarks}
                    onChange={(e) =>
                      handleGlobalFlightEntryChange(entryIndex, "remarks", e.target.value)
                    }
                    fullWidth
                    id={`remarks_${entryIndex}`}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={entry.atol}
                        onChange={(e) =>
                          handleGlobalFlightEntryChange(entryIndex, "atol", e.target.checked)
                        }
                        id={`atol_${entryIndex}`}
                      />
                    }
                    label="ATOL"
                  />
                </Grid>
              </Grid>
              <IconButton
                onClick={() => deleteGlobalFlightEntry(entryIndex)}
                sx={{ position: "absolute", top: 8, right: 8 }}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addGlobalFlightEntry}>
            Add Flight Entry
          </Button>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              Total Issued Fare: {totalIssuedFare}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>
              Back
            </Button>
            <Button variant="contained" onClick={nextStep}>
              Next
            </Button>
          </Box>
        </Card>
      )}

      {/* ---------- Steps for Non-Flight Bookings ---------- */}
      {!isFlightOnly && (
        <>
          {/* Step 3: Hotels */}
          {step === 3 && (
            <Card sx={{ p: 2, mb: 2 }} id="hotels">
              <Typography variant="h6" sx={{ mb: 2 }}>Hotels</Typography>
              {customers.map((customer, index) => (
                <Box
                  key={index}
                  sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}
                  id={`hotel_customer_${index}`}
                >
                  <Typography variant="subtitle1">
                    {customer.name || `Customer ${index + 1}`}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hotels[index]?.required || false}
                        onChange={(e) => {
                          setHotels((prev) => ({
                            ...prev,
                            [index]: {
                              required: e.target.checked,
                              entries: prev[index]?.entries || [],
                            },
                          }));
                        }}
                      />
                    }
                    label="Hotel Required?"
                  />
                  {hotels[index]?.required && (
                    <Box sx={{ mt: 2 }}>
                      {(hotels[index]?.entries || []).map((entry, entryIndex) => (
                        <Box
                          key={entryIndex}
                          sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}
                          id={`hotel_entry_${index}_${entryIndex}`}
                        >
                          <Typography variant="subtitle2">
                            Hotel Entry {entryIndex + 1}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Hotel Name"
                                value={entry.hotelName}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "hotelName", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <InputLabel id={`meal-type-label-${index}-${entryIndex}`}>
                                  Meal Type
                                </InputLabel>
                                <Select
                                  labelId={`meal-type-label-${index}-${entryIndex}`}
                                  value={entry.mealType}
                                  label="Meal Type"
                                  onChange={(e) =>
                                    handleHotelEntryChange(index, entryIndex, "mealType", e.target.value)
                                  }
                                >
                                  <MenuItem value="Room Only">Room Only</MenuItem>
                                  <MenuItem value="Breakfast">Breakfast</MenuItem>
                                  <MenuItem value="Full board">Full board</MenuItem>
                                  <MenuItem value="Half board">Half board</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Room Allocation"
                                type="number"
                                value={entry.roomAllocation}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "roomAllocation", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <InputLabel id={`room-type-label-${index}-${entryIndex}`}>
                                  Room Type
                                </InputLabel>
                                <Select
                                  labelId={`room-type-label-${index}-${entryIndex}`}
                                  value={entry.roomType}
                                  label="Room Type"
                                  onChange={(e) =>
                                    handleHotelEntryChange(index, entryIndex, "roomType", e.target.value)
                                  }
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
                                <TextField
                                  label="Other Room Type"
                                  value={entry.roomViewOther || ""}
                                  onChange={(e) =>
                                    handleHotelEntryChange(index, entryIndex, "roomViewOther", e.target.value)
                                  }
                                  fullWidth
                                  required
                                />
                              </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <InputLabel id={`room-view-label-${index}-${entryIndex}`}>
                                  Room View
                                </InputLabel>
                                <Select
                                  labelId={`room-view-label-${index}-${entryIndex}`}
                                  value={entry.roomView}
                                  label="Room View"
                                  onChange={(e) =>
                                    handleHotelEntryChange(index, entryIndex, "roomView", e.target.value)
                                  }
                                >
                                  <MenuItem value="Full Kaba View">Full Kaba View</MenuItem>
                                  <MenuItem value="Partial Kaba View">Partial Kaba View</MenuItem>
                                  <MenuItem value="other">Other</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Remarks"
                                value={entry.remarks}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "remarks", e.target.value)
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Check-in Date"
                                type="date"
                                value={entry.checkinDate}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "checkinDate", e.target.value)
                                }
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: getTomorrow() }}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Expected Check-in Time"
                                type="time"
                                value={entry.checkinTime}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "checkinTime", e.target.value)
                                }
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Check-out Date"
                                type="date"
                                value={entry.checkoutDate}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "checkoutDate", e.target.value)
                                }
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: entry.checkinDate || getTomorrow() }}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Number of Nights"
                                type="number"
                                value={entry.nights}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "nights", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Selling Cost"
                                type="number"
                                value={entry.sellingCost}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "sellingCost", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Cost"
                                type="number"
                                value={entry.cost}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "cost", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Internal Cost"
                                type="number"
                                value={entry.internalCost}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "internalCost", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Supplier"
                                value={entry.supplier}
                                onChange={(e) =>
                                  handleHotelEntryChange(index, entryIndex, "supplier", e.target.value)
                                }
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                          <IconButton
                            onClick={() => deleteHotelEntry(index, entryIndex)}
                            sx={{ position: "absolute", top: 8, right: 8 }}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button variant="outlined" onClick={() => addHotelEntry(index)}>
                        Add Hotel Entry
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button variant="contained" onClick={prevStep}>
                  Back
                </Button>
                <Button variant="contained" onClick={nextStep}>
                  Next
                </Button>
              </Box>
            </Card>
          )}

          {/* Step 4: Visa Section */}
          {step === 4 && (
            <Card sx={{ p: 2, mb: 2 }} id="visa">
              <Typography variant="h6" sx={{ mb: 2 }}>Visa</Typography>
              {customers.map((customer, index) => (
                <Box
                  key={index}
                  sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}
                  id={`visa_customer_${index}`}
                >
                  <Typography variant="subtitle1">
                    {customer.name || `Customer ${index + 1}`}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visas[index]?.required || false}
                        onChange={(e) =>
                          setVisas((prev) => ({
                            ...prev,
                            [index]: {
                              required: e.target.checked,
                              entries: prev[index]?.entries || [],
                            },
                          }))
                        }
                      />
                    }
                    label="Visa Required?"
                  />
                  {visas[index]?.required && (
                    <Box sx={{ mt: 2 }}>
                      {(visas[index]?.entries || []).map((entry, entryIndex) => (
                        <Box
                          key={entryIndex}
                          sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}
                          id={`visa_entry_${index}_${entryIndex}`}
                        >
                          <Typography variant="subtitle2">
                            Visa Entry {entryIndex + 1}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth required>
                                <InputLabel id={`visa-type-label-${index}-${entryIndex}`}>
                                  Visa Type
                                </InputLabel>
                                <Select
                                  labelId={`visa-type-label-${index}-${entryIndex}`}
                                  value={entry.visaType}
                                  label="Visa Type"
                                  onChange={(e) =>
                                    handleVisaEntryChange(index, entryIndex, "visaType", e.target.value)
                                  }
                                >
                                  <MenuItem value="Umrah Visa">Umrah Visa</MenuItem>
                                  <MenuItem value="Tourist Visa">Tourist Visa</MenuItem>
                                  <MenuItem value="EVW Visa">EVW Visa</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            {entry.visaType === "EVW Visa" && (
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  label="Previous Nationality"
                                  value={entry.previousNationality || ""}
                                  onChange={(e) =>
                                    handleVisaEntryChange(index, entryIndex, "previousNationality", e.target.value)
                                  }
                                  fullWidth
                                  required
                                />
                              </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Airline Code"
                                value={entry.airlineCode}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "airlineCode", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Flight Code"
                                value={entry.flightCode}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "flightCode", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Selling Cost"
                                type="number"
                                value={entry.sellingCost}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "sellingCost", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Cost"
                                type="number"
                                value={entry.cost}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "cost", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Internal Cost"
                                type="number"
                                value={entry.internalCost}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "internalCost", e.target.value)
                                }
                                fullWidth
                                required
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Visa Status"
                                value={entry.visaStatus}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "visaStatus", e.target.value)
                                }
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Remarks"
                                value={entry.remarks}
                                onChange={(e) =>
                                  handleVisaEntryChange(index, entryIndex, "remarks", e.target.value)
                                }
                                fullWidth
                              />
                            </Grid>
                          </Grid>
                          <IconButton
                            onClick={() => deleteVisaEntry(index, entryIndex)}
                            sx={{ position: "absolute", top: 8, right: 8 }}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button variant="outlined" onClick={() => addVisaEntry(index)}>
                        Add Visa Entry
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                <Button variant="contained" onClick={prevStep}>
                  Back
                </Button>
                <Button variant="contained" onClick={nextStep}>
                  Next
                </Button>
              </Box>
            </Card>
          )}

          {/* Step 5: Transport (Leading Customer Only) */}
          {step === 5 && (
            <Card sx={{ p: 2, mb: 2 }} id="transport">
              <Typography variant="h6" sx={{ mb: 2 }}>
                Transport (Leading Customer Only)
              </Typography>
              {leadingCustomer ? (
                <Box sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    {leadingCustomer.name}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={transport?.required || false}
                        onChange={(e) => handleTransportToggle(e.target.checked)}
                      />
                    }
                    label="Transport Required?"
                  />
                  {transport?.required && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Vehicle Type"
                            value={transport?.vehicleType || ""}
                            onChange={(e) =>
                              handleTransportChange("vehicleType", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Pickup From"
                            value={transport?.pickupFrom || ""}
                            onChange={(e) =>
                              handleTransportChange("pickupFrom", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Pickup Time"
                            type="time"
                            value={transport?.pickupTime || ""}
                            onChange={(e) =>
                              handleTransportChange("pickupTime", e.target.value)
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Dropoff"
                            value={transport?.dropoff || ""}
                            onChange={(e) =>
                              handleTransportChange("dropoff", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Selling Cost"
                            type="number"
                            value={transport?.sellingCost || ""}
                            onChange={(e) =>
                              handleTransportChange("sellingCost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Cost"
                            type="number"
                            value={transport?.cost || ""}
                            onChange={(e) =>
                              handleTransportChange("cost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Internal Cost"
                            type="number"
                            value={transport?.internalCost || ""}
                            onChange={(e) =>
                              handleTransportChange("internalCost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Supplier"
                            value={transport?.supplier || ""}
                            onChange={(e) =>
                              handleTransportChange("supplier", e.target.value)
                            }
                            fullWidth
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
                <Button variant="contained" onClick={prevStep}>
                  Back
                </Button>
                <Button variant="contained" onClick={nextStep}>
                  Next
                </Button>
              </Box>
            </Card>
          )}

          {/* Step 6: Activities (formerly SightSeeing) (Leading Customer Only) */}
          {step === 6 && (
            <Card sx={{ p: 2, mb: 2 }} id="activities">
              <Typography variant="h6" sx={{ mb: 2 }}>
                Activities (Leading Customer Only)
              </Typography>
              {leadingCustomer ? (
                <Box sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    {leadingCustomer.name}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={activities?.required || false}
                        onChange={(e) => handleActivitiesToggle(e.target.checked)}
                      />
                    }
                    label="Activities Required?"
                  />
                  {activities?.required && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Activity Name"
                            value={activities?.sightName || ""}
                            onChange={(e) =>
                              handleActivitiesChange("sightName", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Date and Time"
                            type="datetime-local"
                            value={activities?.datetime || ""}
                            onChange={(e) =>
                              handleActivitiesChange("datetime", e.target.value)
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <InputLabel id="guide-label">Guide</InputLabel>
                            <Select
                              labelId="guide-label"
                              value={activities?.guide || ""}
                              label="Guide"
                              onChange={(e) =>
                                handleActivitiesChange("guide", e.target.value)
                              }
                            >
                              <MenuItem value="Yes">Yes</MenuItem>
                              <MenuItem value="No">No</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        {activities?.guide === "Yes" && (
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Guide Cost"
                              type="number"
                              value={activities?.guideCost || ""}
                              onChange={(e) =>
                                handleActivitiesChange("guideCost", e.target.value)
                              }
                              fullWidth
                              required
                            />
                          </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Selling Cost"
                            type="number"
                            value={activities?.sellingCost || ""}
                            onChange={(e) =>
                              handleActivitiesChange("sellingCost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Cost"
                            type="number"
                            value={activities?.cost || ""}
                            onChange={(e) =>
                              handleActivitiesChange("cost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Internal Cost"
                            type="number"
                            value={activities?.internalCost || ""}
                            onChange={(e) =>
                              handleActivitiesChange("internalCost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Supplier"
                            value={activities?.supplier || ""}
                            onChange={(e) =>
                              handleActivitiesChange("supplier", e.target.value)
                            }
                            fullWidth
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
                <Button variant="contained" onClick={prevStep}>
                  Back
                </Button>
                <Button variant="contained" onClick={nextStep}>
                  Next
                </Button>
              </Box>
            </Card>
          )}
        </>
      )}

      {/* ---------- Final Step: Review & Submit ---------- */}
      {((isFlightOnly && step === 3) || (!isFlightOnly && step === 7)) && (
        <Card sx={{ p: 2, mb: 2 }} id="review">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Review & Submit
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Booking Date: {bookingDate}
            </Typography>
            <Typography variant="subtitle1">
              Departure Date: {departureDate}
            </Typography>
            {isFlightOnly && (
              <Typography variant="subtitle1">
                Return Date: {returnDate}
              </Typography>
            )}
            <Typography variant="subtitle1">
              Passengers Count: {customers.length}
            </Typography>
            <Typography variant="subtitle1">
              Status: {status}
            </Typography>
            <Typography variant="subtitle1">
              Booking Type: {bookingType}
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Customers:</Typography>
            {customers.map((cust, i) => (
              <Box key={i} sx={{ ml: 2 }}>
                <Typography variant="body2">
                  {cust.name} - {cust.passport_number}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Flights:</Typography>
            {globalFlights.map((flight, i) => (
              <Box key={i} sx={{ ml: 2 }}>
                <Typography variant="body2">
                  PNR: {flight.pnr} | Itinerary: {flight.itinerary} | Issued Fare: {flight.issuedFare} | Selling Cost: {flight.sellingCost}
                </Typography>
                <Typography variant="body2">
                  Selected Customers:{" "}
                  {flight.customerIndices
                    .map((idx) => customers[idx]?.name)
                    .join(", ")}
                </Typography>
              </Box>
            ))}
            <Typography variant="body2">
              Total Issued Fare: {totalIssuedFare}
            </Typography>
          </Box>
          {!isFlightOnly && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Hotels:</Typography>
                {Object.entries(hotels).map(([custIndex, hotelData]) => (
                  <Box key={custIndex} sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      For Customer: {customers[Number(custIndex)]?.name}
                    </Typography>
                    {hotelData.entries.map((entry, i) => (
                      <Typography key={i} variant="body2">
                        Hotel: {entry.hotelName} | Selling Cost: {entry.sellingCost}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Visa:</Typography>
                {Object.entries(visas).map(([custIndex, visaData]) => (
                  <Box key={custIndex} sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      For Customer: {customers[Number(custIndex)]?.name}
                    </Typography>
                    {visaData.entries.map((entry, i) => (
                      <Typography key={i} variant="body2">
                        Visa: {entry.visaType} | Selling Cost: {entry.sellingCost}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Transport:</Typography>
                {transport && (
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      For Leading Customer: {leadingCustomer?.name}
                    </Typography>
                    <Typography variant="body2">
                      Vehicle: {transport.vehicleType} | Selling Cost: {transport.sellingCost}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Activities:</Typography>
                {activities && (
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      For Leading Customer: {leadingCustomer?.name}
                    </Typography>
                    <Typography variant="body2">
                      Activity: {activities.sightName} | Selling Cost: {activities.sellingCost}
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>
              Back
            </Button>
            <Button variant="contained" type="submit">
              Submit Booking
            </Button>
          </Box>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
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
