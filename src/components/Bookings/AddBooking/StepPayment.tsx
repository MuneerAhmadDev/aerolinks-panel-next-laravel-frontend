// src/components/steps/StepPayment.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Box,
  TextField,
  Button,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface PaymentEntry {
  amount: number;
  payment_date: string;
  payment_method: string;
}

interface PaymentErrors {
  amount?: string;
  payment_method?: string;
}

const StepPayment: React.FC<any> = ({
  sellingCost,
  payments,
  setPayments,
  prevStep,
  totalPayment,
  onSubmit,
}) => {
  const [errors, setErrors] = useState<PaymentErrors[]>(
    payments.map(() => ({}))
  );

  // Ensure `errors` array length matches `payments`
  useEffect(() => {
    setErrors((prev) => {
      const diff = payments.length - prev.length;
      if (diff > 0) {
        return [...prev, ...Array(diff).fill({})];
      } else if (diff < 0) {
        return prev.slice(0, payments.length);
      }
      return prev;
    });
  }, [payments]);

  // Recalculate dynamic errors whenever payments or sellingCost change
  useEffect(() => {
    const newErrors: PaymentErrors[] = payments.map((pay:any, idx:any) => {
      const e: PaymentErrors = {};
      // Total of all amounts
      const total = payments.reduce((sum:any, p:any) => sum + p.amount, 0);
      // Sum without this entry
      const sumWithout = total - pay.amount;
      // Remaining available for this entry
      const remaining = Number(sellingCost) - sumWithout;

      if (pay.amount <= 0) {
        e.amount = "Amount must be greater than zero";
      } else {
        if (idx === 0) {
          // For the first entry, only check against full sellingCost
          if (pay.amount > Number(sellingCost)) {
            e.amount = `Cannot exceed selling amount (${sellingCost})`;
          }
        } else {
          // For subsequent entries, check against remaining
          if (pay.amount > remaining) {
            e.amount = `Max allowed: ${remaining}`;
          }
        }
      }

      if (!pay.payment_method) {
        e.payment_method = "Required";
      }

      return e;
    });

    setErrors(newErrors);
  }, [payments, sellingCost]);

  const addEntry = () => {
    setPayments((prev: PaymentEntry[]) => [
      ...prev,
      { amount: 0, payment_date: "", payment_method: "" },
    ]);
  };

  const updateEntry = (
    index: number,
    field: keyof PaymentEntry,
    value: any
  ) => {
    setPayments((prev: PaymentEntry[]) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const deleteEntry = (index: number) => {
    setPayments((prev: PaymentEntry[]) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const oneMonthAhead = new Date();
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);
  const isOverdue =
    new Date() < oneMonthAhead && totalPayment < Number(sellingCost);

  const validateEntries = (): boolean => {
    // Prevent submission if any field-level error exists
    return errors.every((e) => !e.amount && !e.payment_method);
  };

  const handleSubmit = () => {
    if (validateEntries()) {
      onSubmit();
    }
  };

  return (
    <Card sx={{ p: 2, mb: 2 }} id="payment">
      <Typography variant="h6" gutterBottom>
        Payment
      </Typography>

      <Typography>Total Selling Cost: {sellingCost}</Typography>
      <Typography>Total Paid: {totalPayment}</Typography>

      {isOverdue && (
        <Alert severity="warning" sx={{ my: 2 }}>
          Payment is overdue: less than one month to departure and not fully
          paid.
        </Alert>
      )}

      {payments.map((pay: PaymentEntry, i: number) => (
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
            Payment Entry {i + 1}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ flex: "1 1 30%" }}>
              <TextField
                label="Amount"
                type="number"
                value={pay.amount === 0 ? "" : pay.amount}
                onChange={(e) =>
                  updateEntry(i, "amount", Number(e.target.value))
                }
                required
                fullWidth
                error={Boolean(errors[i]?.amount)}
                helperText={errors[i]?.amount}
              />
            </Box>

            <Box sx={{ flex: "1 1 30%" }}>
              <TextField
                label="Payment Date"
                type="datetime-local"
                value={pay.payment_date}
                onChange={(e) =>
                  updateEntry(i, "payment_date", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box sx={{ flex: "1 1 30%" }}>
              <FormControl
                fullWidth
                required
                error={Boolean(errors[i]?.payment_method)}
              >
                <InputLabel id={`method-label-${i}`}>Method</InputLabel>
                <Select
                  labelId={`method-label-${i}`}
                  value={pay.payment_method}
                  label="Method"
                  onChange={(e) =>
                    updateEntry(i, "payment_method", e.target.value)
                  }
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                </Select>
                <FormHelperText>{errors[i]?.payment_method}</FormHelperText>
              </FormControl>
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
        Add Payment Entry
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="contained" onClick={prevStep}>
          Back
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Submit Booking
        </Button>
      </Box>
    </Card>
  );
};

export default StepPayment;
