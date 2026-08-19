// components/PaymentCards.tsx
"use client";

import React from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  LinearProgress,
  Stack,
  Divider,
  useTheme,
  Chip,
  Grid,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

export interface PaymentEntry {
  id?: number;
  booking_number?: string;
  amount: string | number;
  payment_date: string;
  payment_method: string;
}

interface PaymentCardsProps {
  payments: PaymentEntry[];
  totalCost: number;
  bookingNumber?: string;
}

export default function PaymentCards({
  payments,
  totalCost,
  bookingNumber,
}: PaymentCardsProps) {
  const theme = useTheme();

  // 1) compute totals
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const amountPending = Math.max(totalCost - totalPaid, 0);
  const percentPaid =
    totalCost > 0 ? Math.min((totalPaid / totalCost) * 100, 100) : 0;

  // 2) status flags
  const isUnpaid = totalPaid === 0;
  const isPartial = totalPaid > 0 && totalPaid < totalCost;
  const isFull = totalPaid >= totalCost;

  // 3) choose colors & icons
  const barColor = isFull
    ? theme.palette.success.main
    : isPartial
    ? theme.palette.warning.main
    : theme.palette.error.main;
  const headerAccent = isFull
    ? theme.palette.success.light
    : isPartial
    ? theme.palette.warning.light
    : theme.palette.error.light;

  const HeaderIcon = isFull
    ? CheckCircleIcon
    : isPartial
    ? HourglassEmptyIcon
    : ErrorOutlineIcon;

  const statusLabel = isFull
    ? "Fully Paid"
    : isPartial
    ? "Partially Paid"
    : "No Payments";

  const statusColor = isFull ? "success" : isPartial ? "warning" : "error";

  const rowBorder = `1px solid ${theme.palette.divider}`;

  return (
    <Card
      elevation={4}
      sx={{
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        borderTop: `8px solid ${headerAccent}`,
      }}
    >
      {/* Header with dynamic icon + status chip */}
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: barColor }}>
            <HeaderIcon />
          </Avatar>
        }
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight="bold">
              Payment History
            </Typography>
            <Chip
              label={statusLabel}
              size="small"
              color={statusColor}
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            {payments.length} record{payments.length !== 1 && "s"} •{" "}
            <strong>
              {totalPaid.toFixed(2)} / {totalCost.toFixed(2)}
            </strong>
          </Typography>
        }
      />

      {/* Progress bar */}
      <Box sx={{ px: 3, pb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={percentPaid}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.palette.grey[200],
            "& .MuiLinearProgress-bar": {
              backgroundColor: barColor,
            },
          }}
        />
      </Box>

      <Divider />

      {/* Table-like header row */}
      <CardContent sx={{ py: 0 }}>
        <Grid
          container
          alignItems="center"
          spacing={1}
          sx={{ borderBottom: rowBorder, py: 1, fontWeight: "bold" }}
        >
          <Grid item xs={1}>
            Sr
          </Grid>
          <Grid item xs={3}>
            Booking No
          </Grid>
          <Grid item xs={3}>
            Payment Date
          </Grid>
          <Grid item xs={2} textAlign="right">
            Amount
          </Grid>
          <Grid item xs={3}>
            Method
          </Grid>
        </Grid>

        {/* Payment rows */}
        {payments.map((p, idx) => {
          const amt = Number(p.amount);
          return (
            <Grid
              container
              alignItems="center"
              spacing={1}
              key={p.id ?? `${p.payment_date}-${amt}-${idx}`}
              sx={{
                borderBottom:
                  idx < payments.length - 1 ? rowBorder : "none",
                py: 1,
              }}
            >
              <Grid item xs={1}>
                {idx + 1}
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">
                  {p.booking_number || bookingNumber || "—"}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">
                  {p.payment_date.slice(0, 10)}
                </Typography>
              </Grid>
              <Grid item xs={2} textAlign="right">
                <Typography variant="body2">£{amt.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">
                  {p.payment_method}
                </Typography>
              </Grid>
            </Grid>
          );
        })}
      </CardContent>

      <Divider />

      {/* Footer summary */}
      <Box sx={{ px: 3, py: 2 }}>
        <Grid container>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
                Amount Pending:{" "}
                <Box component="span" sx={{ color: barColor }}>
                    £{amountPending.toFixed(2)}
                </Box>
            </Typography>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="success.main"
            >
              Amount Received: £{totalPaid.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}
