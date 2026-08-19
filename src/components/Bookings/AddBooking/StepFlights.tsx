// src/components/steps/StepFlights.tsx
import React from "react";
import {
  Card,
  Typography,
  Box,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Autocomplete } from "@mui/material";
// Assume you have a RichTextEditor component available
// import RichTextEditor from "../RichTextEditor";
import RichTextEditor from "@/components/RichTextEditor";
import PnrParserPanel, { ParsedPnr } from "./PnrParserPanel";
import { sortSuppliersByType, supplierGroupLabel } from "@/utils/supplierSort";

interface StepFlightsProps {
  customers: any[];
  suppliers: any[];
  globalFlights: any[];
  setGlobalFlights: React.Dispatch<React.SetStateAction<any[]>>;
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  canSeeInternalCosts?: boolean;
}

const StepFlights: React.FC<StepFlightsProps> = ({
  customers,
  suppliers,
  globalFlights,
  setGlobalFlights,
  fieldErrors,
  clearFieldError,
  nextStep,
  prevStep,
  canSeeInternalCosts,
}) => {
  const addEntry = () => {
    setGlobalFlights((prev) => [
      ...prev,
      {
        pnr: "",
        itinerary: "",
        customerIndices: [] as number[],
        issuedFare: 0,
        remarks: "",
        atol: false,
        globalCost: true,
        globalCostData: { cost: 0, internalCost: 0 },
        costs: {} as Record<number, { cost: number; internalCost: number }>,
        supplier_id: undefined,
      },
    ]);
  };

  const updateEntry = (i: number, field: string, val: any) =>
    setGlobalFlights((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: val } : e))
    );

  const deleteEntry = (i: number) =>
    setGlobalFlights((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Card sx={{ p: 2, mb: 2 }} id="flights">
      <Typography variant="h6" sx={{ mb: 2 }}>
        Flights
      </Typography>

      {globalFlights.map((entry: any, ei: number) => {
        const pnrErr = fieldErrors[`pnr_${ei}`];
        const itinErr = fieldErrors[`itinerary_${ei}`];
        const custErr = fieldErrors[`customers_${ei}`];
        const fareErr = fieldErrors[`issuedFare_${ei}`];
        const supplierErr = fieldErrors[`supplier_${ei}`];

        return (
          <Box
            key={ei}
            sx={{ border: "1px dashed #aaa", p: 2, mb: 2, position: "relative" }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Flight Entry {ei + 1}
            </Typography>

            {/* Smart PNR Auto-Fill */}
            <PnrParserPanel
              onApply={(parsed: ParsedPnr) => {
                if (parsed.pnr) {
                  updateEntry(ei, "pnr", parsed.pnr);
                  clearFieldError(`pnr_${ei}`);
                }
                // Build itinerary string from parsed fields
                const parts: string[] = [];
                if (parsed.airline && parsed.flightNumber)
                  parts.push(`${parsed.airline}${parsed.flightNumber}`);
                if (parsed.departureAirport && parsed.arrivalAirport)
                  parts.push(`${parsed.departureAirport}-${parsed.arrivalAirport}`);
                if (parsed.departureDateTime)
                  parts.push(parsed.departureDateTime);
                if (parsed.arrivalTime)
                  parts.push(`Arr: ${parsed.arrivalTime}`);
                if (parts.length > 0) {
                  const itinerary = parts.join(" | ");
                  updateEntry(ei, "itinerary", itinerary);
                  clearFieldError(`itinerary_${ei}`);
                }
              }}
            />

            <Grid container spacing={2}>
              {/* PNR */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="PNR No"
                  value={entry.pnr}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateEntry(ei, "pnr", val);
                    clearFieldError(`pnr_${ei}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(pnrErr)}
                  helperText={pnrErr}
                />
              </Grid>

              {/* Supplier */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={sortSuppliersByType(suppliers, "flight")}
                  groupBy={(opt) => supplierGroupLabel(opt, "flight")}
                  getOptionLabel={(opt: any) => `${opt.name} (${opt.email})`}
                  value={suppliers.find((s) => s.id === entry.supplier_id) || null}
                  onChange={(_, v: any | null) => {
                    updateEntry(ei, "supplier_id", v?.id);
                    clearFieldError(`supplier_${ei}`);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier"
                      fullWidth
                      required
                      error={Boolean(supplierErr)}
                      helperText={supplierErr}
                    />
                  )}
                />
              </Grid>

              {/* Select Customers */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={customers}
                  getOptionLabel={(opt: any) => opt.name || ""}
                  value={entry.customerIndices.map((i: number) => customers[i])}
                  onChange={(_, v: any[]) => {
                    const idxs = v.map((c) => customers.indexOf(c));
                    updateEntry(ei, "customerIndices", idxs);
                    clearFieldError(`customers_${ei}`);
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

              {/* Issued Fare */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Issued Fare"
                  type="number"
                  value={entry.issuedFare === 0 ? "" : entry.issuedFare}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    // Always update issuedFare
                    let updated: any = { ...entry, issuedFare: val };
                    // If globalCost is checked, set globalCostData.cost = issuedFare
                    if (entry.globalCost) {
                      updated.globalCostData = {
                        ...entry.globalCostData,
                        cost: val,
                      };
                    }
                    setGlobalFlights((prev) =>
                      prev.map((ent, idx) => (idx === ei ? updated : ent))
                    );
                    clearFieldError(`issuedFare_${ei}`);
                  }}
                  fullWidth
                  required
                  error={Boolean(fareErr)}
                  helperText={fareErr}
                />
              </Grid>

              {/* Remarks */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Remarks"
                  value={entry.remarks}
                  onChange={(e) => updateEntry(ei, "remarks", e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* ATOL */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={entry.atol}
                      onChange={(e) => updateEntry(ei, "atol", e.target.checked)}
                    />
                  }
                  label="ATOL"
                />
              </Grid>
            </Grid>

            {/* Global Cost Toggle */}
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={entry.globalCost}
                    onChange={(e) => {
                      const isGlobal = e.target.checked;
                      let updated: any = { ...entry, globalCost: isGlobal };
                      if (isGlobal) {
                        updated.globalCostData = {
                          ...entry.globalCostData,
                          cost: entry.issuedFare,
                        };
                      }
                      setGlobalFlights((prev) =>
                        prev.map((ent, idx) => (idx === ei ? updated : ent))
                      );
                    }}
                  />
                }
                label="Use same cost for all selected customers"
              />
            </Box>

            {entry.globalCost ? (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  border: "1px solid #eee",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <Grid container spacing={2}>
                  {/* Global Cost */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Cost"
                      type="number"
                      value={entry.globalCostData.cost === 0 ? "" : entry.globalCostData.cost}
                      onChange={(e) => {
                        const newCost = Number(e.target.value);
                        updateEntry(ei, "globalCostData", {
                          ...entry.globalCostData,
                          cost: newCost,
                        });
                        clearFieldError(`globalCost_${ei}_cost`);
                      }}
                      fullWidth
                      required
                      error={Boolean(fieldErrors[`globalCost_${ei}_cost`])}
                      helperText={fieldErrors[`globalCost_${ei}_cost`]}
                    />
                  </Grid>
                  {/* Global Internal Cost */}
                  {canSeeInternalCosts && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Internal Cost"
                      type="number"
                      value={entry.globalCostData.internalCost === 0 ? "" : entry.globalCostData.internalCost}
                      onChange={(e) => {
                        const newInternal = Number(e.target.value);
                        updateEntry(ei, "globalCostData", {
                          ...entry.globalCostData,
                          internalCost: newInternal,
                        });
                        clearFieldError(`globalCost_${ei}_internalCost`);
                      }}
                      fullWidth
                      error={Boolean(fieldErrors[`globalCost_${ei}_internalCost`])}
                      helperText={fieldErrors[`globalCost_${ei}_internalCost`]}
                    />
                  </Grid>
                  )}
                </Grid>
              </Box>
            ) : (
              entry.customerIndices.map((ci: number) => {
                const cdata = entry.costs[ci] || { cost: 0, internalCost: 0 };
                const costErr = fieldErrors[`cost_${ei}_${ci}`];
                const intErr = fieldErrors[`internalCost_${ei}_${ci}`];

                return (
                  <Box
                    key={ci}
                    sx={{ mb: 2, borderBottom: "1px solid #ddd", pb: 1 }}
                  >
                    <Typography variant="body2">
                      {customers[ci]?.name} (Passport:{" "}
                      {customers[ci]?.passport_number})
                    </Typography>
                    <Grid container spacing={2}>
                      {/* Customer-specific Cost */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Cost"
                          type="number"
                          value={cdata.cost === 0 ? "" : cdata.cost}
                          onChange={(e) => {
                            const newCost = Number(e.target.value);
                            setGlobalFlights((prev) =>
                              prev.map((ent, idx) =>
                                idx === ei
                                  ? {
                                      ...ent,
                                      costs: {
                                        ...ent.costs,
                                        [ci]: {
                                          ...ent.costs[ci],
                                          cost: newCost,
                                        },
                                      },
                                    }
                                  : ent
                              )
                            );
                            clearFieldError(`cost_${ei}_${ci}`);
                          }}
                          fullWidth
                          required
                          error={Boolean(costErr)}
                          helperText={costErr}
                        />
                      </Grid>
                      {/* Customer-specific Internal Cost */}
                      {canSeeInternalCosts && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Internal Cost"
                          type="number"
                          value={cdata.internalCost === 0 ? "" : cdata.internalCost}
                          onChange={(e) => {
                            const newInt = Number(e.target.value);
                            setGlobalFlights((prev) =>
                              prev.map((ent, idx) =>
                                idx === ei
                                  ? {
                                      ...ent,
                                      costs: {
                                        ...ent.costs,
                                        [ci]: {
                                          ...ent.costs[ci],
                                          internalCost: newInt,
                                        },
                                      },
                                    }
                                  : ent
                              )
                            );
                            clearFieldError(`internalCost_${ei}_${ci}`);
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

            {/* PNR Itinerary as RichTextEditor (moved to bottom) */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                PNR Itinerary
              </Typography>
              <RichTextEditor
                value={entry.itinerary}
                onChange={(val: string) => {
                  updateEntry(ei, "itinerary", val);
                  clearFieldError(`itinerary_${ei}`);
                }}
              />
              {itinErr && (
                <FormHelperText error>{itinErr}</FormHelperText>
              )}
            </Box>

            <IconButton
              onClick={() => deleteEntry(ei)}
              sx={{ position: "absolute", top: 8, right: 8 }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      })}

      <Button variant="outlined" onClick={addEntry}>
        Add Flight Entry
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

export default StepFlights;
