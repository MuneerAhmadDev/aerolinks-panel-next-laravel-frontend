"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Editor,
  EditorProvider,
  ContentEditableEvent,
  BtnBold,
  BtnBulletList,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnUnderline,
  HtmlButton,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";
import api from "@/api/api";

export default function SiteSettingsTab() {
  const [siteTitle, setSiteTitle]       = useState("");
  const [tagline, setTagline]           = useState("");
  const [description, setDescription]   = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [currency, setCurrency]         = useState("GBP");
  const [logoUrl, setLogoUrl]           = useState("");
  const [logo, setLogo]                 = useState<File | null>(null);
  const [logoPreview, setLogoPreview]   = useState<string | null>(null);

  // Rich text fields
  const [customerInvoiceNotes, setCustomerInvoiceNotes] = useState("");
  const [bookingInvoiceNotes, setBookingInvoiceNotes]   = useState("");

  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage]   = useState<{ type: "error" | "success"; text: string } | null>(null);

  // ── Load existing settings on mount ────────────────────────────────────
  useEffect(() => {
    api.get("/api/settings")
      .then((res) => {
        const s = res.data;
        if (!s) return;
        setSiteTitle(s.site_title ?? "");
        setTagline(s.tagline ?? "");
        setDescription(s.description ?? "");
        setContactEmail(s.contact_email ?? "");
        setCurrency(s.store_currency ?? "GBP");
        setLogoUrl(s.logo_url ?? "");
        if (s.logo_url) setLogoPreview(s.logo_url);
        setCustomerInvoiceNotes(s.customer_invoice_notes ?? "");
        setBookingInvoiceNotes(s.booking_invoice_notes ?? "");
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Send JSON so snake_case keys match the controller validation directly.
      await api.post("/api/settings", {
        site_title:              siteTitle,
        tagline,
        description,
        contact_email:           contactEmail,
        store_currency:          currency,
        logo_url:                logoUrl,
        customer_invoice_notes:  customerInvoiceNotes,
        booking_invoice_notes:   bookingInvoiceNotes,
      });

      setMessage({ type: "success", text: "Site settings updated successfully!" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update site settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" mb={2}>
        Site Configuration
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>

          {/* ── Basic Info ────────────────────────────────────────────── */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Site Title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              variant="filled"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              variant="filled"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              variant="filled"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="filled">
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select
                labelId="currency-label"
                value={currency}
                label="Currency"
                onChange={(e) => setCurrency(e.target.value)}
              >
                <MenuItem value="GBP">GBP (£)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="AED">AED (د.إ)</MenuItem>
                <MenuItem value="PKR">PKR (₨)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Logo URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              variant="filled"
              helperText="Paste a direct image URL or upload a file below"
            />
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
              Upload Logo (preview)
              <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
            </Button>
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo Preview"
                style={{ maxHeight: "56px", objectFit: "contain", borderRadius: 4 }}
              />
            )}
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Site Description"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="filled"
            />
          </Grid>

          {/* ── Invoice Notes ─────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" mb={0.5}>
              Invoice Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              HTML-formatted text that prints at the bottom of invoices.
            </Typography>
          </Grid>

          {/* Customer Invoice Notes */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Customer Invoice Notes
            </Typography>
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "#fff",
                "& .rsw-editor": {
                  minHeight: "160px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                },
                "& .rsw-toolbar": {
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "#f6f7f9",
                  padding: "4px 6px",
                },
              }}
            >
              <EditorProvider>
                <Editor
                  value={customerInvoiceNotes}
                  onChange={(e: ContentEditableEvent) =>
                    setCustomerInvoiceNotes(e.target.value)
                  }
                >
                  <Toolbar>
                    <BtnBold />
                    <BtnItalic />
                    <BtnUnderline />
                    <Separator />
                    <BtnNumberedList />
                    <BtnBulletList />
                    <Separator />
                    <BtnLink />
                    <Separator />
                    <HtmlButton />
                  </Toolbar>
                </Editor>
              </EditorProvider>
            </Box>
          </Grid>

          {/* Booking Invoice Notes */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Booking Invoice Notes
            </Typography>
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "#fff",
                "& .rsw-editor": {
                  minHeight: "160px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                },
                "& .rsw-toolbar": {
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "#f6f7f9",
                  padding: "4px 6px",
                },
              }}
            >
              <EditorProvider>
                <Editor
                  value={bookingInvoiceNotes}
                  onChange={(e: ContentEditableEvent) =>
                    setBookingInvoiceNotes(e.target.value)
                  }
                >
                  <Toolbar>
                    <BtnBold />
                    <BtnItalic />
                    <BtnUnderline />
                    <Separator />
                    <BtnNumberedList />
                    <BtnBulletList />
                    <Separator />
                    <BtnLink />
                    <Separator />
                    <HtmlButton />
                  </Toolbar>
                </Editor>
              </EditorProvider>
            </Box>
          </Grid>

          {/* ── Save ──────────────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ textTransform: "capitalize", px: 4, mt: 1 }}
            >
              {loading ? <CircularProgress size={22} /> : "Save Settings"}
            </Button>
          </Grid>

          {message && (
            <Grid item xs={12}>
              <Alert severity={message.type}>
                <AlertTitle>
                  {message.type === "error" ? "Error" : "Success"}
                </AlertTitle>
                {message.text}
              </Alert>
            </Grid>
          )}

        </Grid>
      </Box>
    </Box>
  );
}
