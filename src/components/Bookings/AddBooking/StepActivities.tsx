// src/components/steps/StepActivities.tsx
import React, { useState } from "react";
import {
  Card,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  IconButton,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";
// Assume you have a RichTextEditor component available
// import RichTextEditor from "../RichTextEditor";
import RichTextEditor from "@/components/RichTextEditor"; // Adjust the import path as necessary

interface ActivityEntry {
  activity_name: string;
  pickup_location: string;
  datetime: string;
  guide: "Yes" | "No";
  guideCost: number;
  cost: number;
  internalCost: number;
  supplier_id?: number;
  amenities: string;
  remarks: string;
}

interface ActivityErrors {
  activity_name?: string;
  pickup_location?: string;
  datetime?: string;
  guideCost?: string;
  cost?: string;
  internalCost?: string;
  supplier_id?: string;
  // No validation for amenities or remarks by default
}

const StepActivities: React.FC<any> = ({
  activitiesEntries,
  setActivitiesEntries,
  suppliers,
  prevStep,
  nextStep,
  canSeeInternalCosts,
}) => {
  const [errors, setErrors] = useState<ActivityErrors[]>(
    activitiesEntries.map(() => ({}))
  );

  const addEntry = () => {
    setActivitiesEntries((a: ActivityEntry[]) => [
      ...a,
      {
        activity_name: "",
        pickup_location: "",
        datetime: "",
        guide: "No",
        guideCost: 0,
        cost: 0,
        internalCost: 0,
        supplier_id: undefined,
        amenities: "",
        remarks: "",
      },
    ]);
    setErrors((e) => [...e, {}]);
  };

  const updateEntry = (
    index: number,
    field: keyof ActivityEntry,
    value: any
  ) => {
    setActivitiesEntries((a: ActivityEntry[]) =>
      a.map((e, i) => (i === index ? { ...e, [field]: value } : e))
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
    setActivitiesEntries((a: ActivityEntry[]) =>
      a.filter((_, i) => i !== index)
    );
    setErrors((errs) => errs.filter((_, i) => i !== index));
  };

  const validateEntries = (): boolean => {
    let valid = true;
    const newErrors: ActivityErrors[] = activitiesEntries.map((ent:any) => {
      const e: ActivityErrors = {};

      if (!ent.activity_name.trim()) {
        e.activity_name = "Activity Name is required";
        valid = false;
      }
      if (!ent.pickup_location.trim()) {
        e.pickup_location = "Pickup Location is required";
        valid = false;
      }
      if (!ent.datetime) {
        e.datetime = "Date & Time is required";
        valid = false;
      }
      if (ent.guide === "Yes") {
        if (ent.guideCost === null || ent.guideCost === undefined || ent.guideCost < 0) {
          e.guideCost = "Guide Cost must be a non-negative number";
          valid = false;
        }
      }
      if (ent.cost === null || ent.cost === undefined || ent.cost < 0) {
        e.cost = "Cost must be a non-negative number";
        valid = false;
      }
      if (canSeeInternalCosts && (ent.internalCost === null || ent.internalCost === undefined || ent.internalCost < 0)) {
        e.internalCost = "Internal Cost must be a non-negative number";
        valid = false;
      }
      if (!ent.supplier_id) {
        e.supplier_id = "Supplier is required";
        valid = false;
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
    <Card sx={{ p: 2, mb: 2 }} id="activities">
      <Typography variant="h6" gutterBottom>
        Activities
      </Typography>

      {activitiesEntries.map((ent: ActivityEntry, i: number) => (
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
            Activity Entry {i + 1}
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
                label="Activity Name"
                value={ent.activity_name}
                onChange={(e) =>
                  updateEntry(i, "activity_name", e.target.value)
                }
                fullWidth
                required
                error={Boolean(errors[i]?.activity_name)}
                helperText={errors[i]?.activity_name}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Pickup Location"
                value={ent.pickup_location}
                onChange={(e) =>
                  updateEntry(i, "pickup_location", e.target.value)
                }
                fullWidth
                required
                error={Boolean(errors[i]?.pickup_location)}
                helperText={errors[i]?.pickup_location}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Date & Time"
                type="datetime-local"
                value={ent.datetime}
                onChange={(e) => updateEntry(i, "datetime", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
                error={Boolean(errors[i]?.datetime)}
                helperText={errors[i]?.datetime}
              />
            </Box>

            <Box sx={{ flex: "1 1 45%" }}>
              <FormControl fullWidth required>
                <InputLabel id={`guide-label-${i}`}>Guide</InputLabel>
                <Select
                  labelId={`guide-label-${i}`}
                  value={ent.guide}
                  label="Guide"
                  onChange={(e) =>
                    updateEntry(i, "guide", e.target.value as "Yes" | "No")
                  }
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {ent.guide === "Yes" && (
              <Box sx={{ flex: "1 1 45%" }}>
                <TextField
                  label="Guide Cost"
                  type="number"
                  value={ent.guideCost === 0 ? "" : ent.guideCost}
                  onChange={(e) =>
                    updateEntry(i, "guideCost", Number(e.target.value))
                  }
                  fullWidth
                  required
                  error={Boolean(errors[i]?.guideCost)}
                  helperText={errors[i]?.guideCost}
                />
              </Box>
            )}

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
                options={sortSuppliersByType(suppliers, "Activities")}
                groupBy={(opt) => supplierGroupLabel(opt, "Activities")}
                getOptionLabel={(opt: any) => `${opt.name} (${opt.email})`}
                onChange={(_, v) => updateEntry(i, "supplier_id", v?.id)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supplier"
                    required
                    error={Boolean(errors[i]?.supplier_id)}
                    helperText={errors[i]?.supplier_id} 
                  />
                )}
                fullWidth
              />
            </Box>
            {/* Remarks */}
            <Box sx={{ flex: "1 1 45%" }}>
              <TextField
                label="Remarks"
                value={ent.remarks}
                onChange={(e) => updateEntry(i, "remarks", e.target.value)}
                fullWidth
              />
            </Box>
            {/* Amenities */}
            <Box sx={{ flex: "1 1 100%" }}>
              <Typography variant="body2" gutterBottom>
                Amenities
              </Typography>
              <RichTextEditor
                value={ent.amenities}
                onChange={(val: string) => updateEntry(i, "amenities", val)}
              />
            </Box>

            
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
        Add Activity Entry
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

export default StepActivities;
