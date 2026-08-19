// src/components/AddBooking.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert,
  AlertTitle,
  Link as MuiLink,
  Grid,
  Card,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Select,
  Autocomplete,
  InputAdornment,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { StepIconProps } from "@mui/material/StepIcon";
import { styled } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import api from "@/api/api";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// import StepBookingDetails from "./steps/StepBookingDetails";
// import StepFlights from "./steps/StepFlights";
// import StepHotels from "./steps/StepHotels";
// import StepVisa from "./steps/StepVisa";
// import StepTransport from "./steps/StepTransport";
// import StepActivities from "./steps/StepActivities";
// import StepReview from "./steps/StepReview";
// import StepPayment from "./steps/StepPayment";
import StepBookingDetails from "./StepBookingDetails";
import StepFlights from "./StepFlights";
import StepHotels from "./StepHotels";
import StepVisa from "./StepVisa";
import StepTransport from "./StepTransport";
import StepActivities from "./StepActivities";
import StepReview from "./StepReview";
import StepPayment from "./StepPayment";
import { useDepartment } from "@/context/DepartmentContext";
import { defaultCountries } from "react-international-phone";

// ---------- Sample Static Data & Helpers ----------
// Full country list (name + ISO2 code), reusing the data already bundled
// with react-international-phone so it stays in sync with the phone inputs.
const countryList = defaultCountries
  .map(([name, iso2]) => ({ code: iso2.toUpperCase(), label: name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const phoneCodes = [
  { code: "+44", label: "UK (+44)" },
  { code: "+1", label: "US (+1)" },
  { code: "+92", label: "Pakistan (+92)" },
];

const getToday = () => new Date().toISOString().split("T")[0];
const getTomorrow = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
};
const addMonths = (dateStr: string, months: number) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
};

// ---------- Custom Stepper Connector ----------
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 16 },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[200],
    borderRadius: 2,
  },
}));

// ---------- Custom Step Icon ----------
const StepIconRoot = styled("div")<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ theme, ownerState }) => ({
    width: 34,
    height: 34,
    display: "flex",
    borderRadius: "50%",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 0.2s",
    ...(ownerState.completed && {
      background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
      color: "#fff",
    }),
    ...(ownerState.active && {
      background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
      color: "#fff",
      boxShadow: "0 0 0 4px rgba(96,93,255,0.18)",
    }),
    ...(!ownerState.active && !ownerState.completed && {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.text.secondary,
    }),
  })
);

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, icon } = props;
  return (
    <StepIconRoot ownerState={{ active, completed }}>
      {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : icon}
    </StepIconRoot>
  );
}

// ---------- Steps Definitions ----------
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

