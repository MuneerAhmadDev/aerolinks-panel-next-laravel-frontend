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


// Helpers to get dates in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split("T")[0];
const getTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};
// Custom connector for Stepper
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

const steps = [
  "Booking Details & Customers",
  "Flights",
  "Hotels",
  "Visa",
  "Transport",
  "SightSeeing",
];

const countryList = [
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "PK", label: "Pakistan" },
  { code: "CA", label: "Canada" },
  // ... add more countries as needed
];

const phoneCodes = [
  { code: "+44", label: "UK (+44)" },
  { code: "+1", label: "US (+1)" },
  { code: "+92", label: "Pakistan (+92)" },
  // ... add more codes as needed
];

const getSixMonthsLater = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split("T")[0];
};

const AddBooking: React.FC = () => {
  // Step state
  const [step, setStep] = useState<number>(1);

  // Booking details state (Step 1)
  // const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingDate] = useState<string>(getToday());
  const [departureDate, setDepartureDate] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [bookingType, setBookingType] = useState<string>("Umrah"); // new field

  // Customers state (Step 1)
  interface Customer {
    name: string;
    passport_number: string;
    passport_expiry: string;
    issuing_country: string;
    date_of_birth: string;
    is_leading: boolean;
    email?: string;
    address?: string;
    // Single phone field with integrated country code in the adornment.
    phone?: string;
    phoneCode?: string;
  }
  const [customers, setCustomers] = useState<Customer[]>([]);
  // For searchable existing customers
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);

  // Supplier state (searchable)
  const [supplier, setSupplier] = useState<any>(null);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);

  // On mount, if no customer exists, add one and fetch customer & supplier options
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
        },
      ]);
    }
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/api/customers");
        if (response.data) {
          setCustomerOptions(response.data);
        }
      } catch (error) {
        console.error("Error fetching customers", error);
      }
    };
    const fetchSuppliers = async () => {
      try {
        const response = await api.get("/api/suppliers");
        if (response.data) {
          setSupplierOptions(response.data);
        }
      } catch (error) {
        console.error("Error fetching suppliers", error);
      }
    };
    fetchCustomers();
    fetchSuppliers();
  }, [customers]);

  // Flights state per customer index (Step 2)
  interface FlightEntry {
    pnr: string;
    itinerary: string;
    supplier: string;
    issuedFare: number;
    cost: number;
    remarks: string;
    atol: boolean;
  }
  type FlightData = {
    required: boolean;
    entries: FlightEntry[];
  };
  const [flights, setFlights] = useState<{ [key: number]: FlightData }>({});

  // Hotels state per customer index (Step 3)
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
    supplier: string;
  }
  type HotelData = {
    required: boolean;
    entries: HotelEntry[];
  };
  const [hotels, setHotels] = useState<{ [key: number]: HotelData }>({});

  // Visa state per customer index (Step 4)
  interface VisaEntry {
    visaType: string;
    previousNationality?: string;
    airlineCode: string;
    flightCode: string;
    cost: number;
    internalCost: number;
    visaStatus: string;
    remarks: string;
  }
  type VisaData = {
    required: boolean;
    entries: VisaEntry[];
  };
  const [visas, setVisas] = useState<{ [key: number]: VisaData }>({});

  // Transport (only for leading customer, Step 5)
  interface TransportData {
    required: boolean;
    vehicleType: string;
    pickupFrom: string;
    pickupTime: string;
    dropoff: string;
    cost: number;
    internalCost: number;
    supplier: string;
  }
  const [transport, setTransport] = useState<TransportData | null>(null);

  // SightSeeing (only for leading customer, Step 6)
  interface SightseeingData {
    required: boolean;
    sightName: string;
    datetime: string;
    guide: string; // "Yes" or "No"
    guideCost?: number;
    cost: number;
    internalCost: number;
    supplier: string;
  }
  const [sightseeing, setSightseeing] = useState<SightseeingData | null>(null);

  // Error & Success States
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ----- Navigation Functions -----
  const nextStep = () => {
    // Validate Step 1: Booking Details & Customers
    if (step === 1) {
      if (!bookingDate || !departureDate) {
        setError("Please fill in all booking details.");
        return;
      }
      if (customers.length === 0) {
        setError("Please add at least one customer.");
        return;
      }
      if (customers.filter((c) => c.is_leading).length !== 1) {
        setError("Exactly one leading customer must be specified.");
        return;
      }
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  // ----- Handlers for Booking Details (Step 1) -----
  // const handleBookingDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   switch (name) {
  //     case "bookingDate":
  //       setBookingDate(value);
  //       break;
  //     case "departureDate":
  //       setDepartureDate(value);
  //       break;
  //     default:
  //       break;
  //   }
  // };


  // Handlers for Booking Details
  const handleBookingDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "departureDate") {
      setDepartureDate(value);
    }
  };

  // ----- Customers Handlers (Step 1) -----
  const handleCustomerChange = (index: number, field: string, value: any) => {
    const updated = [...customers];
    updated[index] = { ...updated[index], [field]: value };
    // When marking a customer as leading, unmark all others.
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
      },
    ]);
  };

  const deleteCustomer = (index: number) => {
    const updated = [...customers];
    updated.splice(index, 1);
    // If no customer is marked as leading, mark the first one as leading.
    if (updated.filter((c) => c.is_leading).length === 0 && updated.length > 0) {
      updated[0].is_leading = true;
    }
    setCustomers(updated);
  };

  // ----- Flights Handlers (Step 2) -----
  const handleFlightToggle = (index: number, required: boolean) => {
    setFlights((prev) => ({
      ...prev,
      [index]: {
        required,
        entries: prev[index]?.entries || [],
      },
    }));
  };

  const addFlightEntry = (customerIndex: number) => {
    const newEntry: FlightEntry = {
      pnr: "",
      itinerary: "",
      supplier: "",
      issuedFare: 0,
      cost: 0,
      remarks: "",
      atol: false,
    };
    setFlights((prev) => ({
      ...prev,
      [customerIndex]: {
        required: true,
        entries: [...(prev[customerIndex]?.entries || []), newEntry],
      },
    }));
  };

  const handleFlightEntryChange = (
    customerIndex: number,
    entryIndex: number,
    field: string,
    value: any
  ) => {
    setFlights((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.map((entry, i) =>
        i === entryIndex ? { ...entry, [field]: value } : entry
      );
      return {
        ...prev,
        [customerIndex]: { ...customerData, entries: updatedEntries },
      };
    });
  };

  const deleteFlightEntry = (customerIndex: number, entryIndex: number) => {
    setFlights((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.filter((_, i) => i !== entryIndex);
      return {
        ...prev,
        [customerIndex]: { ...customerData, entries: updatedEntries },
      };
    });
  };

  // ----- Hotels Handlers (Step 3) -----
  const handleHotelToggle = (index: number, required: boolean) => {
    setHotels((prev) => ({
      ...prev,
      [index]: {
        required,
        entries: prev[index]?.entries || [],
      },
    }));
  };

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
      return {
        ...prev,
        [customerIndex]: { ...customerData, entries: updatedEntries },
      };
    });
  };

  const deleteHotelEntry = (customerIndex: number, entryIndex: number) => {
    setHotels((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.filter((_, i) => i !== entryIndex);
      return {
        ...prev,
        [customerIndex]: { ...customerData, entries: updatedEntries },
      };
    });
  };

  // ----- Visa Handlers (Step 4) -----
  const handleVisaToggle = (index: number, required: boolean) => {
    setVisas((prev) => ({
      ...prev,
      [index]: {
        required,
        entries: prev[index]?.entries || [],
      },
    }));
  };

  const addVisaEntry = (customerIndex: number) => {
    const newEntry: VisaEntry = {
      visaType: "",
      airlineCode: "",
      flightCode: "",
      cost: 0,
      internalCost: 0,
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
      return {
        ...prev,
        [customerIndex]: { ...customerData, entries: updatedEntries },
      };
    });
  };

  const deleteVisaEntry = (customerIndex: number, entryIndex: number) => {
    setVisas((prev) => {
      const customerData = prev[customerIndex];
      if (!customerData) return prev;
      const updatedEntries = customerData.entries.filter((_, i) => i !== entryIndex);
      return {
        ...prev,
        [customerIndex]: { ...customerData, entries: updatedEntries },
      };
    });
  };

  // ----- Transport & SightSeeing Handlers (Steps 5 & 6; Leading Customer Only) -----
  const handleTransportToggle = (required: boolean) => {
    setTransport((prev) => ({ ...prev, required } as TransportData));
  };
  const handleTransportChange = (field: string, value: any) => {
    setTransport((prev) => ({ ...prev, [field]: value } as TransportData));
  };

  const handleSightseeingToggle = (required: boolean) => {
    setSightseeing((prev) => ({ ...prev, required } as SightseeingData));
  };
  const handleSightseeingChange = (field: string, value: any) => {
    setSightseeing((prev) => ({ ...prev, [field]: value } as SightseeingData));
  };

  // Compute total issued fare from all flight entries (for summary)
  const totalIssuedFare = Object.values(flights).reduce((sum, flightData) => {
    if (flightData && flightData.entries) {
      return sum + flightData.entries.reduce((s, entry) => s + Number(entry.issuedFare || 0), 0);
    }
    return sum;
  }, 0);

  // Get leading customer (if any)
  const leadingCustomer = customers.find((c) => c.is_leading);

  // ----- Final Submission (Step 6) -----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (customers.length === 0) {
      setError("At least one customer is required.");
      return;
    }
    if (customers.filter((c) => c.is_leading).length !== 1) {
      setError("Exactly one leading customer must be specified.");
      return;
    }

    const payload = {
      booking_date: bookingDate,
      departure_date: departureDate,
      // Passengers count is now automatically set as total number of customers.
      passengers_count: customers.length,
      status: status,
      booking_type: bookingType,
      customers: customers,
      flight_booking: flights,
      hotel_booking: hotels,
      visa_booking: visas,
      transport_booking: transport,
      sightseeing_booking: sightseeing,
      total_issued_fare: totalIssuedFare,
      supplier_id: supplier ? supplier.id : null,
    };

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
      <Stepper activeStep={step - 1} alternativeLabel connector={<ColorlibConnector />} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: Booking Details & Customers */}
      {step === 1 && (
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Booking Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {/* <TextField
                label="Booking Date"
                type="date"
                name="bookingDate"
                value={bookingDate}
                onChange={handleBookingDetailChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              /> */}
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
              />
            </Grid>
            {/* Passengers Count is auto-computed */}
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
                  <MenuItem value="Umrah">Umrah</MenuItem>
                  <MenuItem value="Holiday">Holiday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Customers</Typography>
            {customers.map((customer, index) => (
              <Box key={index} sx={{ border: "1px solid #ccc", p: 2, mb: 2, position: "relative" }}>
                <Typography variant="subtitle1">Customer {index + 1}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Name"
                      value={customer.name}
                      onChange={(e) => handleCustomerChange(index, "name", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Passport Number"
                      value={customer.passport_number}
                      onChange={(e) => handleCustomerChange(index, "passport_number", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* <TextField
                      label="Passport Expiry"
                      type="date"
                      value={customer.passport_expiry}
                      onChange={(e) => handleCustomerChange(index, "passport_expiry", e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      required
                    /> */}
                    <TextField
                      label="Passport Expiry"
                      type="date"
                      value={customer.passport_expiry}
                      onChange={(e) => handleCustomerChange(index, "passport_expiry", e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: getTomorrow() }}
                      required
                      variant="filled"
                      sx={{
                        "& .MuiInputBase-root": { border: "1px solid #D5D9E2", backgroundColor: "#fff", borderRadius: "7px" },
                        "& .MuiInputBase-root::before": { border: "none" },
                      }}
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
                        handleCustomerChange(index, "issuing_country", newValue ? newValue.label : "")
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Issuing Country" required />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      value={customer.date_of_birth}
                      onChange={(e) => handleCustomerChange(index, "date_of_birth", e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={customer.is_leading}
                          onChange={(e) => handleCustomerChange(index, "is_leading", e.target.checked)}
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
                          onChange={(e) => handleCustomerChange(index, "email", e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Address"
                          value={customer.address || ""}
                          onChange={(e) => handleCustomerChange(index, "address", e.target.value)}
                          fullWidth
                          required
                        />
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

      {/* Step 2: Flights Section */}
      {step === 2 && (
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Flights</Typography>
          {customers.map((customer, index) => (
            <Box key={index} sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                {customer.name || `Customer ${index + 1}`}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={flights[index]?.required || false}
                    onChange={(e) => handleFlightToggle(index, e.target.checked)}
                  />
                }
                label="Flight Required?"
              />
              {flights[index]?.required && (
                <Box sx={{ mt: 2 }}>
                  {(flights[index]?.entries || []).map((entry, entryIndex) => (
                    <Box
                      key={entryIndex}
                      sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}
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
                              handleFlightEntryChange(index, entryIndex, "pnr", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="PNR Itinerary"
                            value={entry.itinerary}
                            onChange={(e) =>
                              handleFlightEntryChange(index, entryIndex, "itinerary", e.target.value)
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
                              handleFlightEntryChange(index, entryIndex, "supplier", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Issued Fare"
                            type="number"
                            value={entry.issuedFare}
                            onChange={(e) =>
                              handleFlightEntryChange(index, entryIndex, "issuedFare", e.target.value)
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
                              handleFlightEntryChange(index, entryIndex, "cost", e.target.value)
                            }
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Remarks"
                            value={entry.remarks}
                            onChange={(e) =>
                              handleFlightEntryChange(index, entryIndex, "remarks", e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={entry.atol}
                                onChange={(e) =>
                                  handleFlightEntryChange(index, entryIndex, "atol", e.target.checked)
                                }
                              />
                            }
                            label="ATOL"
                          />
                        </Grid>
                      </Grid>
                      <IconButton
                        onClick={() => deleteFlightEntry(index, entryIndex)}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" onClick={() => addFlightEntry(index)}>
                    Add Flight Entry
                  </Button>
                </Box>
              )}
            </Box>
          ))}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Total Issued Fare: {totalIssuedFare}</Typography>
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

      {/* Step 3: Hotels Section */}
      {step === 3 && (
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Hotels</Typography>
          {customers.map((customer, index) => (
            <Box key={index} sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                {customer.name || `Customer ${index + 1}`}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hotels[index]?.required || false}
                    onChange={(e) => handleHotelToggle(index, e.target.checked)}
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
                          {/* <TextField
                            label="Check-in Date"
                            type="date"
                            value={entry.checkinDate}
                            onChange={(e) =>
                              handleHotelEntryChange(index, entryIndex, "checkinDate", e.target.value)
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                          /> */}
                          <TextField
                            label="Check-in Date"
                            type="date"
                            value={entry.checkinDate}
                            onChange={(e) => handleHotelEntryChange(index, entryIndex, "checkinDate", e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: getTomorrow() }}
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
                          {/* <TextField
                            label="Check-out Date"
                            type="date"
                            value={entry.checkoutDate}
                            onChange={(e) =>
                              handleHotelEntryChange(index, entryIndex, "checkoutDate", e.target.value)
                            }
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                          /> */}
                          <TextField
                            label="Check-out Date"
                            type="date"
                            value={entry.checkoutDate}
                            onChange={(e) => handleHotelEntryChange(index, entryIndex, "checkoutDate", e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: entry.checkinDate ? entry.checkinDate : getTomorrow() }}
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
                            required
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
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Visa</Typography>
          {customers.map((customer, index) => (
            <Box key={index} sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                {customer.name || `Customer ${index + 1}`}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visas[index]?.required || false}
                    onChange={(e) => handleVisaToggle(index, e.target.checked)}
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

      {/* Step 5: Transport Section (Leading Customer Only) */}
      {step === 5 && (
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Transport (Leading Customer Only)</Typography>
          {leadingCustomer ? (
            <Box sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{leadingCustomer.name}</Typography>
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
                        onChange={(e) => handleTransportChange("vehicleType", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Pickup From"
                        value={transport?.pickupFrom || ""}
                        onChange={(e) => handleTransportChange("pickupFrom", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Pickup Time"
                        type="time"
                        value={transport?.pickupTime || ""}
                        onChange={(e) => handleTransportChange("pickupTime", e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Dropoff"
                        value={transport?.dropoff || ""}
                        onChange={(e) => handleTransportChange("dropoff", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Cost"
                        type="number"
                        value={transport?.cost || ""}
                        onChange={(e) => handleTransportChange("cost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Internal Cost"
                        type="number"
                        value={transport?.internalCost || ""}
                        onChange={(e) => handleTransportChange("internalCost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Supplier"
                        value={transport?.supplier || ""}
                        onChange={(e) => handleTransportChange("supplier", e.target.value)}
                        fullWidth
                        required
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

      {/* Step 6: SightSeeing Section (Leading Customer Only) */}
      {step === 6 && (
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>SightSeeing (Leading Customer Only)</Typography>
          {leadingCustomer ? (
            <Box sx={{ border: "1px solid #ccc", p: 2, mb: 2 }}>
              <Typography variant="subtitle1">{leadingCustomer.name}</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sightseeing?.required || false}
                    onChange={(e) => handleSightseeingToggle(e.target.checked)}
                  />
                }
                label="SightSeeing Required?"
              />
              {sightseeing?.required && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Sight Name"
                        value={sightseeing?.sightName || ""}
                        onChange={(e) => handleSightseeingChange("sightName", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Date and Time"
                        type="datetime-local"
                        value={sightseeing?.datetime || ""}
                        onChange={(e) => handleSightseeingChange("datetime", e.target.value)}
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
                          value={sightseeing?.guide || ""}
                          label="Guide"
                          onChange={(e) => handleSightseeingChange("guide", e.target.value)}
                        >
                          <MenuItem value="Yes">Yes</MenuItem>
                          <MenuItem value="No">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {sightseeing?.guide === "Yes" && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Guide Cost"
                          type="number"
                          value={sightseeing?.guideCost || ""}
                          onChange={(e) => handleSightseeingChange("guideCost", e.target.value)}
                          fullWidth
                          required
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Cost"
                        type="number"
                        value={sightseeing?.cost || ""}
                        onChange={(e) => handleSightseeingChange("cost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Internal Cost"
                        type="number"
                        value={sightseeing?.internalCost || ""}
                        onChange={(e) => handleSightseeingChange("internalCost", e.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Supplier"
                        value={sightseeing?.supplier || ""}
                        onChange={(e) => handleSightseeingChange("supplier", e.target.value)}
                        fullWidth
                        required
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