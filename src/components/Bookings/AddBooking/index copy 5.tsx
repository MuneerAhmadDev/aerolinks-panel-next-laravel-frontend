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
// import ;

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
// Payment is added as the final step.
const flightSteps = ["Booking Details & Customers", "Flights", "Review", "Payment"];
const otherSteps = [
  "Booking Details & Customers",
  "Flights",
  "Hotels",
  "Visa",
  "Transport",
  "Activities",
  "Review",
  "Payment",
];

// ---------- Interfaces ----------

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
}

interface FlightEntry {
  pnr: string;
  itinerary: string;
  customerIndices: number[];
  issuedFare: number; // Issued Fare is now added.
  remarks: string;
  atol: boolean;
  globalCost: boolean;
  globalCostData?: { cost: number; internalCost: number }; // Removed sellingCost here.
  costs: { [customerIndex: number]: { cost: number; internalCost: number } };
}
type FlightDataGlobal = FlightEntry[];

interface HotelEntry {
  internalCost: unknown;
  cost: unknown;
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
  globalCostData?: { cost: number; internalCost: number };
  costs: { [customerIndex: number]: { cost: number; internalCost: number } };
  supplier_id?: number;
  // Selling Cost is removed.
}
type HotelData = HotelEntry[];

// interface VisaEntry {
//   customerIndices: number[];
//   globalCost: boolean;
//   globalCostData?: { cost: number; internalCost: number };
//   costs: { [customerIndex: number]: { cost: number; internalCost: number } };
//   visa_type: string;
//   previous_nationality?: string;
//   validity?: string;
//   airlineCode: string;
//   flightCode: string;
//   visaStatus: string;
//   remarks: string;
//   supplier: { id: number; name: string; email: string } | null;
// }
interface VisaEntry {
  customerIndices: number[]; // IDs of customers associated with this visa booking
  globalCost: boolean;
  globalCostData: {
    cost: number;
    internalCost: number;
  };
  // A mapping of customerIndex to cost details for individual customers
  costs: { [customerIndex: number]: { cost: number; internalCost: number } };
  visa_type: string;
  previous_nationality: string;
  validity: string;
  airlineCode: string;
  flightCode: string;
  visaStatus: string;
  remarks: string; // All declarations of 'remarks' are required and of type string.
  supplier: Supplier | null;
}
type VisaData = VisaEntry[];

// For Transport, sellingCost is removed.
interface TransportData {
  vehicleType: string;
  pickupFrom: string;
  pickupTime: string;
  dropoff: string;
  cost: number;
  internalCost: number;
  supplier_id?: number;
}
type TransportDataArray = TransportData[];

// For Activities, sellingCost is removed.
interface ActivitiesData {
  pickup_location: string;
  activity_name: string;
  datetime: string;
  guide: string;
  guideCost?: number;
  cost: number;
  internalCost: number;
  supplier_id?: number;
}
type ActivitiesDataArray = ActivitiesData[];

interface Supplier {
  id: number;
  name: string;
  email: string;
}

interface PaymentEntry {
  amount: number;
  payment_date: string;
  payment_method: string;
}

