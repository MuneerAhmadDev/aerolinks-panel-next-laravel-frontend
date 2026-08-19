// src/components/steps/StepBookingDetails.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Button,
  IconButton,
  Alert,
  AlertTitle,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

interface Customer {
  name: string;
  passport_number: string;
  passport_expiry: string;
  issuing_country: string;
  date_of_birth: string;
  is_leading?: boolean;
  email?: string;
  address?: string;
  phone?: string;
  phoneCode?: string;
  alternate_phone?: string;
  customerType?: string;       // lowercase, e.g. "infant"
  customer_type?: string;      // API might supply this
  residence_country?: string;
  visa_status?: string;         // free text: customer's visa/residency status in their residence country
}

interface Country {
  label: string;
  code: string;
}

interface PhoneCode {
  code: string;
}

interface FieldErrors {
  [key: string]: string;
}

interface Props {
  bookingDate: string;
  departureDate: string;
  returnDate: string;
  sellingCost: string | number;
  status: string;
  bookingType: string;
  tripType: string;
  setTripType: (type: string) => void;
  customers: Customer[];
  existingCustomers: Customer[];
  countryList: Country[];
  phoneCodes: PhoneCode[];
  fieldErrors: FieldErrors;
  globalError?: string | null;
  setStatus: (status: string) => void;
  setBookingType: (type: string) => void;
  handleBookingDetailChange: React.ChangeEventHandler<HTMLInputElement>;
  handleSellingCostChange: React.ChangeEventHandler<HTMLInputElement>;
  addCustomer: (customer?: Customer) => void;
  deleteCustomer: (idx: number) => void;
  handleCustomerChange: (
    idx: number,
    field: keyof Customer,
    value: any
  ) => void;
  clearFieldError: (key: string) => void;
  nextStep: () => void;
}

const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
};

// Valid types in lowercase
const VALID_TYPES_LOWER = ["infant", "child", "youth", "adult"];

// Months between a date-of-birth and a reference date (e.g. departure/return date)
const monthsBetween = (dobStr: string, asOfStr: string): number | null => {
  if (!dobStr || !asOfStr) return null;
  const dob = new Date(dobStr);
  const asOf = new Date(asOfStr);
  if (isNaN(dob.getTime()) || isNaN(asOf.getTime())) return null;
  let months = (asOf.getFullYear() - dob.getFullYear()) * 12 + (asOf.getMonth() - dob.getMonth());
  if (asOf.getDate() < dob.getDate()) months -= 1;
  return months;
};

// infant: <24mo, child: 24mo-12yr, youth: 12-16yr, adult: 16yr+
const calculateCustomerType = (dobStr: string, asOfStr: string): string => {
  const months = monthsBetween(dobStr, asOfStr);
  if (months === null || months < 0) return "";
  if (months < 24) return "infant";
  if (months < 144) return "child";
  if (months < 192) return "youth";
  return "adult";
};

