// src/components/steps/StepReview.tsx
"use client";

import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  Paper,
  Avatar,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import HotelIcon from "@mui/icons-material/Hotel";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// ── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, count, children }) => (
  <Paper
    variant="outlined"
    sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        bgcolor: "rgba(96,93,255,0.05)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
        {title}
      </Typography>
      {count !== undefined && (
        <Chip
          label={count}
          size="small"
          sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 700, height: 22 }}
        />
      )}
    </Box>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Paper>
);

// ── Field tile ───────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>
      {value || "—"}
    </Typography>
  </Box>
);

// ── Component ────────────────────────────────────────────────────────────────

const StepReview: React.FC<any> = ({
  bookingDate,
  departureDate,
  returnDate,
  sellingCost,
  customers,
  globalFlights,
  hotelEntries,
  visas,
  transportEntries,
  activitiesEntries,
  prevStep,
  nextStep,
}) => (
  <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
    {/* ── Hero banner ───────────────────────────────────────────────── */}
    <Box
      sx={{
        background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
        px: 3,
        py: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
        <CheckCircleIcon sx={{ color: "#fff" }} />
      </Avatar>
      <Box>
        <Typography variant="h6" fontWeight={700} color="#fff">
          Review Booking
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
          Please verify all details before submitting
        </Typography>
      </Box>
    </Box>

    <CardContent sx={{ p: 3 }}>
      {/* ── Summary ─────────────────────────────────────────────────── */}
      <Section icon={<CalendarMonthIcon />} title="Summary">
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Field label="Booking Date" value={bookingDate} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Field label="Departure" value={departureDate} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Field label="Return" value={returnDate} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Field
              label="Selling Cost"
              value={
                sellingCost ? (
                  <Box component="span" sx={{ color: "success.main", fontWeight: 700 }}>
                    £{Number(sellingCost).toLocaleString()}
                  </Box>
                ) : undefined
              }
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Field
              label="Passengers"
              value={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <PeopleIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  {customers.length}
                </Box>
              }
            />
          </Grid>
        </Grid>
      </Section>

      {/* ── Customers ───────────────────────────────────────────────── */}
      <Section
        icon={<PeopleIcon />}
        title="Customers"
        count={customers.length}
      >
        {customers.length > 0 ? (
          <Stack spacing={1}>
            {customers.map((c: any, i: number) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: c.is_leading ? "primary.main" : "action.selected",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {(c.name || "?")[0].toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>
                    {c.name}
                    {c.is_leading && (
                      <Chip
                        label="Lead"
                        size="small"
                        sx={{ ml: 1, height: 18, fontSize: 10, bgcolor: "primary.main", color: "#fff" }}
                      />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.passport_number}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No customers added.
          </Typography>
        )}
      </Section>

      {/* ── Flights ─────────────────────────────────────────────────── */}
      {globalFlights?.length > 0 && (
        <Section
          icon={<FlightTakeoffIcon />}
          title="Flights"
          count={globalFlights.length}
        >
          <Stack spacing={1.5}>
            {globalFlights.map((f: any, i: number) => (
              <Box
                key={i}
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3}>
                    <Field label="PNR" value={f.pnr} />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Field label="Fare" value={f.issuedFare} />
                  </Grid>
                  {f.itinerary && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                        Itinerary
                      </Typography>
                      <Box
                        sx={{ mt: 0.5, fontSize: 13, wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: f.itinerary }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
          </Stack>
        </Section>
      )}

      {/* ── Hotels ──────────────────────────────────────────────────── */}
      {hotelEntries?.length > 0 && (
        <Section
          icon={<HotelIcon />}
          title="Hotels"
          count={hotelEntries.length}
        >
          <Stack spacing={1}>
            {hotelEntries.map((h: any, i: number) => (
              <Box
                key={i}
                sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
              >
                <Typography variant="body2" fontWeight={600}>{h.hotelName}</Typography>
                <Typography variant="caption" color="text.secondary">{h.hotelAddress}</Typography>
              </Box>
            ))}
          </Stack>
        </Section>
      )}

      {/* ── Visas ───────────────────────────────────────────────────── */}
      {visas?.length > 0 && (
        <Section
          icon={<VerifiedUserIcon />}
          title="Visas"
          count={visas.length}
        >
          <Grid container spacing={1.5}>
            {visas.map((v: any, i: number) => (
              <Grid item xs={12} sm={6} key={i}>
                <Box sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Field label="Type" value={v.visa_type} />
                    </Grid>
                    <Grid item xs={6}>
                      <Field label="Status" value={v.visaStatus} />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Section>
      )}

      {/* ── Transport ───────────────────────────────────────────────── */}
      {transportEntries?.length > 0 && (
        <Section
          icon={<DirectionsCarIcon />}
          title="Transport"
          count={transportEntries.length}
        >
          <Stack spacing={1}>
            {transportEntries.map((t: any, i: number) => (
              <Box
                key={i}
                sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={4}>
                    <Field label="Vehicle" value={t.vehicleType} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Field label="From" value={t.pickupFrom} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Field label="Date & Time" value={t.pickupDateTime} />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Section>
      )}

      {/* ── Activities ──────────────────────────────────────────────── */}
      {activitiesEntries?.length > 0 && (
        <Section
          icon={<EmojiEventsIcon />}
          title="Activities"
          count={activitiesEntries.length}
        >
          <Stack spacing={1}>
            {activitiesEntries.map((a: any, i: number) => (
              <Box
                key={i}
                sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
              >
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Field label="Activity" value={a.activity_name} />
                  </Grid>
                  <Grid item xs={6}>
                    <Field label="Date & Time" value={a.datetime} />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Section>
      )}

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={prevStep}
          sx={{ px: 3, borderRadius: 2 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={nextStep}
          sx={{ px: 3, borderRadius: 2 }}
        >
          Confirm & Submit
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default StepReview;
