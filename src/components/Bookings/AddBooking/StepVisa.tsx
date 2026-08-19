// src/components/steps/StepVisa.tsx
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
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Button,
  IconButton,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";

interface StepVisaProps {
  customers: any[];
  visas: any[];
  setVisas: React.Dispatch<React.SetStateAction<any[]>>;
  suppliers: any[];
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  canSeeInternalCosts?: boolean;
}

const StepVisa: React.FC<StepVisaProps> = ({
  customers,
  visas,
  setVisas,
  suppliers,
  fieldErrors,
  clearFieldError,
  nextStep,
  prevStep,
  canSeeInternalCosts,
}) => {
  const addEntry = () =>
    setVisas((prev) => [
      ...prev,
      {
        customerIndices: [] as number[],
        globalCost: true,
        globalCostData: { cost: 0, internalCost: 0 },
        costs: {} as Record<number, { cost: number; internalCost: number }>,
        visa_type: "",
        previous_nationality: "",
        validity: "",
        airlineCode: "",
        flightCode: "",
        visaStatus: "Pending",
        remarks: "",
        supplier: null as any,
      },
    ]);

  const update = (i: number, f: string, val: any) =>
    setVisas((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [f]: val } : e))
    );

  const del = (i: number) => setVisas((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Card sx={{ p: 2, mb: 2 }} id="visa">
      <Typography variant="h6" sx={{ mb: 2 }}>
        Visa Booking
      </Typography>

      {visas.map((ent: any, i: number) => {
        // error keys for this entry:
        const custErr = fieldErrors[`customers_${i}`];
        const typeErr = fieldErrors[`visa_type_${i}`];
        const prevNatErr = fieldErrors[`previous_nationality_${i}`];
        const validityErr = fieldErrors[`validity_${i}`]; // if you validate
        const airlineErr = fieldErrors[`airlineCode_${i}`];
        const flightErr = fieldErrors[`flightCode_${i}`];
        const visastatusErr = fieldErrors[`visaStatus_${i}`];
        const supplierErr = fieldErrors[`supplier_${i}`];

        const gcCostErr = fieldErrors[`globalCost_${i}_cost`];
        const gcIntErr = fieldErrors[`globalCost_${i}_internalCost`];

        return (
          <Box
            key={i}
            sx={{ border: "1px solid #ccc", p: 2, mb: 2, position: "relative" }}
          >
            <Typography variant="subtitle2">Visa Entry {i + 1}</Typography>
            <Grid container spacing={2}>
              {/* Select Customers */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={customers}
                  getOptionLabel={(opt: any) => `${opt.passport_number} - ${opt.name}`}
                  value={ent.customerIndices.map((ci: number) => customers[ci])}
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

              {/* Visa Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={Boolean(typeErr)}>
                  <InputLabel id={`visa-type-label-${i}`}>Visa Type</InputLabel>
                  <Select
                    labelId={`visa-type-label-${i}`}
                    value={ent.visa_type}
                    label="Visa Type"
                    onChange={(e) => {
                      update(i, "visa_type", e.target.value);
                      clearFieldError(`visa_type_${i}`);
                    }}
                  >
                    <MenuItem value="umrah">Umrah Visa</MenuItem>
                    <MenuItem value="tourist">Tourist Visa</MenuItem>
                    <MenuItem value="evw">EVW Visa</MenuItem>
                  </Select>
                  {typeErr && <FormHelperText>{typeErr}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Previous Nationality (only if EVW) */}
              {ent.visa_type === "evw" && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Previous Nationality"
                    value={ent.previous_nationality}
                    onChange={(e) => {
                      update(i, "previous_nationality", e.target.value);
                      clearFieldError(`previous_nationality_${i}`);
                    }}
                    fullWidth
                    required
                    error={Boolean(prevNatErr)}
                    helperText={prevNatErr}
                  />
                </Grid>
              )}

              {/* Airline Code */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Airline Code"
                  value={ent.airlineCode}
                  onChange={(e) => {
                    update(i, "airlineCode", e.target.value);
                    clearFieldError(`airlineCode_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(airlineErr)}
                  helperText={airlineErr}
                />
              </Grid>

              {/* Flight Code */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Flight Code"
                  value={ent.flightCode}
                  onChange={(e) => {
                    update(i, "flightCode", e.target.value);
                    clearFieldError(`flightCode_${i}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(flightErr)}
                  helperText={flightErr}
                />
              </Grid>

              {/* Global Cost Toggle */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={ent.globalCost}
                      onChange={(e) => update(i, "globalCost", e.target.checked)}
                    />
                  }
                  label="Use same cost for all selected customers"
                />
              </Grid>

              {ent.globalCost ? (
                <Box sx={{ width: "100%", mt: 1 }}>
                  <Grid container spacing={2}>
                    {/* Global Cost */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Cost"
                        type="number"
                        value={ent.globalCostData.cost === 0 ? "" : ent.globalCostData.cost}
                        onChange={(e) => {
                          update(i, "globalCostData", {
                            ...ent.globalCostData,
                            cost: Number(e.target.value),
                          });
                          clearFieldError(`globalCost_${i}_cost`);
                        }}
                        fullWidth
                        required
                        error={Boolean(gcCostErr)}
                        helperText={gcCostErr}
                      />
                    </Grid>

                    {/* Global Internal Cost */}
                    {canSeeInternalCosts && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Internal Cost"
                        type="number"
                        value={ent.globalCostData.internalCost === 0 ? "" : ent.globalCostData.internalCost}
                        onChange={(e) => {
                          update(i, "globalCostData", {
                            ...ent.globalCostData,
                            internalCost: Number(e.target.value),
                          });
                          clearFieldError(`globalCost_${i}_internalCost`);
                        }}
                        fullWidth
                        error={Boolean(gcIntErr)}
                        helperText={gcIntErr}
                      />
                    </Grid>
                    )}
                  </Grid>
                </Box>
              ) : (
                // Individual per-customer cost fields
                ent.customerIndices.map((ci: number) => {
                  const cd = ent.costs[ci] || { cost: 0, internalCost: 0 };
                  const costErr = fieldErrors[`cost_${i}_${ci}`];
                  const intErr = fieldErrors[`internalCost_${i}_${ci}`];

                  return (
                    <Box
                      key={ci}
                      sx={{ mb: 1, borderBottom: "1px solid #ddd", pb: 1 }}
                    >
                      <Typography variant="body2">
                        {customers[ci]?.name} (Passport:{" "}
                        {customers[ci]?.passport_number})
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Cost"
                            type="number"
                            value={cd.cost === 0 ? "" : cd.cost}
                            onChange={(e) => {
                              const newCost = Number(e.target.value);
                              setVisas((prev) =>
                                prev.map((x, idx) =>
                                  idx === i
                                    ? {
                                        ...x,
                                        costs: {
                                          ...x.costs,
                                          [ci]: {
                                            ...x.costs[ci],
                                            cost: newCost,
                                          },
                                        },
                                      }
                                    : x
                                )
                              );
                              clearFieldError(`cost_${i}_${ci}`);
                            }}
                            fullWidth
                            required
                            error={Boolean(costErr)}
                            helperText={costErr}
                          />
                        </Grid>
                        {canSeeInternalCosts && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Internal Cost"
                            type="number"
                            value={cd.internalCost === 0 ? "" : cd.internalCost}
                            onChange={(e) => {
                              const newInt = Number(e.target.value);
                              setVisas((prev) =>
                                prev.map((x, idx) =>
                                  idx === i
                                    ? {
                                        ...x,
                                        costs: {
                                          ...x.costs,
                                          [ci]: {
                                            ...x.costs[ci],
                                            internalCost: newInt,
                                          },
                                        },
                                      }
                                    : x
                                )
                              );
                              clearFieldError(`internalCost_${i}_${ci}`);
                            }}
                            fullWidth
                            error={Boolean(intErr)}
                            helperText={intErr}
                          />
                        </Grid>
                        )}
                      </Grid>
                    </Box>
                  );
                })
              )}

              {/* Visa Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={Boolean(visastatusErr)}>
                  <InputLabel id={`visa-status-label-${i}`}>Visa Status</InputLabel>
                  <Select
                    labelId={`visa-status-label-${i}`}
                    value={ent.visaStatus}
                    label="Visa Status"
                    onChange={(e) => {
                      update(i, "visaStatus", e.target.value);
                      clearFieldError(`visaStatus_${i}`);
                    }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Issued">Issued</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </Select>
                  {visastatusErr && <FormHelperText>{visastatusErr}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Remarks */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Remarks"
                  value={ent.remarks}
                  onChange={(e) => update(i, "remarks", e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* Supplier */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={sortSuppliersByType(suppliers, "visa")}
                  groupBy={(opt) => supplierGroupLabel(opt, "visa")}
                  getOptionLabel={(opt: any) => `${opt.name} (${opt.email})`}
                  value={ent.supplier}
                  onChange={(_, v) => {
                    update(i, "supplier", v);
                    clearFieldError(`supplier_${i}`);
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
        Add Visa Entry
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

export default StepVisa;
