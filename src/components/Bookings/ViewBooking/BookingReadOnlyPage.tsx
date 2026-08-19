"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Stack,
  capitalize,
  Avatar,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import Link from "next/link";
import api from "@/api/api";
import { useSnackbar } from "notistack";
import parse from "html-react-parser";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import HotelIcon from "@mui/icons-material/Hotel";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PaymentCards from "@/components/Bookings/ManageBookings/EditBooking/PaymentCards";
import { useDepartment } from "@/context/DepartmentContext";


export default function BookingReadOnlyPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = useDepartment();
  const canSeeInternalCosts = hasPermission('view-internal-costs');
  const { bookingNumber } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bookingTasks, setBookingTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [expandedFlight, setExpandedFlight] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [pdfLoading, setPdfLoading] = useState(false);

  const toggleFlight = (id: number) => setExpandedFlight(prev => (prev === id ? null : id));

  const handlePrint = async () => {
    if (!booking?.id) return;
    setPdfLoading(true);
    try {
      const response = await api.post("/api/bookings/pdf", { booking_ids: [booking.id] }, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      enqueueSnackbar("Failed to generate PDF.", { variant: "error" });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadApi = async () => {
    if (!booking?.id) return;
    setPdfLoading(true);
    try {
      const response = await api.post("/api/bookings/pdf", { booking_ids: [booking.id] }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking.booking_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar("PDF downloaded successfully!", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to generate PDF.", { variant: "error" });
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (!bookingNumber) return;
    api.get(`/api/bookings/${bookingNumber}`).then((r) => {
      const b = r.data.booking;
      setBooking(b);
      setLogs(Array.isArray(r.data.logs) ? r.data.logs : []);
      if (b?.id) {
        api.get(`/api/booking-tasks`, { params: { booking_id: b.id } })
           .then(tr => setBookingTasks(Array.isArray(tr.data) ? tr.data : tr.data?.data ?? []))
           .catch(() => setBookingTasks([]));
      }
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
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint} disabled={pdfLoading}>Print</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadApi} disabled={pdfLoading}>Download PDF</Button>
          <Button variant="contained" size="small" startIcon={<EditIcon />}
            component={Link} href={`/bookings/manage-bookings/${booking.booking_number}`}>
            Edit Booking
          </Button>
        </Stack>
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
              {capitalize(booking.booking_type ?? '')} Booking · Created {booking.booking_date}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
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
              { icon: <PeopleIcon fontSize="small" />, label: 'Passengers', value: String(booking.customers?.length ?? booking.passengers_count ?? 0), color: '#ff9800' },
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

      {/* ── Department Task Progress ──────────────────────────────────── */}
      {bookingTasks.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AssignmentIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>Department Task Progress</Typography>
          </Box>
          <Stepper alternativeLabel nonLinear>
            {bookingTasks.map((task: any) => {
              const completed = task.status === 'completed';
              const inProg = task.status === 'in_progress';
              return (
                <Step key={task.id} completed={completed} active={inProg}>
                  <StepLabel>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize', display: 'block' }}>
                      {task.service_type?.replace('_', ' ')}
                    </Typography>
                    <Chip
                      label={task.status?.replace('_', ' ')}
                      size="small"
                      sx={{
                        height: 18, fontSize: 10,
                        bgcolor: completed ? 'success.main' : inProg ? 'primary.main' : 'action.selected',
                        color: completed || inProg ? '#fff' : 'text.secondary',
                        textTransform: 'capitalize',
                      }}
                    />
                    {task.assigned_employee?.user?.name && (
                      <Typography variant="caption" display="block" color="text.secondary" mt={0.25}>
                        {task.assigned_employee.user.name}
                      </Typography>
                    )}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Paper>
      )}

      {/* ── 3-Tab Layout: Overview | Services | Payments ─────────────── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>

        {/* Tab Bar */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: 1, borderColor: 'divider', px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14, minHeight: 52 },
          }}
        >
          <Tab label="Overview" value={0} />
          <Tab label="Services" value={1} />
          <Tab label="Payments" value={2} />
          <Tab label="Timeline" value={3} />
        </Tabs>

        {/* ── Tab 0: Overview ─────────────────────────────────────────── */}
        {activeTab === 0 && (() => {
          const lead = booking.customers?.find((c: any) => c.pivot?.is_leading === 1 || c.is_leading);
          return (
            <Box sx={{ p: { xs: 2, md: 3 } }}>

              {/* Lead Passenger Card */}
              {lead && (
                <Paper elevation={0} sx={{ bgcolor: 'rgba(96,93,255,0.05)', border: '1px solid', borderColor: 'rgba(96,93,255,0.2)', borderRadius: 2, p: 2, mb: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, fontSize: 22, fontWeight: 700 }}>
                      {(lead.name ?? '?')[0].toUpperCase()}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <Typography variant="subtitle1" fontWeight={700}>{lead.name}</Typography>
                        <Chip label="Lead" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                      </Stack>
                      <Stack direction="row" spacing={2} flexWrap="wrap" gap={0.5}>
                        {lead.contact?.email && <Typography variant="body2" color="text.secondary">✉ {lead.contact.email}</Typography>}
                        {lead.contact?.phone && <Typography variant="body2" color="text.secondary">📞 {lead.contact.phone}</Typography>}
                        {lead.contact?.alternate_phone && <Typography variant="body2" color="text.secondary">📞 {lead.contact.alternate_phone}</Typography>}
                      </Stack>
                      {lead.contact?.address && (
                        <Typography variant="body2" color="text.secondary" mt={0.25}>📍 {lead.contact.address}</Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* All Passengers */}
              {booking.customers?.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                    All Passengers
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {booking.customers.map((c: any) => (
                      <Chip
                        key={c.id}
                        avatar={<Avatar sx={{ bgcolor: c.pivot?.is_leading === 1 ? 'primary.main' : 'grey.400' }}>{(c.name ?? '?')[0].toUpperCase()}</Avatar>}
                        label={c.name}
                        variant={c.pivot?.is_leading === 1 ? 'filled' : 'outlined'}
                        color={c.pivot?.is_leading === 1 ? 'primary' : 'default'}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Booking Details Grid */}
              <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Booking Details
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Booking #', value: booking.booking_number },
                  { label: 'Booking Date', value: booking.booking_date },
                  { label: 'Departure', value: booking.departure_date ?? '—' },
                  { label: 'Return', value: booking.return_date ?? '—' },
                  { label: 'Selling Cost', value: booking.selling_cost ? `£${Number(booking.selling_cost).toLocaleString()}` : '—' },
                  { label: 'Status', value: capitalize(booking.status ?? '') },
                  { label: 'Booking Type', value: capitalize(booking.booking_type ?? '') },
                  { label: 'Passengers', value: String(booking.customers?.length ?? 0) },
                ].map(({ label, value }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })()}

        {/* ── Tab 1: Services ─────────────────────────────────────────── */}
        {activeTab === 1 && (
          <Box sx={{ p: { xs: 1, md: 2 } }}>

            {/* Flights */}
            {booking.flight_bookings?.length > 0 && (
              <Accordion defaultExpanded disableGutters elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2, py: 1, '& .MuiAccordionSummary-content': { gap: 1, alignItems: 'center' } }}>
                  <FlightTakeoffIcon color="primary" fontSize="small" />
                  <Typography fontWeight={700} fontSize={14}>Flights</Typography>
                  <Chip label={booking.flight_bookings.length} size="small" color="primary" sx={{ ml: 'auto', height: 20, fontSize: 11 }} />
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Box sx={{ display: 'grid', gap: 3 }}>
                    {booking.flight_bookings.map((f: any) => {
                      const isOpen = expandedFlight === f.id;
                      // Costs live in the nested flight_booking_costs records (one
                      // "global" record, or one "single" record per customer) —
                      // not directly on the flight booking itself.
                      const costRecords: any[] = Array.isArray(f.flight_booking_costs) ? f.flight_booking_costs : [];
                      const globalRecord = costRecords.find((cr) => cr.costable_type === 'global');
                      const singleRecords = costRecords.filter((cr) => cr.costable_type === 'single');
                      const issuedFare = Number(globalRecord?.issued_fare ?? costRecords[0]?.issued_fare ?? 0);
                      const totalCost = globalRecord
                        ? Number(globalRecord.cost ?? 0)
                        : singleRecords.reduce((s, cr) => s + Number(cr.cost ?? 0), 0);
                      const totalInternalCost = globalRecord
                        ? Number(globalRecord.internal_cost ?? 0)
                        : singleRecords.reduce((s, cr) => s + Number(cr.internal_cost ?? 0), 0);
                      return (
                        <Card key={f.id} elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          <Box sx={{ height: 4, background: `linear-gradient(90deg, ${f.atol ? '#4caf50' : '#ff9800'} 0%, transparent 100%)` }} />
                          <CardHeader
                            avatar={<FlightTakeoffIcon color="primary" />}
                            title={<Typography variant="h6" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{f.pnr}</Typography>}
                            subheader={canSeeInternalCosts ? <Typography variant="body2" color="text.secondary">Issued Fare: <strong>{issuedFare.toFixed(2)}</strong></Typography> : undefined}
                            action={<Chip label={f.atol ? 'ATOL ✓' : 'Non-ATOL'} size="small" sx={{ bgcolor: f.atol ? 'success.main' : 'warning.main', color: '#fff', fontWeight: 600 }} />}
                            sx={{ pb: 0, px: 2, pt: 1 }}
                          />
                          <Divider sx={{ mx: 2, my: 1, opacity: 0.3 }} />
                          <Box sx={{ px: 2, pb: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Passengers</Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {booking.customers?.map((c: any) => (
                                <Chip key={c.id} label={c.name} size="small" variant="outlined" sx={{ borderColor: 'primary.light', color: 'primary.dark' }} />
                              ))}
                            </Stack>
                          </Box>
                          <Box sx={{ px: 2, pb: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>Supplier</Typography>
                            <Typography variant="body2" color="text.secondary">{suppliers.find((s) => s.id === f.supplier_id)?.name || '—'}</Typography>
                          </Box>
                          {canSeeInternalCosts && (
                            <Box sx={{ px: 2, pb: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>Cost / Internal Cost</Typography>
                              <Typography variant="body2" color="text.secondary">{totalCost.toFixed(2)} / {totalInternalCost.toFixed(2)}</Typography>
                            </Box>
                          )}
                          <Divider sx={{ mx: 2, opacity: 0.2 }} />
                          <CardContent sx={{ pt: 1, px: 2, pb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Itinerary</Typography>
                            <Box sx={{
                              position: 'relative', maxHeight: isOpen ? 'none' : 96, overflow: 'hidden',
                              borderRadius: 1, bgcolor: 'background.paper', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                              '&:after': !isOpen ? { content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, rgba(255,255,255,0.9))' } : {},
                            }}>
                              <Typography variant="body2" color="text.secondary" component="div" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, p: 1 }}>
                                {parse(f.itinerary || '')}
                              </Typography>
                            </Box>
                            <Box textAlign="center" sx={{ mt: 1 }}>
                              <Button size="small" endIcon={isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => toggleFlight(f.id)}>
                                {isOpen ? 'Show Less' : 'Show More'}
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Hotels */}
            {booking.hotel_bookings?.length > 0 && (
              <Accordion defaultExpanded disableGutters elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2, py: 1, '& .MuiAccordionSummary-content': { gap: 1, alignItems: 'center' } }}>
                  <HotelIcon color="primary" fontSize="small" />
                  <Typography fontWeight={700} fontSize={14}>Hotels</Typography>
                  <Chip label={booking.hotel_bookings.length} size="small" color="primary" sx={{ ml: 'auto', height: 20, fontSize: 11 }} />
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {booking.hotel_bookings.map((h: any) => (
                      <Card key={h.id} elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #2196f3 0%, transparent 100%)' }} />
                        <CardHeader avatar={<HotelIcon color="primary" />}
                          title={<Typography variant="h6" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{h.hotel_name}</Typography>}
                          subheader={<Typography variant="body2" color="text.secondary">{h.hotel_address}</Typography>}
                          sx={{ px: 2, pt: 1, pb: 0 }} />
                        <Divider sx={{ my: 1, mx: 2, opacity: 0.3 }} />
                        <CardContent sx={{ px: 2, pt: 0, pb: 2 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box><Typography variant="subtitle2">Check-In → Check-Out</Typography><Typography variant="body2" color="text.secondary">{h.check_in_date} → {h.check_out_date} ({h.nights} nights)</Typography></Box>
                            <Box><Typography variant="subtitle2">Rooms</Typography><Typography variant="body2" color="text.secondary">{h.room_allocation} × {h.room_type} ({h.room_view})</Typography></Box>
                            <Box><Typography variant="subtitle2">Meal Plan</Typography><Typography variant="body2" color="text.secondary">{capitalize(h.meal_type)}</Typography></Box>
                            {canSeeInternalCosts && <Box><Typography variant="subtitle2">Cost / Internal</Typography><Typography variant="body2" color="text.secondary">{h.cost} / {h.internal_cost}</Typography></Box>}
                            <Box gridColumn="span 2"><Typography variant="subtitle2">Supplier</Typography><Typography variant="body2" color="text.secondary">{suppliers.find((s) => s.id === h.supplier_id)?.name || '—'}</Typography></Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Visas */}
            {booking.visa_bookings?.length > 0 && (
              <Accordion defaultExpanded disableGutters elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2, py: 1, '& .MuiAccordionSummary-content': { gap: 1, alignItems: 'center' } }}>
                  <TravelExploreIcon color="primary" fontSize="small" />
                  <Typography fontWeight={700} fontSize={14}>Visas</Typography>
                  <Chip label={booking.visa_bookings.length} size="small" color="primary" sx={{ ml: 'auto', height: 20, fontSize: 11 }} />
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {booking.visa_bookings.map((v: any) => {
                      // Like flights, visa costs live in nested visa_booking_costs
                      // records, not directly on the visa booking.
                      const vCostRecords: any[] = Array.isArray(v.visa_booking_costs) ? v.visa_booking_costs : [];
                      const vGlobalRecord = vCostRecords.find((cr) => cr.costable_type === 'global');
                      const vSingleRecords = vCostRecords.filter((cr) => cr.costable_type === 'single');
                      const vCost = vGlobalRecord
                        ? Number(vGlobalRecord.cost ?? 0)
                        : vSingleRecords.reduce((s, cr) => s + Number(cr.cost ?? 0), 0);
                      const vInternalCost = vGlobalRecord
                        ? Number(vGlobalRecord.internal_cost ?? 0)
                        : vSingleRecords.reduce((s, cr) => s + Number(cr.internal_cost ?? 0), 0);
                      return (
                        <Card key={v.id} elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          <Box sx={{ height: 4, background: 'linear-gradient(90deg, #9c27b0 0%, transparent 100%)' }} />
                          <CardHeader avatar={<TravelExploreIcon color="primary" />}
                            title={<Typography variant="h6" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{v.visa_type}</Typography>}
                            subheader={<Typography variant="body2" color="text.secondary">Status: {capitalize(v.visa_status)}</Typography>}
                            sx={{ px: 2, pt: 1, pb: 0 }} />
                          <Divider sx={{ my: 1, mx: 2, opacity: 0.3 }} />
                          <CardContent sx={{ px: 2, pt: 0, pb: 2 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                              <Box><Typography variant="subtitle2">Flight</Typography><Typography variant="body2" color="text.secondary">{v.airline_code}/{v.flight_code}</Typography></Box>
                              {canSeeInternalCosts && <Box><Typography variant="subtitle2">Cost / Internal</Typography><Typography variant="body2" color="text.secondary">{vCost.toFixed(2)} / {vInternalCost.toFixed(2)}</Typography></Box>}
                              <Box gridColumn="span 2"><Typography variant="subtitle2">Remarks</Typography><Typography variant="body2" color="text.secondary">{v.remarks || '—'}</Typography></Box>
                              <Box gridColumn="span 2"><Typography variant="subtitle2">Supplier</Typography><Typography variant="body2" color="text.secondary">{suppliers.find((s) => s.id === v.supplier_id)?.name || '—'}</Typography></Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Transport */}
            {booking.transport_bookings?.length > 0 && (
              <Accordion defaultExpanded disableGutters elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2, py: 1, '& .MuiAccordionSummary-content': { gap: 1, alignItems: 'center' } }}>
                  <DirectionsCarIcon color="primary" fontSize="small" />
                  <Typography fontWeight={700} fontSize={14}>Transport</Typography>
                  <Chip label={booking.transport_bookings.length} size="small" color="primary" sx={{ ml: 'auto', height: 20, fontSize: 11 }} />
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {booking.transport_bookings.map((t: any) => (
                      <Card key={t.id} elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #ff5722 0%, transparent 100%)' }} />
                        <CardHeader avatar={<DirectionsCarIcon color="primary" />}
                          title={<Typography variant="h6" fontWeight={700} sx={{ textTransform: 'uppercase' }}>{t.vehicle_type}</Typography>}
                          subheader={<Typography variant="body2" color="text.secondary">Pickup @ {t.pickup_from} ({t.pickup_time})</Typography>}
                          sx={{ px: 2, pt: 1, pb: 0 }} />
                        <Divider sx={{ my: 1, mx: 2, opacity: 0.3 }} />
                        <CardContent sx={{ px: 2, pt: 0, pb: 2 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box><Typography variant="subtitle2">Dropoff</Typography><Typography variant="body2" color="text.secondary">{t.dropoff}</Typography></Box>
                            {canSeeInternalCosts && <Box><Typography variant="subtitle2">Cost / Internal</Typography><Typography variant="body2" color="text.secondary">{t.cost} / {t.internal_cost}</Typography></Box>}
                            <Box gridColumn="span 2"><Typography variant="subtitle2">Supplier</Typography><Typography variant="body2" color="text.secondary">{suppliers.find((s) => s.id === t.supplier_id)?.name || '—'}</Typography></Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Activities */}
            {booking.activities_bookings?.length > 0 && (
              <Accordion defaultExpanded disableGutters elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1.5, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2, py: 1, '& .MuiAccordionSummary-content': { gap: 1, alignItems: 'center' } }}>
                  <EmojiEventsIcon color="primary" fontSize="small" />
                  <Typography fontWeight={700} fontSize={14}>Activities</Typography>
                  <Chip label={booking.activities_bookings.length} size="small" color="primary" sx={{ ml: 'auto', height: 20, fontSize: 11 }} />
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Box sx={{ display: 'grid', gap: 3 }}>
                    {booking.activities_bookings.map((a: any) => {
                      const isOpenA = expandedActivity === a.id;
                      return (
                        <Card key={a.id} elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                          <Box sx={{ height: 4, background: `linear-gradient(90deg, ${a.atol ? '#4caf50' : '#ff9800'} 0%, transparent 100%)` }} />
                          <CardHeader avatar={<EmojiEventsIcon color="primary" />}
                            title={<Typography variant="h6" fontWeight={700}>{a.activity_name}</Typography>}
                            subheader={<Typography variant="body2" color="text.secondary">Pickup: {a.pickup_location}</Typography>}
                            sx={{ pb: 0, px: 2, pt: 1 }} />
                          <Divider sx={{ my: 1, mx: 2 }} />
                          <CardContent sx={{ px: 2, pt: 0 }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                              <Box><Typography variant="subtitle2">Date & Time</Typography><Typography variant="body2" color="text.secondary">{a.datetime}</Typography></Box>
                              <Box><Typography variant="subtitle2">Guide</Typography><Typography variant="body2" color="text.secondary">{a.guide} {a.guide === 'Yes' && `(Cost: ${a.guideCost})`}</Typography></Box>
                              <Box><Typography variant="subtitle2">Cost</Typography><Typography variant="body2" color="text.secondary">{a.cost}</Typography></Box>
                              {canSeeInternalCosts && <Box><Typography variant="subtitle2">Internal Cost</Typography><Typography variant="body2" color="text.secondary">{a.internal_cost}</Typography></Box>}
                              <Box gridColumn="span 2"><Typography variant="subtitle2">Supplier</Typography><Typography variant="body2" color="text.secondary">{suppliers.find((s) => s.id === a.supplier_id)?.name || '—'}</Typography></Box>
                            </Box>
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="subtitle2" gutterBottom>Amenities</Typography>
                              <Box sx={{
                                position: 'relative', maxHeight: isOpenA ? 'none' : 80, overflow: 'hidden',
                                borderRadius: 1, bgcolor: 'background.paper', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                                '&:after': !isOpenA ? { content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, rgba(255,255,255,0.9))' } : {},
                              }}>
                                <Typography variant="body2" color="text.secondary" component="div" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, p: 1 }}>
                                  {a.amenities || '—'}
                                </Typography>
                              </Box>
                              <Box textAlign="center" sx={{ mt: 1 }}>
                                <Button size="small" endIcon={isOpenA ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  onClick={() => setExpandedActivity(prev => (prev === a.id ? null : a.id))}>
                                  {isOpenA ? 'Show Less' : 'Show More'}
                                </Button>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Empty state */}
            {!booking.flight_bookings?.length && !booking.hotel_bookings?.length &&
             !booking.visa_bookings?.length && !booking.transport_bookings?.length &&
             !booking.activities_bookings?.length && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No service details recorded for this booking.</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ── Tab 2: Payments ─────────────────────────────────────────── */}
        {activeTab === 2 && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <PaymentCards
              payments={booking.payments}
              totalCost={Number(booking.selling_cost)}
              bookingNumber={booking.booking_number}
            />
          </Box>
        )}

        {/* ── Tab 3: Timeline ─────────────────────────────────────────── */}
        {activeTab === 3 && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {logs.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No activity recorded yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', pl: 1 }}>
                {/* Vertical spine */}
                <Box sx={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, bgcolor: 'divider', zIndex: 0 }} />
                <Stack spacing={2}>
                  {logs.map((log: any, idx: number) => {
                    const isCreated = log.event === 'created';
                    const isDeleted = log.event === 'deleted';
                    const dotColor = isCreated ? 'success.main' : isDeleted ? 'error.main' : 'primary.main';
                    const dotIcon  = isCreated ? 'add_circle' : isDeleted ? 'delete' : 'edit';
                    const changed  = log.properties?.attributes
                      ? Object.entries(log.properties.attributes as Record<string, unknown>).filter(([k]) => k !== 'updated_at')
                      : [];
                    return (
                      <Box key={log.id ?? idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        {/* Circle on spine */}
                        <Box sx={{
                          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                          bgcolor: dotColor, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#fff', zIndex: 1,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}>
                          <i className="material-symbols-outlined" style={{ fontSize: 18 }}>{dotIcon}</i>
                        </Box>

                        {/* Card */}
                        <Paper elevation={0} sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 0.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={0.5}>
                            <Typography variant="body2" fontWeight={600}>{log.description}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(log.created_at).toLocaleString()}
                            </Typography>
                          </Stack>
                          {log.causer && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                              by {log.causer.name}
                            </Typography>
                          )}
                          {changed.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {changed.slice(0, 8).map(([k, v]) => (
                                <Chip
                                  key={k}
                                  label={`${k}: ${String(v ?? '').slice(0, 40)}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Box>
        )}

      </Paper>
    </Box>
  );
}
