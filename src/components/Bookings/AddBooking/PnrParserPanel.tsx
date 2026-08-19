"use client";

/**
 * PnrParserPanel
 *
 * Drop a raw PNR string (GDS output, ticket copy, email snippet) into the
 * textarea and click "Parse".  The component runs a set of regex patterns
 * against the text and extracts:
 *   • PNR/Record Locator code
 *   • Airline IATA code
 *   • Flight number
 *   • Departure airport + date/time
 *   • Arrival airport + time
 *
 * Clicking "Apply to Flight" calls the `onApply` callback so the parent can
 * merge the extracted values into the flight entry state.
 */

import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedPnr {
  pnr?: string;
  airline?: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDateTime?: string; // ISO-ish "YYYY-MM-DD HH:mm" or raw string
  arrivalTime?: string;
}

interface Props {
  /** Called when the user clicks "Apply to Flight" */
  onApply: (parsed: ParsedPnr) => void;
}

// ── Parser helpers ─────────────────────────────────────────────────────────────

/**
 * Attempt to convert a GDS date like "15MAR" or "15MAR25" to "YYYY-MM-DD".
 * Falls back to the raw string if it cannot be parsed.
 */
function parseGdsDate(raw: string): string {
  const months: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  const m = raw.match(/^(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2,4})?$/i);
  if (!m) return raw;
  const day = m[1].padStart(2, "0");
  const mon = months[m[2].toUpperCase()];
  const yr  = m[3]
    ? (m[3].length === 2 ? "20" + m[3] : m[3])
    : String(new Date().getFullYear());
  return `${yr}-${mon}-${day}`;
}

/** Format a 4-digit time string "0900" → "09:00" */
function formatTime(raw: string): string {
  if (/^\d{4}$/.test(raw)) return raw.slice(0, 2) + ":" + raw.slice(2);
  return raw;
}

/**
 * Main parsing function.  Tries multiple regex patterns in order and merges
 * whatever it can extract.
 */
