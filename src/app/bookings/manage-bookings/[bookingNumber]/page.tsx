"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Tabs,
  Tab,
  Typography,
  Button,
  Chip,
  Stack,
  useTheme,
  capitalize,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

import { useSnackbar } from "notistack";
import api from "@/api/api";
import { useDepartment } from "@/context/DepartmentContext";

import Step1Form, { Step1Data } from "@/components/Bookings/ManageBookings/EditBooking/Step1Form";
import Step2Form, { FlightEntryExtended, Customer } from "@/components/Bookings/ManageBookings/EditBooking/Step2Form";
import Step3Form, { Supplier as HotelSupplier, HotelEntry } from "@/components/Bookings/ManageBookings/EditBooking/Step3Form";
import Step4Form, { Supplier as VisaSupplier, VisaEntry } from "@/components/Bookings/ManageBookings/EditBooking/Step4Form";
import Step5Form, { Supplier as TransportSupplier, TransportEntry } from "@/components/Bookings/ManageBookings/EditBooking/Step5Form";
import Step6Form, { Supplier as ActivitySupplier, ActivityEntry } from "@/components/Bookings/ManageBookings/EditBooking/Step6Form";
import Step7Form, { PaymentEntry } from "@/components/Bookings/ManageBookings/EditBooking/Step7Form";