// ---------- Main Component ----------
const AddBooking: React.FC = () => {
  // Step state
  const [step, setStep] = useState<number>(1);

  // Booking details (Step 1)
  const [bookingDate] = useState<string>(getToday());
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [bookingType, setBookingType] = useState<string>("Flight"); // "Flight", "Umrah", "Holiday"
  const [sellingCost, setSellingCost] = useState<string>(""); // Booking-level selling cost

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Service entries
  const [globalFlights, setGlobalFlights] = useState<FlightDataGlobal>([]);
  const [hotelEntries, setHotelEntries] = useState<HotelData>([]);
  // const [visas, setVisas] = useState<VisaData>([]);
  const [visas, setVisas] = useState<VisaEntry[]>([]);

  const [transportEntries, setTransportEntries] = useState<TransportDataArray>([]);
  const [activitiesEntries, setActivitiesEntries] = useState<ActivitiesDataArray>([]);

  // Payment entries
  const [payments, setPayments] = useState<PaymentEntry[]>([]);

  // Errors and success messages
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFlightOnly = bookingType === "Flight";
  const stepsToShow = isFlightOnly ? flightSteps : otherSteps;

  // ---------- Fetch Existing Customers and Suppliers ----------
  useEffect(() => {
    api.get("/api/customers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setExistingCustomers(data);
      })
      .catch((err) => console.error("Error fetching customers", err));

    api.get("/api/suppliers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setSuppliers(data);
      })
      .catch((err) => console.error("Error fetching suppliers", err));
  }, []);

  // Ensure at least one customer exists
  useEffect(() => {
    if (customers.length === 0) {
      setCustomers([{
        id: 1,
        name: "",
        passport_number: "",
        passport_expiry: "",
        issuing_country: "",
        date_of_birth: "",
        is_leading: true,
        phoneCode: "+44",
        phone: "",
        alternate_phone: "",
      }]);
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
    if (!sellingCost) {
      setFieldErrors((prev) => ({ ...prev, sellingCost: "Selling Cost is required." }));
      scrollToField("sellingCost");
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

  const handleSellingCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSellingCost(e.target.value);
    setFieldErrors((prev) => ({ ...prev, sellingCost: "" }));
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
          alternate_phone: "",
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
      globalCostData: { cost: 0, internalCost: 0 },
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

  const updateGlobalCostForEntry = (entryIndex: number, field: "cost" | "internalCost", value: any) => {
    setGlobalFlights((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newGlobalCostData = entry.globalCostData || { cost: 0, internalCost: 0 };
          newGlobalCostData[field] = Number(value);
          return { ...entry, globalCostData: newGlobalCostData };
        }
        return entry;
      })
    );
  };

  const updateFlightCostForCustomer = (entryIndex: number, customerIndex: number, field: "cost" | "internalCost", value: any) => {
    setGlobalFlights((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newCosts = { ...entry.costs };
          newCosts[customerIndex] = {
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
      globalCostData: { cost: 0, internalCost: 0 },
      costs: {},
      supplier_id: undefined,
      internalCost: undefined,
      cost: undefined
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
      globalCostData: { cost: 0, internalCost: 0 },
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

  const updateGlobalCostForVisa = (entryIndex: number, field: "cost" | "internalCost", value: any) => {
    setVisas((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newGlobalCostData = entry.globalCostData || { cost: 0, internalCost: 0 };
          newGlobalCostData[field] = Number(value);
          return { ...entry, globalCostData: newGlobalCostData };
        }
        return entry;
      })
    );
  };

  const updateVisaCostForCustomer = (entryIndex: number, customerIndex: number, field: "cost" | "internalCost", value: any) => {
    setVisas((prev) =>
      prev.map((entry, i) => {
        if (i === entryIndex) {
          const newCosts = { ...entry.costs };
          newCosts[customerIndex] = {
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

  // ---------- Transport Handlers (Step 5) - Multiple Entries ----------
  const addTransportEntry = () => {
    const newEntry: TransportData = {
      vehicleType: "",
      pickupFrom: "",
      pickupTime: "",
      dropoff: "",
      cost: 0,
      internalCost: 0,
      supplier_id: undefined,
    };
    setTransportEntries([...transportEntries, newEntry]);
  };

  const handleTransportEntryChange = (index: number, field: string, value: any) => {
    const updated = transportEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setTransportEntries(updated);
  };

  const deleteTransportEntry = (index: number) => {
    setTransportEntries(transportEntries.filter((_, i) => i !== index));
  };

  // ---------- Activities Handlers (Step 6) - Multiple Entries ----------
  const addActivityEntry = () => {
    const newEntry: ActivitiesData = {
      activity_name: "",
      datetime: "",
      guide: "",
      guideCost: 0,
      cost: 0,
      internalCost: 0,
      supplier_id: undefined,
      pickup_location: ""
    };
    setActivitiesEntries([...activitiesEntries, newEntry]);
  };

  const handleActivityEntryChange = (index: number, field: string, value: any) => {
    const updated = activitiesEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setActivitiesEntries(updated);
  };

  const deleteActivityEntry = (index: number) => {
    setActivitiesEntries(activitiesEntries.filter((_, i) => i !== index));
  };

  // ---------- Payment Handlers (Step 7) ----------
  const addPaymentEntry = () => {
    setPayments([...payments, { amount: 0, payment_date: "", payment_method: "" }]);
  };

  const handlePaymentChange = (index: number, field: string, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  const deletePaymentEntry = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const totalPayment = payments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  // Check if payment is overdue: if departure is less than one month away and totalPayment < sellingCost.
  const isPaymentOverdue = () => {
    if (!departureDate) return false;
    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);
    const sellCost = Number(sellingCost || 0);
    return new Date(departureDate) < oneMonthAhead && totalPayment < sellCost;
  };


  const transformHotelEntry = (entry: HotelEntry): any => ({
    hotel_name: entry.hotelName,
    hotel_address: entry.hotelAddress,
    meal_type: entry.mealType,
    room_allocation: entry.roomAllocation,
    room_type: entry.roomType,
    room_view: entry.roomView,
    room_view_other: entry.roomViewOther,
    remarks: entry.remarks,
    check_in_date: entry.checkinDate,
    check_in_time: entry.checkinTime,
    check_out_date: entry.checkoutDate,
    nights: entry.nights,
    cost: entry.cost,
    internal_cost: entry.internalCost,
    supplier_id: entry.supplier_id,
  });

  // const transformVisaEntery = (entery: VisaEntry): any=>({

  // });
  
  // interface VisaEntry {
  //   customerIndices: any;
  //   visa_type: string;
  //   previous_nationality?: string;
  //   validity?: string;
  //   cost?: number;
  //   internal_cost?: number;
  //   airline_code: string;
  //   flight_code: string;
  //   visa_status: string;
  //   remarks?: string;
  //   customers: number[]; // array of customer IDs
  // }
  // const transformVisaEntry = (entry: VisaEntry): any => ({
  //   visa_type: entry.visa_type,
  //   previous_nationality: entry.previous_nationality,
  //   validity: entry.validity,
  //   cost: entry.cost,
  //   internal_cost: entry.internal_cost,
  //   airline_code: entry.airline_code,
  //   flight_code: entry.flight_code,
  //   visa_status: entry.visa_status,
  //   remarks: entry.remarks,
  //   customers: entry.customers,
  // });

  const transformVisaEntry = (entry: VisaEntry): any => ({
    visa_type: entry.visa_type, // already in snake_case
    previous_nationality: entry.previous_nationality,
    validity: entry.validity,
    // cost: entry.cost,
    // internal_cost: entry.internal_cost,
    // Use globalCostData values if globalCost is true; otherwise, fallback to 0 (or adjust as needed)
    cost: entry.globalCost ? entry.globalCostData.cost : 0,
    internal_cost: entry.globalCost ? entry.globalCostData.internalCost : 0,
    airline_code: entry.airlineCode, // convert from camelCase to snake_case
    flight_code: entry.flightCode,
    visa_status: entry.visaStatus,
    remarks: entry.remarks,
    // Pass the customers array (which should be an array of customer IDs)
    customers: entry.customerIndices,
  });
  
  
  
  // ---------- Final Submission ----------
  // When submitting, first create booking then add payment entries.
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
      selling_cost: sellingCost,
    };
    if (bookingType === "Flight") {
      payload.flight_booking = globalFlights;
      payload.total_issued_fare = globalFlights.reduce((sum, entry) => sum + Number(entry.issuedFare || 0), 0);
    } else {
      payload.flight_booking = globalFlights;
      // Map hotelEntries to the server expected format
      payload.hotel_booking = hotelEntries.map(transformHotelEntry);
      // payload.visa_booking = visas;
      payload.visa_booking = visas.map(transformVisaEntry);

      payload.transport_booking = transportEntries;
      payload.activity_booking = activitiesEntries;
    }
    console.log("Payload:", payload);
    try {
      const response = await api.post("/api/bookings", payload);
      if (response.status === 201) {
        // const bookingId = response.data.booking.id;
        const bookingId = response.data.id;

        for (const payment of payments) {
          await api.post("/api/booking-payments", { booking_id: bookingId, ...payment });
        }
        setSuccess("Booking and payments created successfully!");
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
              <TextField label="Booking Date" type="date" name="bookingDate" value={bookingDate} fullWidth InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Departure Date" type="date" name="departureDate" value={departureDate} onChange={handleBookingDetailChange} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: getTomorrow() }} required id="departureDate" error={Boolean(fieldErrors["departureDate"])} helperText={fieldErrors["departureDate"]} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Return Date" type="date" name="returnDate" value={returnDate} onChange={handleBookingDetailChange} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: departureDate || getTomorrow() }} required id="returnDate" error={Boolean(fieldErrors["returnDate"])} helperText={fieldErrors["returnDate"]} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Selling Cost" type="number" name="sellingCost" value={sellingCost} onChange={handleSellingCostChange} fullWidth required id="selling_cost" error={Boolean(fieldErrors["sellingCost"])} helperText={fieldErrors["sellingCost"]} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Passengers Count" type="number" value={customers.length} fullWidth InputProps={{ readOnly: true }} required />
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

          {/* Existing Customer Search (multiple select) */}
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
                    <TextField label="Passport Expiry" type="date" value={customer.passport_expiry} onChange={(e) => handleCustomerChange(index, "passport_expiry", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: getTomorrow() }} required id={`passport_expiry_${index}`} error={Boolean(fieldErrors[`passport_expiry_${index}`])} helperText={fieldErrors[`passport_expiry_${index}`]} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={countryList}
                      getOptionLabel={(option) => option.label}
                      value={countryList.find((country) => country.label === customer.issuing_country) || null}
                      onChange={(event, newValue) => handleCustomerChange(index, "issuing_country", newValue ? newValue.label : "")}
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
                                <Select value={customer.phoneCode || "+44"} onChange={(e) => handleCustomerChange(index, "phoneCode", e.target.value)} variant="standard" disableUnderline>
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
                        <TextField label="Alternate Phone" value={customer.alternate_phone || ""} onChange={(e) => handleCustomerChange(index, "alternate_phone", e.target.value)} fullWidth />
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
                  <TextField label="PNR No" value={entry.pnr} onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "pnr", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="PNR Itinerary" value={entry.itinerary} onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "itinerary", e.target.value)} fullWidth required />
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
                  <TextField label="Issued Fare" type="number" value={entry.issuedFare} onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "issuedFare", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Remarks" value={entry.remarks} onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "remarks", e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Checkbox checked={entry.atol} onChange={(e) => handleGlobalFlightEntryChange(entryIndex, "atol", e.target.checked)} />} label="ATOL" />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel control={<Checkbox checked={entry.globalCost} onChange={(e) => toggleGlobalCostForEntry(entryIndex, e.target.checked)} />} label="Use same cost for all selected customers" />
              </Box>

              {entry.globalCost ? (
                <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", backgroundColor: "#f9f9f9" }}>
                  {/* Removed Selling Cost field */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Cost" type="number" value={entry.globalCostData?.cost || ""} onChange={(e) => updateGlobalCostForEntry(entryIndex, "cost", e.target.value)} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Internal Cost" type="number" value={entry.globalCostData?.internalCost || ""} onChange={(e) => updateGlobalCostForEntry(entryIndex, "internalCost", e.target.value)} fullWidth required />
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                entry.customerIndices.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", backgroundColor: "#f9f9f9" }}>
                    {entry.customerIndices.map((custIndex) => {
                      const customer = customers[custIndex];
                      const costData = entry.costs[custIndex] || { cost: 0, internalCost: 0 };
                      return (
                        <Box key={custIndex} sx={{ mb: 2, borderBottom: "1px solid #ddd", pb: 1 }}>
                          <Typography variant="body2">{customer.name} (Passport: {customer.passport_number})</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField label="Cost" type="number" value={costData.cost} onChange={(e) => updateFlightCostForCustomer(entryIndex, custIndex, "cost", e.target.value)} fullWidth required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField label="Internal Cost" type="number" value={costData.internalCost} onChange={(e) => updateFlightCostForCustomer(entryIndex, custIndex, "internalCost", e.target.value)} fullWidth required />
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
            <Typography variant="subtitle1">
              Total Issued Fare: {globalFlights.reduce((sum, entry) => sum + Number(entry.issuedFare || 0), 0)}
            </Typography>
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
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="meal-type-label">Meal Type</InputLabel>
                    <Select labelId="meal-type-label" value={entry.mealType} label="Meal Type" onChange={(e) => handleHotelEntryChange(index, "mealType", e.target.value)}>
                      <MenuItem value="Room Only">Room Only</MenuItem>
                      <MenuItem value="Breakfast">Breakfast</MenuItem>
                      <MenuItem value="Full board">Full board</MenuItem>
                      <MenuItem value="Half board">Half board</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Room Allocation" type="number" value={entry.roomAllocation} onChange={(e) => handleHotelEntryChange(index, "roomAllocation", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="room-type-label">Room Type</InputLabel>
                    <Select labelId="room-type-label" value={entry.roomType} label="Room Type" onChange={(e) => handleHotelEntryChange(index, "roomType", e.target.value)}>
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
                <Grid item xs={12} sm={6}>
                  <TextField label="Check-in Date" type="date" value={entry.checkinDate} onChange={(e) => handleHotelEntryChange(index, "checkinDate", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: getTomorrow() }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Check-in Time" type="time" value={entry.checkinTime} onChange={(e) => handleHotelEntryChange(index, "checkinTime", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Check-out Date" type="date" value={entry.checkoutDate} onChange={(e) => handleHotelEntryChange(index, "checkoutDate", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: entry.checkinDate || getTomorrow() }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Number of Nights" type="number" value={entry.nights} onChange={(e) => handleHotelEntryChange(index, "nights", e.target.value)} fullWidth required />
                </Grid>
                {/* Removed Selling Cost from Hotel step */}
                <Grid item xs={12} sm={6}>
                  <TextField label="Cost" type="number" value={entry.cost} onChange={(e) => handleHotelEntryChange(index, "cost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                    <Select labelId={`visa-type-label-${entryIndex}`} value={entry.visa_type} label="Visa Type" onChange={(e) => handleVisaEntryChange(entryIndex, "visa_type", e.target.value)}>
                      <MenuItem value="umrah">Umrah Visa</MenuItem>
                      <MenuItem value="tourist">Tourist Visa</MenuItem>
                      <MenuItem value="evw">EVW Visa</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {entry.visa_type === "EVW Visa" && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Previous Nationality" value={entry.previous_nationality} onChange={(e) => handleVisaEntryChange(entryIndex, "previous_nationality", e.target.value)} fullWidth required />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField label="Airline Code" value={entry.airlineCode} onChange={(e) => handleVisaEntryChange(entryIndex, "airlineCode", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Flight Code" value={entry.flightCode} onChange={(e) => handleVisaEntryChange(entryIndex, "flightCode", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel control={<Checkbox checked={entry.globalCost} onChange={(e) => toggleGlobalCostForVisa(entryIndex, e.target.checked)} />} label="Use same cost for all selected customers" />
                </Grid>
                {entry.globalCost ? (
                  <Box sx={{ width: "100%", mt: 1 }}>
                    <Grid container spacing={2}>
                      {/* Removed Selling Cost field */}
                      <Grid item xs={12} sm={6}>
                        <TextField label="Cost" type="number" value={entry.globalCostData?.cost || ""} onChange={(e) => updateGlobalCostForVisa(entryIndex, "cost", e.target.value)} fullWidth required />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Internal Cost" type="number" value={entry.globalCostData?.internalCost || ""} onChange={(e) => updateGlobalCostForVisa(entryIndex, "internalCost", e.target.value)} fullWidth required />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  entry.customerIndices.length > 0 && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      {entry.customerIndices.map((custIndex) => {
                        const customer = customers[custIndex];
                        const costData = entry.costs[custIndex] || { cost: 0, internalCost: 0 };
                        return (
                          <Box key={custIndex} sx={{ mb: 1, borderBottom: "1px solid #ddd", pb: 1 }}>
                            <Typography variant="body2">{customer.name} (Passport: {customer.passport_number})</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField label="Cost" type="number" value={costData.cost} onChange={(e) => updateVisaCostForCustomer(entryIndex, custIndex, "cost", e.target.value)} fullWidth required />
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <TextField label="Internal Cost" type="number" value={costData.internalCost} onChange={(e) => updateVisaCostForCustomer(entryIndex, custIndex, "internalCost", e.target.value)} fullWidth required />
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
                    <Select labelId={`visa-status-label-${entryIndex}`} value={entry.visaStatus} label="Visa Status" onChange={(e) => handleVisaEntryChange(entryIndex, "visaStatus", e.target.value)}>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Processing">Processing</MenuItem>
                      <MenuItem value="Issued">Issued</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Remarks" value={entry.remarks} onChange={(e) => handleVisaEntryChange(entryIndex, "remarks", e.target.value)} fullWidth />
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
          <Typography variant="h6" sx={{ mb: 2 }}>Transport</Typography>
          {transportEntries.map((entry, index) => (
            <Box key={index} sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}>
              <Typography variant="subtitle2">Transport Entry {index + 1}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Vehicle Type" value={entry.vehicleType} onChange={(e) => handleTransportEntryChange(index, "vehicleType", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Pickup From" value={entry.pickupFrom} onChange={(e) => handleTransportEntryChange(index, "pickupFrom", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Pickup Time" type="time" value={entry.pickupTime} onChange={(e) => handleTransportEntryChange(index, "pickupTime", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Dropoff" value={entry.dropoff} onChange={(e) => handleTransportEntryChange(index, "dropoff", e.target.value)} fullWidth required />
                </Grid>
                {/* Removed Selling Cost */}
                <Grid item xs={12} sm={6}>
                  <TextField label="Cost" type="number" value={entry.cost} onChange={(e) => handleTransportEntryChange(index, "cost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Internal Cost" type="number" value={entry.internalCost} onChange={(e) => handleTransportEntryChange(index, "internalCost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={Array.isArray(suppliers) ? suppliers : []}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    onChange={(event, newValue) => handleTransportEntryChange(index, "supplier_id", newValue ? newValue.id : undefined)}
                    renderInput={(params) => <TextField {...params} label="Supplier" />}
                  />
                </Grid>
              </Grid>
              <IconButton onClick={() => deleteTransportEntry(index)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addTransportEntry}>Add Transport Entry</Button>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 6: Activities --- */}
      {!isFlightOnly && step === 6 && (
        <Card sx={{ p: 2, mb: 2 }} id="activities">
          <Typography variant="h6" sx={{ mb: 2 }}>Activities</Typography>
          {activitiesEntries.map((entry, index) => (
            <Box key={index} sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}>
              <Typography variant="subtitle2">Activity Entry {index + 1}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Activity Name" value={entry.activity_name} onChange={(e) => handleActivityEntryChange(index, "activity_name", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Pickup Location"
                    value={entry.pickup_location || ""}
                    onChange={(e) => handleActivityEntryChange(index, "pickup_location", e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Date and Time" type="datetime-local" value={entry.datetime} onChange={(e) => handleActivityEntryChange(index, "datetime", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {/* <TextField label="Guide" value={entry.guide} onChange={(e) => handleActivityEntryChange(index, "guide", e.target.value)} fullWidth required /> */}
                  <FormControl fullWidth required>
                    <InputLabel id={`guide-label-${index}`}>Guide</InputLabel>
                    <Select
                      labelId={`guide-label-${index}`}
                      id={`guide-select-${index}`}
                      value={entry.guide || ""}
                      label="Guide"
                      onChange={(e) => handleActivityEntryChange(index, "guide", e.target.value)}
                    >
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {entry.guide === "Yes" && (
                  <Grid item xs={12} sm={6}>
                    <TextField label="Guide Cost" type="number" value={entry.guideCost || ""} onChange={(e) => handleActivityEntryChange(index, "guideCost", e.target.value)} fullWidth required />
                  </Grid>
                )}
                {/* Removed Selling Cost */}
                <Grid item xs={12} sm={6}>
                  <TextField label="Cost" type="number" value={entry.cost} onChange={(e) => handleActivityEntryChange(index, "cost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Internal Cost" type="number" value={entry.internalCost} onChange={(e) => handleActivityEntryChange(index, "internalCost", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={Array.isArray(suppliers) ? suppliers : []}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    onChange={(event, newValue) => handleActivityEntryChange(index, "supplier_id", newValue ? newValue.id : undefined)}
                    renderInput={(params) => <TextField {...params} label="Supplier" />}
                  />
                </Grid>
              </Grid>
              <IconButton onClick={() => deleteActivityEntry(index)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addActivityEntry}>Add Activity Entry</Button>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 7: Review --- */}
      {((isFlightOnly && step === 3) || (!isFlightOnly && step === 7)) && (
        <Card sx={{ p: 2, mb: 2 }} id="review">
          <Typography variant="h6" sx={{ mb: 2 }}>Review</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Booking Date: {bookingDate}</Typography>
            <Typography variant="subtitle1">Departure Date: {departureDate}</Typography>
            <Typography variant="subtitle1">Return Date: {returnDate}</Typography>
            <Typography variant="subtitle1">Selling Cost: {sellingCost}</Typography>
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
                    Cost: {flight.globalCostData?.cost || 0}, Internal Cost: {flight.globalCostData?.internalCost || 0}
                  </Typography>
                ) : (
                  <Box sx={{ ml: 2 }}>
                    {flight.customerIndices.map((custIndex) => {
                      const costData = flight.costs[custIndex];
                      return (
                        <Typography key={custIndex} variant="body2">
                          {customers[custIndex]?.name}: Cost: {costData?.cost || 0}, Internal Cost: {costData?.internalCost || 0}
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
                      Cost: {entry.globalCost ? entry.globalCostData?.cost : entry.customerIndices.map((idx) => {
                        const cd = entry.costs[idx];
                        return `${customers[idx]?.name}: Cost: ${cd?.cost || 0}, Internal Cost: ${cd?.internalCost || 0}`;
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
                      {visa.globalCost ? (
                        <>Cost: {visa.globalCostData?.cost || 0}, Internal Cost: {visa.globalCostData?.internalCost || 0}</>
                      ) : (
                        visa.customerIndices?.map((idx) => {
                          const cd = visa.costs[idx];
                          return `${customers[idx]?.name}: Cost: ${cd?.cost || 0}, Internal Cost: ${cd?.internalCost || 0}`;
                        }).join(" | ")
                      )}
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
                <Typography variant="subtitle1">Transport Entries:</Typography>
                {transportEntries.map((entry, i) => (
                  <Box key={i} sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      Vehicle: {entry.vehicleType} | Cost: {entry.cost}, Internal Cost: {entry.internalCost}
                    </Typography>
                    <Typography variant="body2">
                      Pickup: {entry.pickupFrom} at {entry.pickupTime}, Dropoff: {entry.dropoff}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Activity Entries:</Typography>
                {activitiesEntries.map((entry, i) => (
                  <Box key={i} sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      Activity: {entry.activity_name} | Cost: {entry.cost}, Internal Cost: {entry.internalCost}
                    </Typography>
                    <Typography variant="body2">
                      Date & Time: {entry.datetime}, Guide: {entry.guide} {entry.guide === "Yes" && `, Guide Cost: ${entry.guideCost}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button variant="contained" onClick={prevStep}>Back</Button>
            <Button variant="contained" onClick={nextStep}>Next</Button>
          </Box>
        </Card>
      )}

      {/* --- Step 7: Payment --- */}
      {((isFlightOnly && step === 4) || (!isFlightOnly && step === 8)) && (
        <Card sx={{ p: 2, mb: 2 }} id="payment">
          <Typography variant="h6" sx={{ mb: 2 }}>Payment</Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Total Selling Cost: <strong>{sellingCost}</strong>
            </Typography>
            <Typography variant="body1">
              Total Payment Entered: <strong>{totalPayment}</strong>
            </Typography>
            {isPaymentOverdue() && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Payment is overdue: Departure is less than one month away and full payment has not been made.
              </Alert>
            )}
          </Box>
          {payments.map((payment, index) => (
            <Box key={index} sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}>
              <Typography variant="subtitle2">Payment Entry {index + 1}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Amount" type="number" value={payment.amount} onChange={(e) => handlePaymentChange(index, "amount", e.target.value)} fullWidth required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Payment Date" type="datetime-local" value={payment.payment_date} onChange={(e) => handlePaymentChange(index, "payment_date", e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Payment Method" value={payment.payment_method} onChange={(e) => handlePaymentChange(index, "payment_method", e.target.value)} fullWidth />
                </Grid>
              </Grid>
              <IconButton onClick={() => deletePaymentEntry(index)} sx={{ position: "absolute", top: 8, right: 8 }} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button variant="outlined" onClick={addPaymentEntry}>Add Payment Entry</Button>
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