export function parsePnrText(text: string): ParsedPnr {
  const result: ParsedPnr = {};
  const upper = text.toUpperCase();

  // ── 1. PNR / Record Locator ──────────────────────────────────────────────
  // Matches labels like: PNR: ABC123  /  Record Locator: X4Y2Z6  /  RLOC: …
  const pnrMatch =
    text.match(/(?:PNR|RLOC|RECORD\s*LOCATOR|BOOKING\s*REF)[:\s*#-]*([A-Z0-9]{5,8})/i) ||
    // Standalone 6-char alphanum after a slash: /DCSK*ABC123
    text.match(/\/[A-Z]{2,4}\*([A-Z0-9]{5,8})/) ||
    // Just a 6-char standalone locator on its own
    text.match(/\b([A-Z]{2,3}[0-9]{3,5}|[A-Z0-9]{6})\b/);
  if (pnrMatch) result.pnr = pnrMatch[1].toUpperCase();

  // ── 2. Airline + Flight Number ───────────────────────────────────────────
  // Common GDS format: "EK 442" / "TK710" / "BA 0067"
  const flightMatch = upper.match(
    /\b([A-Z]{2})\s*(\d{2,4})\b(?:\s*[A-Z]\s*\d{1,2}[A-Z]{3})?/
  );
  if (flightMatch) {
    result.airline      = flightMatch[1];
    result.flightNumber = flightMatch[2].replace(/^0+/, ""); // strip leading zeros
  }

  // ── 3. Route: DEP – ARR ──────────────────────────────────────────────────
  // Patterns: "LHR ISB" / "LHR-ISB" / "FROM LHR TO ISB" / "LHR/ISB"
  const routeMatch =
    upper.match(/\b([A-Z]{3})[\s\-\/]([A-Z]{3})\b/) ||
    upper.match(/FROM\s+([A-Z]{3})\s+TO\s+([A-Z]{3})/);
  if (routeMatch) {
    result.departureAirport = routeMatch[1];
    result.arrivalAirport   = routeMatch[2];
  }

  // ── 4. Date ──────────────────────────────────────────────────────────────
  // GDS format: "15MAR" / "15MAR25"
  const dateMatch = upper.match(/\b(\d{1,2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{0,4})\b/);
  let parsedDate = "";
  if (dateMatch) parsedDate = parseGdsDate(dateMatch[1]);

  // ── 5. Times ─────────────────────────────────────────────────────────────
  // "0900 1400" or "09:00 14:00"
  const timePairs = [...text.matchAll(/\b(\d{4})\b/g)].map((m) => m[1]);
  if (timePairs.length >= 2) {
    const depTime = formatTime(timePairs[0]);
    const arrTime = formatTime(timePairs[1]);
    result.departureDateTime = parsedDate ? `${parsedDate} ${depTime}` : depTime;
    result.arrivalTime       = arrTime;
  } else if (timePairs.length === 1) {
    result.departureDateTime = parsedDate
      ? `${parsedDate} ${formatTime(timePairs[0])}`
      : formatTime(timePairs[0]);
  } else if (parsedDate) {
    result.departureDateTime = parsedDate;
  }

  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PnrParserPanel: React.FC<Props> = ({ onApply }) => {
  const [open, setOpen]       = useState(false);
  const [raw, setRaw]         = useState("");
  const [parsed, setParsed]   = useState<ParsedPnr | null>(null);
  const [hasResult, setHasResult] = useState(false);

  const handleParse = () => {
    const result = parsePnrText(raw);
    setParsed(result);
    setHasResult(Object.keys(result).some((k) => !!(result as any)[k]));
  };

  const handleApply = () => {
    if (parsed) onApply(parsed);
    setOpen(false);
    setRaw("");
    setParsed(null);
    setHasResult(false);
  };

  return (
    <Box
      sx={{
        mb: 2,
        border: "1px dashed #605DFF",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header toggle */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          bgcolor: open ? "rgba(96,93,255,0.06)" : "transparent",
          userSelect: "none",
        }}
      >
        <AutoFixHighIcon sx={{ fontSize: 18, color: "#605DFF" }} />
        <Typography variant="subtitle2" color="primary" fontWeight={600}>
          Smart PNR Auto-Fill
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          — paste raw PNR text to auto-fill flight fields
        </Typography>
        <Box sx={{ ml: "auto" }}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>
      </Box>

      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <TextField
            label="Paste raw PNR / GDS output here"
            multiline
            minRows={4}
            fullWidth
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setParsed(null); setHasResult(false); }}
            placeholder={`Example:\nEK 442 Y 15MAR LHR DXB HK1 0900 1400\nPNR: ABC123`}
            sx={{ mb: 1.5, fontFamily: "monospace" }}
            inputProps={{ style: { fontFamily: "monospace", fontSize: 13 } }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={handleParse}
            disabled={!raw.trim()}
            startIcon={<AutoFixHighIcon />}
            sx={{ mr: 1 }}
          >
            Parse
          </Button>

          {/* Results */}
          {parsed && (
            <Box sx={{ mt: 2 }}>
              {hasResult ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    Extracted values (edit before applying if needed):
                  </Typography>
                  <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                    {parsed.pnr && (
                      <Grid item xs={6} sm={4}>
                        <TextField size="small" label="PNR Code" fullWidth value={parsed.pnr}
                          onChange={(e) => setParsed({ ...parsed, pnr: e.target.value })} />
                      </Grid>
                    )}
                    {parsed.airline && (
                      <Grid item xs={6} sm={2}>
                        <TextField size="small" label="Airline" fullWidth value={parsed.airline}
                          onChange={(e) => setParsed({ ...parsed, airline: e.target.value })} />
                      </Grid>
                    )}
                    {parsed.flightNumber && (
                      <Grid item xs={6} sm={2}>
                        <TextField size="small" label="Flight No." fullWidth value={parsed.flightNumber}
                          onChange={(e) => setParsed({ ...parsed, flightNumber: e.target.value })} />
                      </Grid>
                    )}
                    {parsed.departureAirport && (
                      <Grid item xs={6} sm={2}>
                        <TextField size="small" label="From (IATA)" fullWidth value={parsed.departureAirport}
                          onChange={(e) => setParsed({ ...parsed, departureAirport: e.target.value })} />
                      </Grid>
                    )}
                    {parsed.arrivalAirport && (
                      <Grid item xs={6} sm={2}>
                        <TextField size="small" label="To (IATA)" fullWidth value={parsed.arrivalAirport}
                          onChange={(e) => setParsed({ ...parsed, arrivalAirport: e.target.value })} />
                      </Grid>
                    )}
                    {parsed.departureDateTime && (
                      <Grid item xs={6} sm={4}>
                        <TextField size="small" label="Departure" fullWidth value={parsed.departureDateTime}
                          onChange={(e) => setParsed({ ...parsed, departureDateTime: e.target.value })} />
                      </Grid>
                    )}
                    {parsed.arrivalTime && (
                      <Grid item xs={6} sm={4}>
                        <TextField size="small" label="Arrival Time" fullWidth value={parsed.arrivalTime}
                          onChange={(e) => setParsed({ ...parsed, arrivalTime: e.target.value })} />
                      </Grid>
                    )}
                  </Grid>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={handleApply}
                    sx={{ bgcolor: "#605DFF", "&:hover": { bgcolor: "#4b48cc" } }}
                  >
                    Apply to Flight
                  </Button>
                </>
              ) : (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Could not extract flight data from this text. Try including the flight number, route (e.g. LHR ISB), date and PNR code.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default PnrParserPanel;