export default function BookingViewPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { bookingNumber } = useParams();
  const router = useRouter();
  const { hasPermission } = useDepartment();
  const canSeeInternalCosts = hasPermission("view-internal-costs");
  const [booking, setBooking] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!bookingNumber) return;
    api.get(`/api/bookings/${bookingNumber}`).then((r) => {
      setBooking(r.data.booking);
    });
    api.get("/api/suppliers")
      .then(r => {
        let list: any[] = [];
        if (Array.isArray(r.data)) list = r.data;
        else if (Array.isArray((r.data as any).data)) list = (r.data as any).data;
        else if (Array.isArray((r.data as any).suppliers)) list = (r.data as any).suppliers;
        setSuppliers(list);
      })
      .catch(() => setSuppliers([]));
  }, [bookingNumber]);

  if (!booking) return <Typography sx={{ p: 2 }}>Loading booking...</Typography>;

  const isFlightType = booking.booking_type === "flight";
  const allowedSteps = isFlightType ? [0, 1, 6] : [0, 1, 2, 3, 4, 5, 6];

  const refreshBooking = async () => {
    try {
      const fresh = await api.get(`/api/bookings/${bookingNumber}`);
      setBooking(fresh.data.booking ?? fresh.data);
    } catch { /* silent — stale data is better than crash */ }
  };

  const handleStepSave = async (step: number, data: any) => {
    try {
      switch (step) {
        case 0: {
          await api.patch(`/api/bookings/${booking.id}`, data as Step1Data);
          await refreshBooking();
          break;
        }
        case 1: {
          // Smart diff: only delete removed flights, patch/post the rest
          const sentIds = (data as FlightEntryExtended[]).map((f) => f.id).filter(Boolean) as number[];
          for (const old of booking.flight_bookings ?? []) {
            if (old.id && !sentIds.includes(old.id)) await api.delete(`/api/flight-bookings/${old.id}`);
          }
          for (const f of data as FlightEntryExtended[]) {
            const payload = { booking_id: booking.id, ...f };
            if (f.id) await api.patch(`/api/flight-bookings/${f.id}`, payload);
            else       await api.post(`/api/flight-bookings`, payload);
          }
          setBooking((b: any) => ({ ...b, flight_bookings: data }));
          break;
        }
        case 2: {
          // Smart diff: delete removed, patch existing, post new
          const sentHotelIds = (data as HotelEntry[]).map(h => h.id).filter(Boolean) as number[];
          for (const old of booking.hotel_bookings ?? []) {
            if (old.id && !sentHotelIds.includes(old.id)) await api.delete(`/api/hotel-bookings/${old.id}`);
          }
          for (const h of data as HotelEntry[]) {
            const payload = { booking_id: booking.id, ...h };
            if (h.id) await api.patch(`/api/hotel-bookings/${h.id}`, payload);
            else       await api.post(`/api/hotel-bookings`, payload);
          }
          setBooking((b: any) => ({ ...b, hotel_bookings: data }));
          break;
        }
        case 3: {
          // Smart diff: delete removed, patch existing, post new
          const sentVisaIds = (data as VisaEntry[]).map(v => v.id).filter(Boolean) as number[];
          for (const old of booking.visa_bookings ?? []) {
            if (old.id && !sentVisaIds.includes(old.id)) await api.delete(`/api/visa-bookings/${old.id}`);
          }
          for (const v of data as VisaEntry[]) {
            const payload = { booking_id: booking.id, ...v };
            if (v.id) await api.patch(`/api/visa-bookings/${v.id}`, payload);
            else       await api.post(`/api/visa-bookings`, payload);
          }
          setBooking((b: any) => ({ ...b, visa_bookings: data }));
          break;
        }
        case 4: {
          // Smart diff: delete removed, patch existing, post new
          const sentTransportIds = (data as TransportEntry[]).map(t => t.id).filter(Boolean) as number[];
          for (const old of booking.transport_bookings ?? []) {
            if (old.id && !sentTransportIds.includes(old.id)) await api.delete(`/api/transport-bookings/${old.id}`);
          }
          for (const t of data as TransportEntry[]) {
            const payload = { booking_id: booking.id, ...t };
            if (t.id) await api.patch(`/api/transport-bookings/${t.id}`, payload);
            else       await api.post(`/api/transport-bookings`, payload);
          }
          setBooking((b: any) => ({ ...b, transport_bookings: data }));
          break;
        }
        case 5: {
          // Smart diff: delete removed, patch existing, post new
          const sentActivityIds = (data as ActivityEntry[]).map(a => a.id).filter(Boolean) as number[];
          for (const old of booking.activities_bookings ?? []) {
            if (old.id && !sentActivityIds.includes(old.id)) await api.delete(`/api/activity-bookings/${old.id}`);
          }
          for (const a of data as ActivityEntry[]) {
            const payload = { booking_id: booking.id, ...a };
            if (a.id) await api.patch(`/api/activity-bookings/${a.id}`, payload);
            else       await api.post(`/api/activity-bookings`, payload);
          }
          setBooking((b: any) => ({ ...b, activities_bookings: data }));
          break;
        }
        case 6: {
          // Delete removed payments FIRST so backend balance check uses the correct remaining amount
          const keptIds = (data as PaymentEntry[]).map((p) => p.id).filter((id): id is number => id !== undefined);
          for (const old of booking.payments ?? []) {
            if (old.id && !keptIds.includes(old.id)) await api.delete(`/api/booking-payments/${old.id}`);
          }
          // Then patch existing and post new
          for (const p of data as PaymentEntry[]) {
            if (p.id) await api.patch(`/api/booking-payments/${p.id}`, p);
            else       await api.post(`/api/booking-payments`, { booking_id: booking.id, ...p });
          }
          setBooking((b: any) => ({ ...b, payments: data }));
          break;
        }
        default:
          break;
      }

      // Mark this tab as saved
      setSavedSteps((prev) => new Set(prev).add(step));
      const labels = ['Booking details','Flight details','Hotel details','Visa details','Transport details','Activity details','Payments'];
      enqueueSnackbar(`${labels[step] ?? 'Step'} saved!`, { variant: "success" });

    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Save failed. Please try again.";
      enqueueSnackbar(msg, { variant: "error" });
      // Refresh from server so UI reflects actual persisted state
      await refreshBooking();
    }
  };

  const statusColor: Record<string, string> = {
    active: '#4caf50', confirmed: '#4caf50', cancelled: '#f44336', pending: '#ff9800', completed: '#2196f3',
  };
  const paymentStatusColor: Record<string, string> = { Paid: '#2196f3', 'Partially Paid': '#ff9800', Unpaid: '#9e9e9e' };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ textTransform: 'none', color: 'text.secondary' }}>
          Back to Bookings
        </Button>
        <Button variant="outlined" size="small" startIcon={<VisibilityIcon />}
          onClick={() => router.push(`/bookings/view-booking/${booking.booking_number}`)}>
          View Booking
        </Button>
      </Box>

      {/* ── Hero Card ─────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #605DFF 0%, #8B89FF 60%, #a78bfa 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing={1}>{booking.booking_number}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', mt: 0.25 }}>
              Editing — {capitalize(booking.booking_type ?? '')} Booking · {booking.booking_date}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={capitalize(booking.status ?? 'active')} size="small"
              sx={{ bgcolor: statusColor[booking.status] ?? '#9e9e9e', color: '#fff', fontWeight: 700 }} />
            <Chip label={booking.payment_status ?? 'Unpaid'} size="small"
              sx={{ bgcolor: paymentStatusColor[booking.payment_status ?? 'Unpaid'], color: '#fff', fontWeight: 700 }} />
          </Stack>
        </Box>
        <Box sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            {[
              { icon: <CalendarMonthIcon fontSize="small" />, label: 'Departure', value: booking.departure_date ?? '—', color: '#605DFF' },
              { icon: <CalendarMonthIcon fontSize="small" />, label: 'Return', value: booking.return_date ?? '—', color: '#2196f3' },
              { icon: <AttachMoneyIcon fontSize="small" />, label: 'Total Cost', value: booking.selling_cost ? `£${Number(booking.selling_cost).toLocaleString()}` : '—', color: '#4caf50' },
              { icon: <PeopleIcon fontSize="small" />, label: 'Passengers', value: String(booking.customers?.length ?? 0), color: '#ff9800' },
            ].map((m) => (
              <Grid item xs={6} sm={3} key={m.label}>
                <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Box sx={{ color: m.color, mb: 0.25 }}>{m.icon}</Box>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{m.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* ── Step Forms in Horizontal Tabs ────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1, borderColor: 'divider', px: 1,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minHeight: 52 },
          }}
        >
          {[
            { value: 0, label: '1 · Details' },
            { value: 1, label: '2 · Flights' },
            { value: 2, label: '3 · Hotels' },
            { value: 3, label: '4 · Visa' },
            { value: 4, label: '5 · Transport' },
            { value: 5, label: '6 · Activities' },
            { value: 6, label: '7 · Payments' },
          ].filter(t => allowedSteps.includes(t.value)).map(t => (
            <Tab
              key={t.value}
              value={t.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {t.label}
                  {savedSteps.has(t.value) && (
                    <Chip label="✓" size="small" color="success"
                      sx={{ height: 16, fontSize: 10, fontWeight: 700, '& .MuiChip-label': { px: 0.75 } }} />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Step forms render directly — no dialog wrapper */}
        {activeTab === 0 && (
          <Step1Form
            data={booking}
            onSave={(d) => handleStepSave(0, d)}
            onCancel={() => {}}
          />
        )}
        {activeTab === 1 && allowedSteps.includes(1) && (
          <Step2Form
            data={booking.flight_bookings}
            customers={booking.customers}
            suppliers={suppliers}
            onSave={(arr) => handleStepSave(1, arr)}
            onCancel={() => {}}
            canSeeInternalCosts={canSeeInternalCosts}
          />
        )}
        {activeTab === 2 && allowedSteps.includes(2) && (
          <Step3Form
            data={booking.hotel_bookings}
            suppliers={suppliers}
            onSave={(arr) => handleStepSave(2, arr)}
            onCancel={() => {}}
            canSeeInternalCosts={canSeeInternalCosts}
          />
        )}
        {activeTab === 3 && allowedSteps.includes(3) && (
          <Step4Form
            data={booking.visa_bookings}
            suppliers={suppliers}
            onSave={(arr) => handleStepSave(3, arr)}
            onCancel={() => {}}
            canSeeInternalCosts={canSeeInternalCosts}
          />
        )}
        {activeTab === 4 && allowedSteps.includes(4) && (
          <Step5Form
            data={booking.transport_bookings}
            suppliers={suppliers}
            onSave={(arr) => handleStepSave(4, arr)}
            onCancel={() => {}}
            canSeeInternalCosts={canSeeInternalCosts}
          />
        )}
        {activeTab === 5 && allowedSteps.includes(5) && (
          <Step6Form
            data={booking.activities_bookings}
            suppliers={suppliers}
            onSave={(arr) => handleStepSave(5, arr)}
            onCancel={() => {}}
            canSeeInternalCosts={canSeeInternalCosts}
          />
        )}
        {activeTab === 6 && (
          <Step7Form
            data={booking.payments}
            maxTotal={booking.selling_cost}
            onSave={(arr) => handleStepSave(6, arr)}
            onCancel={() => {}}
          />
        )}
      </Paper>

    </Box>
  );
}
