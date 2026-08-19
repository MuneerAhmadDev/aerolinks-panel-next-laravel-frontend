// src/components/steps/StepTransport.tsx
import React, { useState } from "react";
import {
  Card,
  Typography,
  Box,
  TextField,
  Autocomplete,
  Button,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";
// Assume you have a RichTextEditor component available
import RichTextEditor from "@/components/RichTextEditor"; // Adjust the import path as necessary

interface TransportEntry {
  vehicleType: string;
  pickupFrom: string;
  pickupDateTime: string;
  dropoff: string;
  cost: number;
  internalCost: number;
  supplier_id?: number;
  sightseeing: "Yes" | "No";
  sightseeingDescription: string;
  numPassengers: number;
  transferOption: "Without Transfers" | "Sharing Transfers" | "Private Transfers";
}

interface EntryErrors {
  vehicleType?: string;
  pickupFrom?: string;
  pickupDateTime?: string;
  dropoff?: string;
  cost?: string;
  internalCost?: string;
  supplier_id?: string;
  sightseeingDescription?: string;
  numPassengers?: string;
  transferOption?: string;
}

interface StepTransportProps {
  transportEntries: TransportEntry[];
  setTransportEntries: React.Dispatch<React.SetStateAction<TransportEntry[]>>;
  suppliers: { id: number; name: string; email: string }[];
  prevStep: () => void;
  nextStep: () => void;
  canSeeInternalCosts?: boolean;
}

const StepTransport: React.FC<StepTransportProps> = ({
  transportEntries,
  setTransportEntries,
  suppliers,
  prevStep,
  nextStep,
  canSeeInternalCosts,
}) => {
  const [errors, setErrors] = useState<EntryErrors[]>(
    transportEntries.map(() => ({}))
  );

  const addEntry = () => {
    setTransportEntries((prev) => [
      ...prev,
      {
        vehicleType: "",
        pickupFrom: "",
        pickupDateTime: "",
        dropoff: "",
        cost: 0,
        internalCost: 0,
        supplier_id: undefined,
        sightseeing: "No",
        sightseeingDescription: "",
        numPassengers: 0,
        transferOption: "Without Transfers",
      },
    ]);
    setErrors((e) => [...e, {}]);
  };

  const updateEntry = (
    index: number,
    field: keyof TransportEntry,
    value: any
  ) => {
    setTransportEntries((prev) =>
      prev.map((e, i) =>
        i === index
          ? {
              ...e,
              [field]: value,
            }
          : e
      )
    );
    // Clear error for this field on change
    setErrors((errs) =>
      errs.map((err, i) =>
        i === index
          ? {
              ...err,
              [field]: undefined,
            }
          : err
      )
    );
  };

  const deleteEntry = (index: number) => {
    setTransportEntries((prev) => prev.filter((_, i) => i !== index));
    setErrors((errs) => errs.filter((_, i) => i !== index));
  };

  const validateEntries = (): boolean => {
    let valid = true;
    const newErrors: EntryErrors[] = transportEntries.map((ent) => {
      const e: EntryErrors = {};
      if (!ent.vehicleType.trim()) {
        e.vehicleType = "Vehicle Type is required";
        valid = false;
      }
      if (!ent.pickupFrom.trim()) {
        e.pickupFrom = "Pickup From is required";
        valid = false;
      }
      if (!ent.pickupDateTime) {
        e.pickupDateTime = "Pickup Date & Time is required";
        valid = false;
      }
      if (!ent.dropoff.trim()) {
        e.dropoff = "Dropoff is required";
        valid = false;
      }
      if (ent.cost === null || ent.cost === undefined || ent.cost < 0) {
        e.cost = "Cost must be a non-negative number";
        valid = false;
      }
      if (canSeeInternalCosts && (
        ent.internalCost === null ||
        ent.internalCost === undefined ||
        ent.internalCost < 0
      )) {
        e.internalCost = "Internal Cost must be a non-negative number";
        valid = false;
      }
      if (!ent.supplier_id) {
        e.supplier_id = "Supplier is required";
        valid = false;
      }
      if (!ent.transferOption) {
        e.transferOption = "Transfer Option is required";
        valid = false;
      }
      if (ent.sightseeing === "Yes") {
        if (!ent.sightseeingDescription.trim()) {
          e.sightseeingDescription =
            "Description is required when sightseeing is Yes";
          valid = false;
        }
        if (
          ent.numPassengers === null ||
          ent.numPassengers === undefined ||
          ent.numPassengers <= 0
        ) {
          e.numPassengers =
            "Number of Passengers must be greater than zero";
          valid = false;
        }
      }
      return e;
    });

    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateEntries()) {
      nextStep();
    }
  };

  return (
    <Card sx={{ p: 2, mb: 2 }} id="transport">
      <Typography variant="h6" gutterBottom>
        Transport
      </Typography>

      {transportEntries.map((ent: TransportEntry, i: number) => (
        <Box
          key={i}
          sx={{
            border: "1px dashed #aaa",
            p: 2,
            mb: 2,
            position: "relative",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Transport Entry {i + 1}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Vehicle Type"
                value={ent.vehicleType}
                onChange={(e) =>
                  updateEntry(i, "vehicleType", e.target.value)
                }
                fullWidth
                required
                error={Boolean(errors[i]?.vehicleType)}
                helperText={errors[i]?.vehicleType}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Pickup From"
                value={ent.pickupFrom}
                onChange={(e) =>
                  updateEntry(i, "pickupFrom", e.target.value)
                }
                fullWidth
                required
                error={Boolean(errors[i]?.pickupFrom)}
                helperText={errors[i]?.pickupFrom}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Pickup Date & Time"
                type="datetime-local"
                value={ent.pickupDateTime}
                onChange={(e) =>
                  updateEntry(i, "pickupDateTime", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
                error={Boolean(errors[i]?.pickupDateTime)}
                helperText={errors[i]?.pickupDateTime}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Dropoff"
                value={ent.dropoff}
                onChange={(e) => updateEntry(i, "dropoff", e.target.value)}
                fullWidth
                required
                error={Boolean(errors[i]?.dropoff)}
                helperText={errors[i]?.dropoff}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Cost"
                type="number"
                value={ent.cost === 0 ? "" : ent.cost}
                onChange={(e) =>
                  updateEntry(i, "cost", Number(e.target.value))
                }
                fullWidth
                required
                error={Boolean(errors[i]?.cost)}
                helperText={errors[i]?.cost}
              />
            </Box>

            {canSeeInternalCosts && (
            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Internal Cost"
                type="number"
                value={ent.internalCost === 0 ? "" : ent.internalCost}
                onChange={(e) =>
                  updateEntry(i, "internalCost", Number(e.target.value))
                }
                fullWidth
                error={Boolean(errors[i]?.internalCost)}
                helperText={errors[i]?.internalCost}
              />
            </Box>
            )}

            <Box sx={{ flex: "1 1 45%" }}>
              <Autocomplete
                options={sortSuppliersByType(suppliers, "transport")}
                groupBy={(opt) => supplierGroupLabel(opt, "transport")}
                getOptionLabel={(opt: any) => `${opt.name} (${opt.email})`}
                value={
                  ent.supplier_id
                    ? suppliers.find((s) => s.id === ent.supplier_id) || null
                    : null
                }
                onChange={(_, v) =>
                  updateEntry(i, "supplier_id", v?.id ?? undefined)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supplier"
                    required
                    error={Boolean(errors[i]?.supplier_id)}
                    helperText={errors[i]?.supplier_id}
                    fullWidth
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="No. of Passengers"
                type="number"
                value={ent.numPassengers === 0 ? "" : ent.numPassengers}
                onChange={(e) =>
                  updateEntry(i, "numPassengers", Number(e.target.value))
                }
                fullWidth
                required={ent.sightseeing === "Yes"}
                error={Boolean(errors[i]?.numPassengers)}
                helperText={errors[i]?.numPassengers}
              />
            </Box>
            {/* Transfer Option */}
            <Box sx={{ flex: "1 1 45%" }}>
              <FormControl
                fullWidth
                required
                error={Boolean(errors[i]?.transferOption)}
              >
                <InputLabel id={`transfer-option-label-${i}`}>
                  Transfer Option
                </InputLabel>
                <Select
                  labelId={`transfer-option-label-${i}`}
                  value={ent.transferOption}
                  label="Transfer Option"
                  onChange={(e) =>
                    updateEntry(
                      i,
                      "transferOption",
                      e.target.value as
                        | "Without Transfers"
                        | "Sharing Transfers"
                        | "Private Transfers"
                    )
                  }
                >
                  <MenuItem value="Without Transfers">
                    Without Transfers
                  </MenuItem>
                  <MenuItem value="Sharing Transfers">
                    Sharing Transfers
                  </MenuItem>
                  <MenuItem value="Private Transfers">
                    Private Transfers
                  </MenuItem>
                </Select>
                {errors[i]?.transferOption && (
                  <FormHelperText>{errors[i]?.transferOption}</FormHelperText>
                )}
              </FormControl>
            </Box>
            {/* Sightseeing Yes/No */}
            <Box sx={{ flex: "1 1 45%" }}>
              <FormControl fullWidth>
                <InputLabel id={`sightseeing-label-${i}`}>
                  Sightseeing
                </InputLabel>
                <Select
                  labelId={`sightseeing-label-${i}`}
                  value={ent.sightseeing}
                  label="Sightseeing"
                  onChange={(e) =>
                    updateEntry(i, "sightseeing", e.target.value as "Yes" | "No")
                  }
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {ent.sightseeing === "Yes" && (
              <Box sx={{ flex: "1 1 100%" }}>
                <Typography variant="body2" gutterBottom>
                  Sightseeing Description
                </Typography>
                <RichTextEditor
                  value={ent.sightseeingDescription}
                  onChange={(val: string) =>
                    updateEntry(i, "sightseeingDescription", val)
                  }
                />
                {errors[i]?.sightseeingDescription && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5 }}
                  >
                    {errors[i]?.sightseeingDescription}
                  </Typography>
                )}
              </Box>
            )}

            
          </Box>

          <IconButton
            onClick={() => deleteEntry(i)}
            sx={{ position: "absolute", top: 8, right: 8 }}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}

      <Button variant="outlined" onClick={addEntry}>
        Add Transport Entry
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="contained" onClick={prevStep}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </Card>
  );
};

export default StepTransport;
