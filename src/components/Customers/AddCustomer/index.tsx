// src/app/AddCustomer.tsx
"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Alert,
  AlertTitle,
  Autocomplete,
  Divider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import api from "@/api/api";

const countries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
];

const customerTypes = ["Adult", "Infant", "Youth", "Child"];

export default function AddCustomer() {
  const [name, setName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [issuingCountry, setIssuingCountry] =
    useState<{ code: string; name: string } | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [customerType, setCustomerType] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  // Today's date in "YYYY-MM-DD" format
  const getToday = () => new Date().toISOString().split("T")[0];
  // Date six months from today
  const getMinSixMonths = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  };
  // Date of birth cannot be in the future
  const getMaxDOB = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  // Clear specific field error on change
  const clearError = (field: string) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // Validate a single field on blur or change
  const validateField = (field: string, value: any) => {
    let msg = "";

    if (field === "name" && !value.trim()) {
      msg = "Name is required.";
    }
    if (field === "passportNumber" && !value.trim()) {
      msg = "Passport number is required.";
    }
    if (field === "passportExpiry") {
      if (!value) {
        msg = "Passport expiry is required.";
      } else if (value < getToday()) {
        msg = "Passport expiry cannot be in the past.";
      }
    }
    if (field === "issuingCountry" && !value) {
      msg = "Issuing country is required.";
    }
    if (field === "dateOfBirth") {
      if (!value) {
        msg = "Date of birth is required.";
      } else if (value > getMaxDOB()) {
        msg = "Date of birth cannot be in the future.";
      }
    }
    if (field === "customerType" && !value) {
      msg = "Customer type is required.";
    }

    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
    return msg === "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess("");
    setFieldErrors({});

    // Validate all fields
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!passportNumber.trim()) errs.passportNumber = "Passport number is required.";
    if (!passportExpiry) {
      errs.passportExpiry = "Passport expiry is required.";
    } else if (passportExpiry < getToday()) {
      errs.passportExpiry = "Passport expiry cannot be in the past.";
    }
    if (!issuingCountry) errs.issuingCountry = "Issuing country is required.";
    if (!dateOfBirth) {
      errs.dateOfBirth = "Date of birth is required.";
    } else if (dateOfBirth > getMaxDOB()) {
      errs.dateOfBirth = "Date of birth cannot be in the future.";
    }
    if (!customerType) errs.customerType = "Customer type is required.";

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError("Please fix the highlighted errors.");
      return;
    }

    try {
      await api.post("/api/customers", {
        name,
        passport_number: passportNumber,
        passport_expiry: passportExpiry,
        issuing_country: issuingCountry!.code,
        date_of_birth: dateOfBirth,
        customer_type: customerType,
      });
      setSuccess("Customer created successfully!");
      // Reset fields
      setName("");
      setPassportNumber("");
      setPassportExpiry("");
      setIssuingCountry(null);
      setDateOfBirth("");
      setCustomerType("");
    } catch (err: any) {
      const apiErr = err.response?.data?.errors || {};
      setFieldErrors((f) => ({
        ...f,
        passportNumber: apiErr.passport_number?.[0] ?? f.passportNumber,
        passportExpiry: apiErr.passport_expiry?.[0] ?? f.passportExpiry,
        dateOfBirth: apiErr.date_of_birth?.[0] ?? f.dateOfBirth,
      }));
      setError(err.response?.data?.message || "An error occurred.");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 600, mx: "auto", py: 3 }}
    >
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          Add New Customer
        </Typography>
        <Divider />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <AlertTitle>Success</AlertTitle>
            {success}
          </Alert>
        )}

        <Stack spacing={2} mt={2}>
          <TextField
            label="Customer Name *"
            variant="filled"
            fullWidth
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
            onBlur={() => validateField("name", name)}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
          />

          <TextField
            label="Passport Number *"
            variant="filled"
            fullWidth
            value={passportNumber}
            onChange={(e) => {
              setPassportNumber(e.target.value);
              clearError("passportNumber");
            }}
            onBlur={() => validateField("passportNumber", passportNumber)}
            error={!!fieldErrors.passportNumber}
            helperText={fieldErrors.passportNumber}
          />

          {/* Passport Expiry with yellow warning if less than 6 months */}
          <Box>
            <TextField
              label="Passport Expiry *"
              type="date"
              variant="filled"
              fullWidth
              value={passportExpiry}
              onChange={(e) => {
                setPassportExpiry(e.target.value);
                clearError("passportExpiry");
              }}
              onBlur={() => validateField("passportExpiry", passportExpiry)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getToday() }}
              error={!!fieldErrors.passportExpiry}
            />
            {passportExpiry && passportExpiry < getToday() ? (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                Passport expiry cannot be in the past.
              </Typography>
            ) : passportExpiry && passportExpiry < getMinSixMonths() ? (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Passport is valid but expiring within six months.
              </Alert>
            ) : fieldErrors.passportExpiry ? (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {fieldErrors.passportExpiry}
              </Typography>
            ) : (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Must be on or after {getToday()} (≥ today)
              </Typography>
            )}
          </Box>

          {/* Issuing Country */}
          <Autocomplete
            options={countries}
            getOptionLabel={(opt) => opt.name}
            value={issuingCountry}
            onChange={(_, v) => {
              setIssuingCountry(v);
              clearError("issuingCountry");
            }}
            onBlur={() =>
              validateField(
                "issuingCountry",
                issuingCountry ? issuingCountry.code : ""
              )
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Issuing Country *"
                variant="filled"
                error={!!fieldErrors.issuingCountry}
                helperText={fieldErrors.issuingCountry}
              />
            )}
          />

          <TextField
            label="Date of Birth *"
            type="date"
            variant="filled"
            fullWidth
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              clearError("dateOfBirth");
            }}
            onBlur={() => validateField("dateOfBirth", dateOfBirth)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: getMaxDOB() }}
            error={!!fieldErrors.dateOfBirth}
            helperText={
              fieldErrors.dateOfBirth || `Cannot be after ${getMaxDOB()}`
            }
          />

          <FormControl
            variant="filled"
            fullWidth
            error={!!fieldErrors.customerType}
          >
            <InputLabel shrink>Customer Type *</InputLabel>
            <Select
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                clearError("customerType");
              }}
              onBlur={() => validateField("customerType", customerType)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select type</em>
              </MenuItem>
              {customerTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.customerType && (
              <Typography variant="caption" color="error">
                {fieldErrors.customerType}
              </Typography>
            )}
          </FormControl>

          <Box textAlign="right" mt={1}>
            <Button type="submit" variant="contained">
              Save Customer
            </Button>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}
