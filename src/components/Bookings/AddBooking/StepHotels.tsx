// src/components/steps/StepHotels.tsx
import React from "react";
import {
  Card,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  IconButton,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";

interface StepHotelsProps {
  customers: any[];
  hotelEntries: any[];
  setHotelEntries: React.Dispatch<React.SetStateAction<any[]>>;
  suppliers: any[];
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  canSeeInternalCosts?: boolean;
}

const StepHotels: React.FC<StepHotelsProps> = ({
  customers,
  hotelEntries,
  setHotelEntries,
  suppliers,
  fieldErrors,
  clearFieldError,
  nextStep,
  prevStep,
  canSeeInternalCosts,
}) => {
  const addEntry = () => {
    setHotelEntries((prev) => [
      ...prev,
      {
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
        customerIndices: [] as number[],
        globalCost: true,
        globalCostData: { cost: 0, internalCost: 0 },
        costs: {} as Record<number, { cost: number; internalCost: number }>,
        supplier_id: undefined,
        cost: 0,
        internalCost: 0,
      },
    ]);
  };

  const update = (i: number, f: string, v: any) =>
    setHotelEntries((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [f]: v } : e))
    );

  const del = (i: number) =>
    setHotelEntries((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Card sx={{ p: 2, mb: 2 }} id="hotels">
      <Typography variant="h6" sx={{ mb: 2 }}>
        Hotel Booking
      </Typography>

      {hotelEntries.map((entry: any, i: number) => {
        const nameErr = fieldErrors[`hotelName_${i}`];
        const addrErr = fieldErrors[`hotelAddress_${i}`];
        const custErr = fieldErrors[`customers_${i}`];
        const mealErr = fieldErrors[`mealType_${i}`];
        const allocErr = fieldErrors[`roomAllocation_${i}`];
        const typeErr = fieldErrors[`roomType_${i}`];
        const viewErr = fieldErrors[`roomView_${i}`];
        const viewOtherErr = fieldErrors[`roomViewOther_${i}`];
        const checkinDateErr = fieldErrors[`checkinDate_${i}`];
        const checkinTimeErr = fieldErrors[`checkinTime_${i}`];
        const checkoutDateErr = fieldErrors[`checkoutDate_${i}`];
        const nightsErr = fieldErrors[`nights_${i}`];
        const costErr = fieldErrors[`cost_${i}`];
        const intErr = fieldErrors[`internalCost_${i}`];
        const supplierErr = fieldErrors[`supplier_id_${i}`];

        return (
          <Box
            key={i}
            sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}
          >
            <Typography variant="subtitle2">Hotel Entry {i + 1}</Typography>
            <Grid container spacing={2}>
              {/* Hotel Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hotel Name"
                  value={entry.hotelName}
                  onChange={(e) => {
                    update(i, "hotelName", e.target.value);
                    clearFieldError(`hotelName_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(nameErr)}
                  helperText={nameErr}
                />
              </Grid>
              {/* Hotel Address */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hotel Address"
                  value={entry.hotelAddress}
                  onChange={(e) => {
                    update(i, "hotelAddress", e.target.value);
                    clearFieldError(`hotelAddress_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(addrErr)}
                  helperText={addrErr}
                />
              </Grid>
              {/* Select Customers */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={customers}
                  getOptionLabel={(opt: any) => opt.name || ""}
                  value={entry.customerIndices.map((ci: number) => customers[ci])}
                  onChange={(_, v: any[]) => {
                    const idxs = v.map((c) => customers.indexOf(c));
                    update(i, "customerIndices", idxs);
                    clearFieldError(`customers_${i}`);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customers"
                      required
                      error={Boolean(custErr)}
                    />
                  )}
                />
                {custErr && <FormHelperText error>{custErr}</FormHelperText>}
              </Grid>
              {/* Meal Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={Boolean(mealErr)}>
                  <InputLabel id={`meal-type-label-${i}`}>Meal Type</InputLabel>
                  <Select
                    labelId={`meal-type-label-${i}`}
                    value={entry.mealType}
                    label="Meal Type"
                    onChange={(e) => {
                      update(i, "mealType", e.target.value);
                      clearFieldError(`mealType_${i}`);
                    }}
                  >
                    <MenuItem value="Room Only">Room Only</MenuItem>
                    <MenuItem value="Breakfast">Breakfast</MenuItem>
                    <MenuItem value="Full board">Full board</MenuItem>
                    <MenuItem value="Half board">Half board</MenuItem>
                  </Select>
                  {mealErr && <FormHelperText>{mealErr}</FormHelperText>}
                </FormControl>
              </Grid>
              {/* Room Allocation */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Room Allocation"
                  type="number"
                  value={entry.roomAllocation === 0 ? "" : entry.roomAllocation}
                  onChange={(e) => {
                    update(i, "roomAllocation", Number(e.target.value));
                    clearFieldError(`roomAllocation_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(allocErr)}
                  helperText={allocErr}
                />
              </Grid>
              {/* Room Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={Boolean(typeErr)}>
                  <InputLabel id={`room-type-label-${i}`}>Room Type</InputLabel>
                  <Select
                    labelId={`room-type-label-${i}`}
                    value={entry.roomType}
                    label="Room Type"
                    onChange={(e) => {
                      update(i, "roomType", e.target.value);
                      clearFieldError(`roomType_${i}`);
                    }}
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
                  {typeErr && <FormHelperText>{typeErr}</FormHelperText>}
                </FormControl>
              </Grid>
              {/* Other Room Type (conditional) */}
              {entry.roomType === "other" && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Other Room Type"
                    value={entry.roomViewOther || ""}
                    onChange={(e) => {
                      update(i, "roomViewOther", e.target.value);
                      clearFieldError(`roomViewOther_${i}`);
                    }}
                    fullWidth
                    required
                    error={Boolean(viewOtherErr)}
                    helperText={viewOtherErr}
                  />
                </Grid>
              )}
              {/* Room View */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Room View"
                  value={entry.roomView}
                  onChange={(e) => {
                    update(i, "roomView", e.target.value);
                    clearFieldError(`roomView_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(viewErr)}
                  helperText={viewErr}
                />
              </Grid>
              {/* Remarks */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Remarks"
                  value={entry.remarks}
                  onChange={(e) => update(i, "remarks", e.target.value)}
                  fullWidth
                />
              </Grid>
              {/* Check-in Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Check-in Date"
                  type="date"
                  value={entry.checkinDate}
                  onChange={(e) => {
                    update(i, "checkinDate", e.target.value);
                    clearFieldError(`checkinDate_${i}`);
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split("T")[0] }}
                  required
                  error={Boolean(checkinDateErr)}
                  helperText={checkinDateErr}
                />
              </Grid>
              {/* Check-in Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Check-in Time"
                  type="time"
                  value={entry.checkinTime}
                  onChange={(e) => {
                    update(i, "checkinTime", e.target.value);
                    clearFieldError(`checkinTime_${i}`);
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  required
                  error={Boolean(checkinTimeErr)}
                  helperText={checkinTimeErr}
                />
              </Grid>
              {/* Check-out Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Check-out Date"
                  type="date"
                  value={entry.checkoutDate}
                  onChange={(e) => {
                    update(i, "checkoutDate", e.target.value);
                    clearFieldError(`checkoutDate_${i}`);
                  }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: entry.checkinDate || new Date().toISOString().split("T")[0],
                  }}
                  required
                  error={Boolean(checkoutDateErr)}
                  helperText={checkoutDateErr}
                />
              </Grid>
              {/* Number of Nights */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Number of Nights"
                  type="number"
                  value={entry.nights === 0 ? "" : entry.nights}
                  onChange={(e) => {
                    update(i, "nights", Number(e.target.value));
                    clearFieldError(`nights_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(nightsErr)}
                  helperText={nightsErr}
                />
              </Grid>
              {/* Cost */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cost"
                  type="number"
                  value={entry.cost === 0 ? "" : entry.cost}
                  onChange={(e) => {
                    update(i, "cost", Number(e.target.value));
                    clearFieldError(`cost_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(costErr)}
                  helperText={costErr}
                />
              </Grid>
              {/* Internal Cost */}
              {canSeeInternalCosts && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Internal Cost"
                  type="number"
                  value={entry.internalCost === 0 ? "" : entry.internalCost}
                  onChange={(e) => {
                    update(i, "internalCost", Number(e.target.value));
                    clearFieldError(`internalCost_${i}`);
                  }}
                  fullWidth
                  error={Boolean(intErr)}
                  helperText={intErr}
                />
              </Grid>
              )}
              {/* Supplier */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={sortSuppliersByType(suppliers, "hotel")}
                  groupBy={(opt) => supplierGroupLabel(opt, "hotel")}
                  getOptionLabel={(opt: any) => `${opt.name} (${opt.email})`}
                  value={
                    entry.supplier_id != null
                      ? suppliers.find((s) => s.id === entry.supplier_id) || null
                      : null
                  }
                  onChange={(_, v) => {
                    update(i, "supplier_id", v?.id);
                    clearFieldError(`supplier_id_${i}`);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier"
                      required
                      error={Boolean(supplierErr)}
                    />
                  )}
                />
                {supplierErr && <FormHelperText error>{supplierErr}</FormHelperText>}
              </Grid>
            </Grid>

            <IconButton
              onClick={() => del(i)}
              sx={{ position: "absolute", top: 8, right: 8 }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      })}

      <Button variant="outlined" onClick={addEntry}>
        Add Hotel Entry
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="contained" onClick={prevStep}>
          Back
        </Button>
        <Button variant="contained" onClick={nextStep}>
          Next
        </Button>
      </Box>
    </Card>
  );
};

export default StepHotels;