// ---------- Main Component ----------
const AddBooking: React.FC = () => {
  const router = useRouter();
  const { hasPermission } = useDepartment();
  const canSeeInternalCosts = hasPermission("view-internal-costs");

  // Step state
  const [step, setStep] = useState<number>(1);

  // Booking details
  const [bookingDate] = useState<string>(getToday());
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [tripType, setTripType] = useState<string>("return");
  const [status, setStatus] = useState<string>("pending");
  const [bookingType, setBookingType] = useState<string>("Flight");
  const [sellingCost, setSellingCost] = useState<string>("");

  // Customers & Suppliers
  const [customers, setCustomers] = useState<any[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Service entries
  const [globalFlights, setGlobalFlights] = useState<any[]>([]);
  const [hotelEntries, setHotelEntries] = useState<any[]>([]);
  const [visas, setVisas] = useState<any[]>([]);
  const [transportEntries, setTransportEntries] = useState<any[]>([]);
  const [activitiesEntries, setActivitiesEntries] = useState<any[]>([]);

  // Payments
  const [payments, setPayments] = useState<any[]>([]);

  // Errors & success
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFlightOnly = bookingType === "Flight";
  const stepsToShow = isFlightOnly ? flightSteps : otherSteps;

  // Only flight bookings can be one-way; everything else always has a return leg
  useEffect(() => {
    if (bookingType !== "Flight" && tripType !== "return") {
      setTripType("return");
    }
  }, [bookingType, tripType]);

  // Fetch existing customers & suppliers
  useEffect(() => {
    api.get("/api/customers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        console.log("Fetched customers:", data);
        setExistingCustomers(data);
      })
      .catch((err) => console.error(err));

    api.get("/api/suppliers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setSuppliers(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Ensure at least one customer
  // useEffect(() => {
  //   if (customers.length === 0) {
  //     setCustomers([
  //       {
  //         id: 1,
  //         name: "",
  //         passport_number: "",
  //         passport_expiry: "",
  //         issuing_country: "",
  //         date_of_birth: "",
  //         is_leading: true,
  //         phoneCode: "+44",
  //         phone: "",
  //         alternate_phone: "",
  //       },
  //     ]);
  //   }
  // }, []);

  // Navigation
  const scrollToField = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  // const nextStep = () => {
  //   setFieldErrors({});
  //   // ... your existing validation logic ...
  //   setGlobalError(null);
  //   setStep((s) => s + 1);
  // };
  // Validation + navigation
  const nextStep = () => {
    // If on Step 1, validate booking details & customers
    if (step === 1) {
      const errs: Record<string, string> = {};

      // Booking-level
      if (!departureDate) errs["departureDate"] = "Departure Date is required.";
      if (tripType !== "one-way" && !returnDate)
        errs["returnDate"] = "Return Date is required.";
      if (!sellingCost) errs["sellingCost"] = "Selling Cost is required.";
      if (customers.length === 0) errs["customers"] = "At least one customer is required.";

      // Each customer
      customers.forEach((c, i) => {
        if (!c.name) errs[`name_${i}`] = "Name is required.";
        if (!c.passport_number)
          errs[`passport_number_${i}`] = "Passport number is required.";
        if (!c.passport_expiry)
          errs[`passport_expiry_${i}`] = "Passport expiry is required.";
        else if (new Date(c.passport_expiry) < new Date(getTomorrow()))
          errs[`passport_expiry_${i}`] =
            "Expiry must be at least tomorrow or later.";
        if (!c.issuing_country)
          errs[`issuing_country_${i}`] = "Issuing country is required.";
        // **NEW**: Customer Type required
        if (!c.customerType) {
          errs[`customerType_${i}`] = "Customer Type is required.";
        }
        if (!c.date_of_birth)
          errs[`date_of_birth_${i}`] = "Date of birth is required.";

        // Leading customer extra fields
        if (c.is_leading) {
          if (!c.email) errs[`email_${i}`] = "Email is required.";
          if (!c.address) errs[`address_${i}`] = "Address is required.";
          if (!c.phone) errs[`phone_${i}`] = "Phone is required.";
        }
      });

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }
    }
    
     // --- NEW: Step 2 (Flights) Validation ---
    if (step === 2) {
      const errs: Record<string, string> = {};
      globalFlights.forEach((entry, i) => {
        // 1) PNR
        if (!entry.pnr || entry.pnr.trim() === "") {
          errs[`pnr_${i}`] = "PNR is required.";
        }
        // 2) Itinerary
        if (!entry.itinerary || entry.itinerary.trim() === "") {
          errs[`itinerary_${i}`] = "Itinerary is required.";
        }
        // 3) At least one customer must be selected
        if (!Array.isArray(entry.customerIndices) || entry.customerIndices.length === 0) {
          errs[`customers_${i}`] = "Select at least one customer.";
        }
        // 4) Issued Fare
        if (entry.issuedFare === undefined || entry.issuedFare === null || entry.issuedFare === 0) {
          errs[`issuedFare_${i}`] = "Issued Fare is required.";
        }

        // 5) Cost fields
        if (entry.globalCost) {
          // a) globalCostData.cost
          if (!entry.globalCostData || entry.globalCostData.cost === undefined || entry.globalCostData.cost === null) {
            errs[`globalCost_${i}_cost`] = "Cost is required.";
          }
          // b) globalCostData.internalCost
          // if (!entry.globalCostData || entry.globalCostData.internalCost === undefined || entry.globalCostData.internalCost === null) {
          //   errs[`globalCost_${i}_internalCost`] = "Internal Cost is required.";
          // }
        } else {
          // For each selected customer, they need cost + internalCost
          (entry.customerIndices || []).forEach((ci: number) => {
            const cd = entry.costs?.[ci] || {};
            if (cd.cost === undefined || cd.cost === null) {
              errs[`cost_${i}_${ci}`] = "Cost is required.";
            }
            // if (cd.internalCost === undefined || cd.internalCost === null) {
            //   errs[`internalCost_${i}_${ci}`] = "Internal Cost is required.";
            // }
          });
        }
      });

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }

      // No errors: clear fieldErrors and proceed
      setFieldErrors({});
      setStep((s) => s + 1);
      return;
    }

    // Inside AddBooking.tsx, in your nextStep() function:

    if (step === 3 && bookingType !== "Flight") {
      const errs: Record<string, string> = {};

      hotelEntries.forEach((entry, i) => {
        // 1) Hotel Name
        if (!entry.hotelName || entry.hotelName.trim() === "") {
          errs[`hotelName_${i}`] = "Hotel name is required.";
        }
        // 2) Hotel Address
        if (!entry.hotelAddress || entry.hotelAddress.trim() === "") {
          errs[`hotelAddress_${i}`] = "Hotel address is required.";
        }
        // 3) At least one customer
        if (!Array.isArray(entry.customerIndices) || entry.customerIndices.length === 0) {
          errs[`customers_${i}`] = "Select at least one customer.";
        }
        // 4) Meal Type
        if (!entry.mealType) {
          errs[`mealType_${i}`] = "Meal type is required.";
        }
        // 5) Room Allocation
        if (
          entry.roomAllocation === undefined ||
          entry.roomAllocation === null ||
          entry.roomAllocation <= 0
        ) {
          errs[`roomAllocation_${i}`] = "Room allocation is required.";
        }
        // 6) Room Type
        if (!entry.roomType) {
          errs[`roomType_${i}`] = "Room type is required.";
        }
        // 7) If “other”, then roomViewOther is required
        if (entry.roomType === "other" && !entry.roomViewOther) {
          errs[`roomViewOther_${i}`] = "Specify other room type.";
        }
        // 8) Room View
        if (!entry.roomView) {
          errs[`roomView_${i}`] = "Room view is required.";
        }
        // 9) Check-in Date
        if (!entry.checkinDate) {
          errs[`checkinDate_${i}`] = "Check-in date is required.";
        }
        // 10) Check-in Time
        if (!entry.checkinTime) {
          errs[`checkinTime_${i}`] = "Check-in time is required.";
        }
        // 11) Check-out Date
        if (!entry.checkoutDate) {
          errs[`checkoutDate_${i}`] = "Check-out date is required.";
        }
        // 12) Number of Nights
        if (entry.nights === undefined || entry.nights === null || entry.nights <= 0) {
          errs[`nights_${i}`] = "Number of nights is required.";
        }
        // 13) Cost
        // if (entry.cost === undefined || entry.cost === null) {
        //   errs[`cost_${i}`] = "Cost is required.";
        // }
        if (entry.cost === undefined || entry.cost === null || entry.cost <= 0) {
          errs[`cost_${i}`] = "Cost is required.";
        }
        // 14) Internal Cost
        // if (entry.internalCost === undefined || entry.internalCost === null) {
        //   errs[`internalCost_${i}`] = "Internal cost is required.";
        // }
        
        // 15) Supplier
        // if (!entry.supplier_id) {
        //   errs[`supplier_id_${i}`] = "Supplier is required.";
        // }
      });

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }

      // No errors: clear and advance
      setFieldErrors({});
      setStep((s) => s + 1);
      return;
    }
    // Inside AddBooking.tsx → nextStep()

    if (step === 4 && bookingType !== "Flight") {
      const errs: Record<string, string> = {};

      visas.forEach((ent, i) => {
        // 1) At least one customer
        if (!Array.isArray(ent.customerIndices) || ent.customerIndices.length === 0) {
          errs[`customers_${i}`] = "Select at least one customer.";
        }
        // 2) Visa Type
        if (!ent.visa_type) {
          errs[`visa_type_${i}`] = "Visa Type is required.";
        }
        // 3) If EVW, previous nationality is required
        if (ent.visa_type === "evw" && !ent.previous_nationality) {
          errs[`previous_nationality_${i}`] = "Previous nationality is required.";
        }
        // 4) Airline Code
        if (!ent.airlineCode) {
          errs[`airlineCode_${i}`] = "Airline Code is required.";
        }
        // 5) Flight Code
        if (!ent.flightCode) {
          errs[`flightCode_${i}`] = "Flight Code is required.";
        }

        // 6) Costs
        if (ent.globalCost) {
          // globalCostData.cost
          if (
            !ent.globalCostData ||
            ent.globalCostData.cost === undefined ||
            ent.globalCostData.cost === null ||
            ent.globalCostData.cost <= 0
          ) {
            errs[`globalCost_${i}_cost`] = "Cost is required.";
          }
          // globalCostData.internalCost
          if (
            !ent.globalCostData ||
            ent.globalCostData.internalCost === undefined ||
            ent.globalCostData.internalCost === null ||
            ent.globalCostData.internalCost <= 0
          ) {
            // errs[`globalCost_${i}_internalCost`] = "Internal Cost is required.";
          }
        } else {
          // per-customer cost
          (ent.customerIndices || []).forEach((ci: number) => {
            const cd = ent.costs[ci] || {};
            if (cd.cost === undefined || cd.cost === null || cd.cost <= 0) {
              errs[`cost_${i}_${ci}`] = "Cost is required.";
            }
            if (
              cd.internalCost === undefined ||
              cd.internalCost === null ||
              cd.internalCost <= 0
            ) {
              // errs[`internalCost_${i}_${ci}`] = "Internal Cost is required.";
            }
          });
        }

        // 7) Visa Status
        if (!ent.visaStatus) {
          errs[`visaStatus_${i}`] = "Visa Status is required.";
        }
        // 8) Supplier
        if (!ent.supplier) {
          // errs[`supplier_${i}`] = "Supplier is required.";
        }
      });

      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        return;
      }

      // No errors → clear and move on
      setFieldErrors({});
      setStep((s) => s + 1);
      return;
    }


    // Clear errors & move on
    setFieldErrors({});
    setGlobalError(null);
    setStep((s) => s + 1);
  };

  // const prevStep 
  const prevStep = () => {
    setGlobalError(null);
    setStep((s) => s - 1);
  };

  // Handlers for booking details, customers, flights, hotels, visas, transport, activities, payments
  // (Use the same implementations you already have in your original file.)

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    setGlobalError(null);
    setSuccess(null);

    const payload: any = {
      booking_date: bookingDate,
      departure_date: departureDate,
      return_date: tripType === "one-way" ? null : returnDate,
      trip_type: tripType,
      status,
      booking_type: bookingType,
      passengers_count: customers.length,
      customers,
      selling_cost: sellingCost,
    };

    if (bookingType === "Flight") {
      payload.flight_booking = globalFlights;
      payload.total_issued_fare = globalFlights.reduce(
        (sum, e) => sum + Number(e.issuedFare || 0),
        0
      );
    } else {
      payload.flight_booking = globalFlights;
      payload.hotel_booking = hotelEntries.map((h) => ({
        hotel_name: h.hotelName,
        hotel_address: h.hotelAddress,
        meal_type: h.mealType,
        room_allocation: h.roomAllocation,
        room_type: h.roomType,
        room_view: h.roomView,
        room_view_other: h.roomViewOther,
        remarks: h.remarks,
        check_in_date: h.checkinDate,
        check_in_time: h.checkinTime,
        check_out_date: h.checkoutDate,
        nights: h.nights,
        cost: h.cost,
        internal_cost: h.internalCost,
        supplier_id: h.supplier_id,
      }));
      payload.visa_booking = visas.map((v) => ({
        visa_type: v.visa_type,
        previous_nationality: v.previous_nationality,
        validity: v.validity,
        airline_code: v.airlineCode,
        flight_code: v.flightCode,
        visa_status: v.visaStatus,
        remarks: v.remarks,
        cost: v.globalCost ? v.globalCostData.cost : 0,
        internal_cost: v.globalCost
          ? v.globalCostData.internalCost
          : 0,
        customers: v.customerIndices,
        supplier_id: v.supplier?.id || null,
      }));
      payload.transport_booking = transportEntries;
      payload.activity_booking = activitiesEntries;
    }

    try {
      const response = await api.post("/api/bookings", payload);
      if (response.status === 201) {
        const bookingId        = response.data.id;
        const bookingNumber    = response.data.booking_number;

        for (const p of payments) {
          await api.post("/api/booking-payments", {
            booking_id: bookingId,
            ...p,
          });
        }

        await Swal.fire({
          icon: "success",
          title: "Booking Created!",
          html: `Booking <strong>${bookingNumber}</strong> has been created successfully.`,
          confirmButtonText: "View Booking",
          confirmButtonColor: "#605DFF",
          timer: 4000,
          timerProgressBar: true,
        });

        router.push(`/bookings/manage-bookings/${bookingNumber}`);
      } else {
        setGlobalError("Failed to create booking.");
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError("An error occurred while creating the booking.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Stepper
        activeStep={step - 1}
        alternativeLabel
        connector={<ColorlibConnector />}
        sx={{ mb: 4 }}
      >
        {stepsToShow.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {step === 1 && (
        // <StepBookingDetails
        //   bookingDate={bookingDate}
        //   departureDate={departureDate}
        //   returnDate={returnDate}
        //   sellingCost={sellingCost}
        //   handleBookingDetailChange={(e: any) => {
        //     if (e.target.name === "departureDate") {
        //       setDepartureDate(e.target.value);
        //       setFieldErrors((f) => ({ ...f, departureDate: "" }));
        //     } else {
        //       setReturnDate(e.target.value);
        //       setFieldErrors((f) => ({ ...f, returnDate: "" }));
        //     }
        //   }}
        //   handleSellingCostChange={(e: any) => {
        //     setSellingCost(e.target.value);
        //     setFieldErrors((f) => ({ ...f, sellingCost: "" }));
        //   }}
        //   customers={customers}
        //   existingCustomers={existingCustomers}
        //   addCustomer={(c: any) => {
        //     if (c) {
        //       if (!customers.find((x) => x.passport_number === c.passport_number))
        //         setCustomers((arr) => [...arr, c]);
        //     } else {
        //       setCustomers((arr) => [
        //         ...arr,
        //         {
        //           id: arr.length + 1,
        //           name: "",
        //           passport_number: "",
        //           passport_expiry: "",
        //           issuing_country: "",
        //           date_of_birth: "",
        //           is_leading: arr.length === 0,
        //           phoneCode: "+44",
        //           phone: "",
        //           alternate_phone: "",
        //         },
        //       ]);
        //     }
        //   }}
        //   deleteCustomer={(idx: number) =>
        //     setCustomers((arr) => {
        //       const c = [...arr];
        //       c.splice(idx, 1);
        //       if (!c.some((x) => x.is_leading) && c.length) c[0].is_leading = true;
        //       return c;
        //     })
        //   }
        //   handleCustomerChange={(idx: number, field: string, val: any) =>{
        //     setCustomers((arr) =>
        //       arr.map((c, i) =>
        //         i === idx
        //           ? {
        //               ...c,
        //               [field]: val,
        //               ...(field === "is_leading" && val
        //                 ? { is_leading: true }
        //                 : {}),
        //             }
        //           : field === "is_leading" && val
        //           ? { ...c, is_leading: false }
        //           : c
        //       )
        //     );
        //       setFieldErrors(errs => {
        //       const next = { ...errs };
        //       // field keys in BookingDetailsStep are `${field}_${idx}`
        //       delete next[`${field}_${idx}`];
        //       return next;
        //     });
        //   }}
        //   countryList={countryList}
        //   phoneCodes={phoneCodes}
        //   fieldErrors={fieldErrors}
        //   globalError={globalError}
        //   status={status}
        //   setStatus={setStatus}
        //   bookingType={bookingType}
        //   setBookingType={setBookingType}
        //   nextStep={nextStep}
        // />

        <StepBookingDetails
          bookingDate={bookingDate}
          departureDate={departureDate}
          returnDate={returnDate}
          sellingCost={sellingCost}
          handleBookingDetailChange={(e: any) => {
            if (e.target.name === "departureDate") {
              setDepartureDate(e.target.value);
              setFieldErrors(f => ({ ...f, departureDate: "" }));
            } else {
              setReturnDate(e.target.value);
              setFieldErrors(f => ({ ...f, returnDate: "" }));
            }
          }}
          handleSellingCostChange={(e: any) => {
            setSellingCost(e.target.value);
            setFieldErrors(f => ({ ...f, sellingCost: "" }));
          }}
          customers={customers}
          existingCustomers={existingCustomers}

          addCustomer={(c?: any) => {
            setCustomers(arr => {
              // 1) Build the new customer object, now including alternate_phone
              const newCust = c
                ? {
                    ...c,
                    is_leading: arr.length === 0,
                    alternate_phone: c.alternate_phone ?? "",
                  }
                : {
                    id: arr.length + 1,
                    name: "",
                    passport_number: "",
                    passport_expiry: "",
                    issuing_country: "",
                    date_of_birth: "",
                    is_leading: arr.length === 0,
                    email: "",
                    address: "",
                    phoneCode: "+44",
                    phone: "",
                    alternate_phone: "", // included here
                  };

              // 2) If exactly one existed before adding, flip that existing one's is_leading off
              const updatedArr = arr.map((prev, i) =>
                i === 0 && arr.length === 1
                  ? { ...prev, is_leading: false }
                  : prev
              );

              return [...updatedArr, newCust];
            });
          }}

          deleteCustomer={(idx: number) => {
            setCustomers(arr => {
              const copy = [...arr];
              copy.splice(idx, 1);
              // If now exactly one left, force it to leading
              if (copy.length === 1) {
                return [{ ...copy[0], is_leading: true }];
              }
              return copy;
            });
          }}

          handleCustomerChange={(idx: number, field: string, val: any) => {
            setCustomers(arr =>
              arr.map((c, i) => {
                if (i === idx) {
                  // If toggling “is_leading” to true on this row, force that
                  if (field === "is_leading" && val === true) {
                    return { ...c, is_leading: true };
                  }
                  // Otherwise, update that field (e.g. name, passport_expiry, alternate_phone, etc.)
                  return { ...c, [field]: val };
                }
                // If another row was leading and this row is now set to lead, turn others off
                if (field === "is_leading" && val === true) {
                  return { ...c, is_leading: false };
                }
                return c;
              })
            );
            // Clear any field‐level error for this specific input
            setFieldErrors(errs => {
              const next = { ...errs };
              delete next[`${field}_${idx}`];
              return next;
            });
          }}

          countryList={countryList}
          phoneCodes={phoneCodes}
          fieldErrors={fieldErrors}
          clearFieldError={(key: string) =>
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            })
          }
          globalError={globalError}
          status={status}
          setStatus={setStatus}
          bookingType={bookingType}
          setBookingType={setBookingType}
          tripType={tripType}
          setTripType={setTripType}
          nextStep={nextStep}
        />



        // <StepBookingDetails
        //   bookingDate={bookingDate}
        //   departureDate={departureDate}
        //   returnDate={returnDate}
        //   sellingCost={sellingCost}
        //   handleBookingDetailChange={(e: any) => {
        //     if (e.target.name === "departureDate") {
        //       setDepartureDate(e.target.value);
        //       setFieldErrors(f => ({ ...f, departureDate: "" }));
        //     } else {
        //       setReturnDate(e.target.value);
        //       setFieldErrors(f => ({ ...f, returnDate: "" }));
        //     }
        //   }}
        //   handleSellingCostChange={(e: any) => {
        //     setSellingCost(e.target.value);
        //     setFieldErrors(f => ({ ...f, sellingCost: "" }));
        //   }}
        //   customers={customers}
        //   existingCustomers={existingCustomers}
        //   addCustomer={(c?: any) => {
        //     setCustomers(arr => {
        //       // Build new customer object
        //       const newCust = c
        //         ? { ...c, is_leading: arr.length === 0 }
        //         : {
        //             id: arr.length + 1,
        //             name: "",
        //             passport_number: "",
        //             passport_expiry: "",
        //             issuing_country: "",
        //             date_of_birth: "",
        //             is_leading: arr.length === 0,
        //             email: "",
        //             address: "",
        //             phoneCode: "+44",
        //             phone: "",
        //             alternate_phone: "",
        //           };

        //       // If exactly one existed before, flip that one off as leading
        //       const updatedArr = arr.map((prev, i) =>
        //         i === 0 && arr.length === 1
        //           ? { ...prev, is_leading: false }
        //           : prev
        //       );

        //       return [...updatedArr, newCust];
        //     });
        //   }}
        //   deleteCustomer={(idx: number) => {
        //     setCustomers(arr => {
        //       const copy = [...arr];
        //       copy.splice(idx, 1);
        //       // If now exactly one left, force it to leading
        //       if (copy.length === 1) {
        //         return [{ ...copy[0], is_leading: true }];
        //       }
        //       return copy;
        //     });
        //   }}
        //   handleCustomerChange={(idx: number, field: string, val: any) => {
        //     setCustomers(arr =>
        //       arr.map((c, i) => {
        //         if (i === idx) {
        //           // If toggling “is_leading” on this row, set it true
        //           if (field === "is_leading" && val === true) {
        //             return { ...c, is_leading: true };
        //           }
        //           // Otherwise just update that field
        //           return { ...c, [field]: val };
        //         }
        //         // If another row was leading and current row is now set to lead, turn others off
        //         if (field === "is_leading" && val === true) {
        //           return { ...c, is_leading: false };
        //         }
        //         return c;
        //       })
        //     );
        //     // Clear any field‐level error for that specific input
        //     setFieldErrors(errs => {
        //       const next = { ...errs };
        //       delete next[`${field}_${idx}`];
        //       return next;
        //     });
        //   }}
        //   countryList={countryList}
        //   phoneCodes={phoneCodes}
        //   fieldErrors={fieldErrors}
        //   globalError={globalError}
        //   status={status}
        //   setStatus={setStatus}
        //   bookingType={bookingType}
        //   setBookingType={setBookingType}
        //   nextStep={nextStep}
        // />

      )}

      {step === 2 && (
        // <StepFlights
        //   customers={customers}
        //   globalFlights={globalFlights}
        //   setGlobalFlights={setGlobalFlights}
        //   prevStep={prevStep}
        //   nextStep={nextStep}
        // />
        <StepFlights
          customers={customers}
          suppliers={suppliers}
          globalFlights={globalFlights}
          setGlobalFlights={setGlobalFlights}
          fieldErrors={fieldErrors}
          clearFieldError={(key: string) =>
          setFieldErrors(prev => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
          })
        }
          prevStep={prevStep}
          nextStep={nextStep}
          canSeeInternalCosts={canSeeInternalCosts}
        />
      )}

      {!isFlightOnly && step === 3 && (
        <StepHotels
          customers={customers}
          hotelEntries={hotelEntries}
          setHotelEntries={setHotelEntries}
          suppliers={suppliers}
          fieldErrors={fieldErrors}
          clearFieldError={(key: string) =>
            setFieldErrors(prev => {
              const copy = { ...prev };
              delete copy[key];
              return copy;
            })
          }
          prevStep={prevStep}
          nextStep={nextStep}
          canSeeInternalCosts={canSeeInternalCosts}
        />
      )}

      {!isFlightOnly && step === 4 && (
        // <StepVisa
        //   customers={customers}
        //   visas={visas}
        //   setVisas={setVisas}
        //   suppliers={suppliers}
        //   prevStep={prevStep}
        //   nextStep={nextStep}
        // />
        <StepVisa
          customers={customers}
          visas={visas}
          setVisas={setVisas}
          suppliers={suppliers}
          fieldErrors={fieldErrors}
          clearFieldError={(key: string) =>
            setFieldErrors((prev) => {
              const copy = { ...prev };
              delete copy[key];
              return copy;
            })
          }
          prevStep={prevStep}
          nextStep={nextStep}
          canSeeInternalCosts={canSeeInternalCosts}
        />
      )}

      {!isFlightOnly && step === 5 && (
        <StepTransport
          transportEntries={transportEntries}
          setTransportEntries={setTransportEntries}
          suppliers={suppliers}
          prevStep={prevStep}
          nextStep={nextStep}
          canSeeInternalCosts={canSeeInternalCosts}
        />
      )}

      {!isFlightOnly && step === 6 && (
        <StepActivities
          activitiesEntries={activitiesEntries}
          setActivitiesEntries={setActivitiesEntries}
          suppliers={suppliers}
          prevStep={prevStep}
          nextStep={nextStep}
          canSeeInternalCosts={canSeeInternalCosts}
        />
      )}

      {((isFlightOnly && step === 3) || (!isFlightOnly && step === 7)) && (
        <StepReview
          bookingDate={bookingDate}
          departureDate={departureDate}
          returnDate={returnDate}
          sellingCost={sellingCost}
          customers={customers}
          globalFlights={globalFlights}
          hotelEntries={hotelEntries}
          visas={visas}
          transportEntries={transportEntries}
          activitiesEntries={activitiesEntries}
          prevStep={prevStep}
          nextStep={nextStep}
        />
      )}

      {((isFlightOnly && step === 4) || (!isFlightOnly && step === 8)) && (
        <StepPayment
          sellingCost={sellingCost}
          payments={payments}
          setPayments={setPayments}
          prevStep={prevStep}
          totalPayment={payments.reduce((sum, p) => sum + Number(p.amount), 0)}
          onSubmit={handleSubmit}
        />
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <AlertTitle>Success</AlertTitle>
          {success}{" "}
          <MuiLink href="/bookings" underline="hover">
            Go to Bookings
          </MuiLink>
        </Alert>
      )}
    </Box>
  );
};

export default AddBooking;