const StepBookingDetails: React.FC<Props> = ({
  bookingDate,
  departureDate,
  returnDate,
  sellingCost,
  status,
  bookingType,
  tripType,
  setTripType,
  customers,
  existingCustomers,
  countryList,
  phoneCodes,
  fieldErrors,
  globalError,
  setStatus,
  setBookingType,
  handleBookingDetailChange,
  handleSellingCostChange,
  addCustomer,
  clearFieldError,
  deleteCustomer,
  handleCustomerChange,
  nextStep,
}) => {
  const [expiryAlerts, setExpiryAlerts] = useState<Record<number, string>>({});
  const [customerTypeAlerts, setCustomerTypeAlerts] = useState<Record<number, string>>({});
  // Tracks which customer rows had their Customer Type manually picked from the
  // dropdown, so the DOB-based auto-calculation doesn't keep overwriting it.
  const [manualTypeOverride, setManualTypeOverride] = useState<Record<number, boolean>>({});

  const getToday = () => new Date().toISOString().split("T")[0];
  const getMaxDOB = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  // Return a valid lowercase type if API provided one
  const getSelectedType = (cust: Customer) => {
    const raw =
      (cust.customerType ?? cust.customer_type ?? "").toString().trim().toLowerCase();
    if (VALID_TYPES_LOWER.includes(raw)) {
      return raw;
    }
    return "";
  };

  // On mount or when customers change, set customerType field to lowercase if API used `customer_type`
  useEffect(() => {
    customers.forEach((cust, idx) => {
      const raw =
        (cust.customerType ?? cust.customer_type ?? "").toString().trim().toLowerCase();
      if (VALID_TYPES_LOWER.includes(raw) && cust.customerType !== raw) {
        handleCustomerChange(idx, "customerType", raw);
      }
      const errorKey = `customerType_${idx}`;
      if (VALID_TYPES_LOWER.includes(raw) && fieldErrors[errorKey]) {
        clearFieldError(errorKey);
      }
    });
  }, [customers]);

  // Auto-derive Customer Type from Date of Birth for every row that hasn't been
  // manually overridden — covers newly typed DOBs as well as customers pulled in
  // from the existing-customer search (who may carry a stale/incorrect type).
  useEffect(() => {
    customers.forEach((cust, idx) => {
      if (manualTypeOverride[idx]) return;
      if (!cust.date_of_birth) return;
      const autoType = calculateCustomerType(cust.date_of_birth, departureDate || getToday());
      if (autoType && autoType !== getSelectedType(cust)) {
        handleCustomerChange(idx, "customerType", autoType);
        clearFieldError(`customerType_${idx}`);
      }
    });
  }, [customers, departureDate]);

  // Recalculate passport-expiry warnings and the "customer type will change by
  // the return date" alert whenever the travel dates or customers change.
  useEffect(() => {
    const expiryRefDate = returnDate || departureDate;

    customers.forEach((cust, idx) => {
      // Passport expiry must be at least 6 months after the return date
      if (cust.passport_expiry && expiryRefDate) {
        const minAllowed = addMonths(expiryRefDate, 6);
        if (new Date(cust.passport_expiry) < new Date(minAllowed)) {
          setExpiryAlerts((prev) => ({
            ...prev,
            [idx]: `Passport expiry is sooner than 6 months after return date (must be on or after ${minAllowed}).`,
          }));
        } else {
          setExpiryAlerts((prev) => {
            if (!(idx in prev)) return prev;
            const copy = { ...prev };
            delete copy[idx];
            return copy;
          });
        }
      }

      // Warn if the customer's age category will change between departure and return
      if (cust.date_of_birth && departureDate && returnDate) {
        const typeAtDeparture = calculateCustomerType(cust.date_of_birth, departureDate);
        const typeAtReturn = calculateCustomerType(cust.date_of_birth, returnDate);
        if (typeAtDeparture && typeAtReturn && typeAtDeparture !== typeAtReturn) {
          setCustomerTypeAlerts((prev) => ({
            ...prev,
            [idx]: `This customer turns into a "${typeAtReturn}" by the return date (currently "${typeAtDeparture}"). Please confirm the Customer Type.`,
          }));
        } else {
          setCustomerTypeAlerts((prev) => {
            if (!(idx in prev)) return prev;
            const copy = { ...prev };
            delete copy[idx];
            return copy;
          });
        }
      }
    });
  }, [returnDate, departureDate, customers]);

  return (
    <Card sx={{ p: 2, mb: 2 }} id="booking-details">
      <Typography variant="h6" gutterBottom>
        Booking Details & Customers
      </Typography>

      {/* --- Booking Fields --- */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Booking Date"
          type="date"
          value={bookingDate}
          fullWidth
          InputProps={{ readOnly: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: "0 0 30%" }}
        />

        <TextField
          label="Departure Date"
          type="date"
          name="departureDate"
          value={departureDate}
          onChange={handleBookingDetailChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: getToday() }}
          required
          error={Boolean(fieldErrors.departureDate)}
          helperText={fieldErrors.departureDate}
          sx={{ flex: "0 0 30%" }}
        />

        {bookingType === "Flight" && (
          <FormControl fullWidth required sx={{ flex: "0 0 30%" }}>
            <InputLabel>Trip Type</InputLabel>
            <Select
              value={tripType}
              label="Trip Type"
              onChange={(e) => setTripType(e.target.value)}
            >
              <MenuItem value="one-way">One Way</MenuItem>
              <MenuItem value="return">Return</MenuItem>
            </Select>
          </FormControl>
        )}

        {tripType !== "one-way" && (
          <TextField
            label="Return Date"
            type="date"
            name="returnDate"
            value={returnDate}
            onChange={handleBookingDetailChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: departureDate || getToday(),
            }}
            required
            error={Boolean(fieldErrors.returnDate)}
            helperText={fieldErrors.returnDate}
            sx={{ flex: "0 0 30%" }}
          />
        )}

        <TextField
          label="Selling Cost"
          type="number"
          name="sellingCost"
          value={sellingCost}
          onChange={handleSellingCostChange}
          fullWidth
          required
          error={Boolean(fieldErrors.sellingCost)}
          helperText={fieldErrors.sellingCost}
          sx={{ flex: "0 0 30%" }}
        />

        <TextField
          label="Passengers Count"
          type="number"
          value={customers.length}
          fullWidth
          InputProps={{ readOnly: true }}
          sx={{ flex: "0 0 30%" }}
        />

        <FormControl fullWidth required sx={{ flex: "0 0 30%" }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth required sx={{ flex: "0 0 30%" }}>
          <InputLabel>Booking Type</InputLabel>
          <Select value={bookingType} label="Booking Type" onChange={(e) => setBookingType(e.target.value)}>
            <MenuItem value="Flight">Flight</MenuItem>
            <MenuItem value="Umrah">Umrah</MenuItem>
            <MenuItem value="Holiday">Holiday</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="h6" gutterBottom>
        Customers
      </Typography>

      {/* --- Existing Customer Search --- */}
      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ flex: "0 0 30%" }}>
          <Autocomplete
            multiple
            options={existingCustomers}
            getOptionLabel={(opt) => `${opt.passport_number} – ${opt.name}`}
            onChange={(_, vals) => {
              // Add each selected customer as a booking snapshot.
              // The first selected customer is marked as leading and has their
              // contact details (email, phone, address) pre-filled from the
              // global profile. Editing these fields during booking only affects
              // this booking — the global profile is never modified.
              const existingCount = customers.length;
              vals.forEach((c, i) => {
                addCustomer({
                  ...c,
                  is_leading: existingCount === 0 && i === 0,
                });
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Existing Customers"
                helperText="Contact details are pre-filled but only saved to this booking."
              />
            )}
          />
        </Box>

        <Box>
          <Button
            variant="contained"
            onClick={() => {
              addCustomer({
                name: "",
                passport_number: "",
                passport_expiry: "",
                issuing_country: "",
                date_of_birth: "",
                customerType: "adult", // default lowercase
              });
            }}
          >
            Add New Customer
          </Button>
        </Box>
      </Box>

      {/* --- Manual Customer Entries --- */}
      {customers.length > 0 && (
        <>
          {customers.map((cust, idx) => {
            const typeErr = fieldErrors[`customerType_${idx}`];
            const selectedType = getSelectedType(cust);

            return (
              <Box
                key={idx}
                sx={{
                  border: "1px solid #ccc",
                  p: 2,
                  mb: 2,
                  position: "relative",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Customer {idx + 1}
                </Typography>

                <Grid container spacing={2}>
                  {/* Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Name"
                      value={cust.name}
                      onChange={(e) => handleCustomerChange(idx, "name", e.target.value)}
                      fullWidth
                      required
                      error={Boolean(fieldErrors[`name_${idx}`])}
                      helperText={fieldErrors[`name_${idx}`]}
                    />
                  </Grid>

                  {/* Passport Number */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Passport Number"
                      value={cust.passport_number}
                      onChange={(e) =>
                        handleCustomerChange(idx, "passport_number", e.target.value)
                      }
                      fullWidth
                      required
                      error={Boolean(fieldErrors[`passport_number_${idx}`])}
                      helperText={fieldErrors[`passport_number_${idx}`]}
                    />
                  </Grid>

                  {/* Passport Expiry */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Passport Expiry"
                      type="date"
                      value={cust.passport_expiry}
                      onChange={(e) => {
                        handleCustomerChange(idx, "passport_expiry", e.target.value);
                      }}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: getToday() }}
                      required
                      error={Boolean(fieldErrors[`passport_expiry_${idx}`])}
                      helperText={fieldErrors[`passport_expiry_${idx}`]}
                    />
                    {expiryAlerts[idx] && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {expiryAlerts[idx]}
                      </Alert>
                    )}
                  </Grid>

                  {/* Issuing Country */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={countryList}
                      getOptionLabel={(o) => o.label}
                      value={
                        countryList.find(
                          (c) =>
                            c.code === cust.issuing_country ||
                            c.label === cust.issuing_country
                        ) || null
                      }
                      onChange={(_, v) =>
                        handleCustomerChange(idx, "issuing_country", v ? v.code : "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Issuing Country"
                          required
                          error={Boolean(fieldErrors[`issuing_country_${idx}`])}
                          helperText={fieldErrors[`issuing_country_${idx}`]}
                        />
                      )}
                    />
                  </Grid>

                  {/* Date of Birth */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      value={cust.date_of_birth}
                      onChange={(e) => {
                        // A freshly entered DOB should always win over any
                        // previous manual Customer Type selection.
                        setManualTypeOverride((prev) => {
                          if (!(idx in prev)) return prev;
                          const copy = { ...prev };
                          delete copy[idx];
                          return copy;
                        });
                        handleCustomerChange(idx, "date_of_birth", e.target.value);
                      }}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: getMaxDOB() }}
                      required
                      error={Boolean(fieldErrors[`date_of_birth_${idx}`])}
                      helperText={fieldErrors[`date_of_birth_${idx}`]}
                    />
                  </Grid>

                  {/* Customer Type */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!selectedType}>
                      <InputLabel id={`cust-type-label-${idx}`}>Customer Type</InputLabel>
                      <Select
                        labelId={`cust-type-label-${idx}`}
                        value={selectedType}
                        label="Customer Type"
                        onChange={(e) => {
                          // store in lowercase; mark as manually chosen so the
                          // DOB-based auto-calculation stops overriding it
                          setManualTypeOverride((prev) => ({ ...prev, [idx]: true }));
                          handleCustomerChange(
                            idx,
                            "customerType",
                            (e.target.value as string).toLowerCase()
                          );
                          clearFieldError(`customerType_${idx}`);
                        }}
                      >
                        <MenuItem value="infant">Infant</MenuItem>
                        <MenuItem value="child">Child</MenuItem>
                        <MenuItem value="youth">Youth</MenuItem>
                        <MenuItem value="adult">Adult</MenuItem>
                      </Select>
                      {!selectedType && (
                        <FormHelperText>
                          {fieldErrors[`customerType_${idx}`] || "Required"}
                        </FormHelperText>
                      )}
                    </FormControl>
                    {customerTypeAlerts[idx] && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        {customerTypeAlerts[idx]}
                      </Alert>
                    )}
                  </Grid>

                  {/* Residence Country */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={countryList}
                      getOptionLabel={(o) => o.label}
                      value={
                        countryList.find(
                          (c) =>
                            c.code === cust.residence_country ||
                            c.label === cust.residence_country
                        ) || null
                      }
                      onChange={(_, v) =>
                        handleCustomerChange(idx, "residence_country", v ? v.code : "")
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Residence Country" />
                      )}
                    />
                  </Grid>

                  {/* Visa Status in residence country */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Visa Status (in residence country)"
                      placeholder="e.g. Citizen, Settled/ILR, Work Visa, Visit Visa..."
                      value={cust.visa_status ?? ""}
                      onChange={(e) =>
                        handleCustomerChange(idx, "visa_status", e.target.value)
                      }
                      fullWidth
                    />
                  </Grid>

                  {/* Leading Customer Checkbox */}
                  <Grid item xs={12} sm={12} sx={{ ml: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={cust.is_leading ?? false}
                          onChange={(e) =>
                            handleCustomerChange(
                              idx,
                              "is_leading",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Leading Customer"
                    />
                  </Grid>

                  {/* Only for leading: email/address/phone */}
                  {cust.is_leading && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Email"
                          value={cust.email}
                          onChange={(e) =>
                            handleCustomerChange(idx, "email", e.target.value)
                          }
                          fullWidth
                          required
                          error={Boolean(fieldErrors[`email_${idx}`])}
                          helperText={fieldErrors[`email_${idx}`]}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Address"
                          value={cust.address}
                          onChange={(e) =>
                            handleCustomerChange(
                              idx,
                              "address",
                              e.target.value
                            )
                          }
                          fullWidth
                          required
                          error={Boolean(fieldErrors[`address_${idx}`])}
                          helperText={fieldErrors[`address_${idx}`]}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                            Phone *
                          </Typography>
                          <PhoneInput
                            defaultCountry="gb"
                            value={cust.phone ?? ""}
                            onChange={(phone) =>
                              handleCustomerChange(idx, "phone", phone)
                            }
                            style={{ width: "100%" }}
                            inputStyle={{
                              width: "100%",
                              height: "40px",
                              fontSize: "14px",
                              borderColor: fieldErrors[`phone_${idx}`] ? "#d32f2f" : undefined,
                            }}
                          />
                          {fieldErrors[`phone_${idx}`] && (
                            <Typography variant="caption" color="error">
                              {fieldErrors[`phone_${idx}`]}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                            Alternate Phone
                          </Typography>
                          <PhoneInput
                            defaultCountry="gb"
                            value={cust.alternate_phone ?? ""}
                            onChange={(phone) =>
                              handleCustomerChange(idx, "alternate_phone", phone)
                            }
                            style={{ width: "100%" }}
                            inputStyle={{ width: "100%", height: "40px", fontSize: "14px" }}
                          />
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>

                {customers.length > 1 && (
                  <IconButton
                    onClick={() => {
                      setManualTypeOverride((prev) => {
                        const next: Record<number, boolean> = {};
                        Object.entries(prev).forEach(([k, v]) => {
                          const ki = Number(k);
                          if (ki < idx) next[ki] = v;
                          else if (ki > idx) next[ki - 1] = v;
                        });
                        return next;
                      });
                      deleteCustomer(idx);
                    }}
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            );
          })}
        </>
      )}

      {globalError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {globalError}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button disabled>Back</Button>
        <Button variant="contained" onClick={nextStep}>
          Next
        </Button>
      </Box>
    </Card>
  );
};

export default StepBookingDetails;
