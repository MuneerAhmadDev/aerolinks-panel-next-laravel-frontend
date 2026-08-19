// components/ItineraryDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  IconButton,
  Stack,
  Divider,
  Button,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import PersonIcon from "@mui/icons-material/Person";
import parse from "html-react-parser";

export interface Flight {
  id: number;
  pnr: string;
  itinerary: string;
  remarks?: string;
  atol: boolean;
  issuedFare?: number;
}

export interface Passenger {
  id: number;
  name: string;
  passport_number: string;
}

export interface ItineraryDialogProps {
  open: boolean;
  flight: Flight;
  passengers: Passenger[];
  onClose: () => void;
}

export default function ItineraryDialog({
  open,
  onClose,
  flight,
  passengers,
}: ItineraryDialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      PaperComponent={Paper}
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "#fff",
            px: 3,
            py: 1.5,
            position: "relative",
          }}
        >
          <FlightTakeoffIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          <Typography component="span" variant="h6" sx={{ verticalAlign: "middle" }}>
            PNR: {flight.pnr}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* BODY */}
      <DialogContent sx={{ p: 3 }}>
        {/* Passengers */}
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Passengers
          </Typography>
          <Stack direction="row" flexWrap="wrap" spacing={1}>
            {passengers.map((p) => (
              <Chip
                key={p.id}
                icon={<PersonIcon />}
                label={`${p.name} (${p.passport_number})`}
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Remarks (if any) */}
        {flight.remarks && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom>
              Remarks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {flight.remarks}
            </Typography>
          </Box>
        )}

        {/* Itinerary */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Itinerary
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 1,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            <Typography
              variant="body2"
              component="div"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {parse(flight.itinerary || "")}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 2, justifyContent: "flex-end" }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
