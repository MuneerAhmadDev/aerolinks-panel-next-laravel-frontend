"use client";

/**
 * CurrencySelect
 *
 * A searchable MUI Autocomplete pre-loaded with ~80 global ISO 4217 currencies.
 * Each option renders the ISO code, full name, and symbol.
 *
 * Usage:
 *   <CurrencySelect
 *     value={currencyCode}           // e.g. "USD" or ""
 *     onChange={(code) => setCode(code)}
 *     label="Currency"
 *     required
 *   />
 *
 * value / onChange always deal in the 3-letter ISO code string so the
 * component stays compatible with existing API payloads.
 */

import React from "react";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

// ── Currency data ────────────────────────────────────────────────────────────

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  // ── Major / G10 ─────────────────────────────────────────────────────────
  { code: "USD", name: "US Dollar",             symbol: "$"   },
  { code: "EUR", name: "Euro",                  symbol: "€"   },
  { code: "GBP", name: "British Pound",         symbol: "£"   },
  { code: "JPY", name: "Japanese Yen",          symbol: "¥"   },
  { code: "CHF", name: "Swiss Franc",           symbol: "Fr"  },
  { code: "AUD", name: "Australian Dollar",     symbol: "A$"  },
  { code: "CAD", name: "Canadian Dollar",       symbol: "C$"  },
  { code: "NZD", name: "New Zealand Dollar",    symbol: "NZ$" },
  { code: "SEK", name: "Swedish Krona",         symbol: "kr"  },
  { code: "NOK", name: "Norwegian Krone",       symbol: "kr"  },
  { code: "DKK", name: "Danish Krone",          symbol: "kr"  },
  // ── Asia-Pacific ─────────────────────────────────────────────────────────
  { code: "CNY", name: "Chinese Yuan",          symbol: "¥"   },
  { code: "HKD", name: "Hong Kong Dollar",      symbol: "HK$" },
  { code: "SGD", name: "Singapore Dollar",      symbol: "S$"  },
  { code: "TWD", name: "New Taiwan Dollar",     symbol: "NT$" },
  { code: "KRW", name: "South Korean Won",      symbol: "₩"   },
  { code: "INR", name: "Indian Rupee",          symbol: "₹"   },
  { code: "PKR", name: "Pakistani Rupee",       symbol: "₨"   },
  { code: "BDT", name: "Bangladeshi Taka",      symbol: "৳"   },
  { code: "LKR", name: "Sri Lankan Rupee",      symbol: "₨"   },
  { code: "NPR", name: "Nepalese Rupee",        symbol: "₨"   },
  { code: "IDR", name: "Indonesian Rupiah",     symbol: "Rp"  },
  { code: "MYR", name: "Malaysian Ringgit",     symbol: "RM"  },
  { code: "PHP", name: "Philippine Peso",       symbol: "₱"   },
  { code: "THB", name: "Thai Baht",             symbol: "฿"   },
  { code: "VND", name: "Vietnamese Dong",       symbol: "₫"   },
  { code: "MMK", name: "Myanmar Kyat",          symbol: "K"   },
  // ── Middle East ──────────────────────────────────────────────────────────
  { code: "AED", name: "UAE Dirham",            symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal",           symbol: "﷼"   },
  { code: "QAR", name: "Qatari Riyal",          symbol: "﷼"   },
  { code: "KWD", name: "Kuwaiti Dinar",         symbol: "د.ك" },
  { code: "BHD", name: "Bahraini Dinar",        symbol: "BD"  },
  { code: "OMR", name: "Omani Rial",            symbol: "﷼"   },
  { code: "JOD", name: "Jordanian Dinar",       symbol: "JD"  },
  { code: "IQD", name: "Iraqi Dinar",           symbol: "ع.د" },
  { code: "ILS", name: "Israeli Shekel",        symbol: "₪"   },
  { code: "TRY", name: "Turkish Lira",          symbol: "₺"   },
  // ── Africa ───────────────────────────────────────────────────────────────
  { code: "ZAR", name: "South African Rand",    symbol: "R"   },
  { code: "EGP", name: "Egyptian Pound",        symbol: "E£"  },
  { code: "NGN", name: "Nigerian Naira",        symbol: "₦"   },
  { code: "KES", name: "Kenyan Shilling",       symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi",         symbol: "₵"   },
  { code: "ETB", name: "Ethiopian Birr",        symbol: "Br"  },
  { code: "TZS", name: "Tanzanian Shilling",    symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling",      symbol: "USh" },
  { code: "MAD", name: "Moroccan Dirham",       symbol: "MAD" },
  { code: "TND", name: "Tunisian Dinar",        symbol: "TND" },
  { code: "DZD", name: "Algerian Dinar",        symbol: "DZD" },
  // ── Americas ─────────────────────────────────────────────────────────────
  { code: "MXN", name: "Mexican Peso",          symbol: "$"   },
  { code: "BRL", name: "Brazilian Real",        symbol: "R$"  },
  { code: "ARS", name: "Argentine Peso",        symbol: "$"   },
  { code: "CLP", name: "Chilean Peso",          symbol: "$"   },
  { code: "COP", name: "Colombian Peso",        symbol: "$"   },
  { code: "PEN", name: "Peruvian Sol",          symbol: "S/." },
  { code: "UYU", name: "Uruguayan Peso",        symbol: "$U"  },
  { code: "BOB", name: "Bolivian Boliviano",    symbol: "Bs." },
  { code: "PYG", name: "Paraguayan Guaraní",    symbol: "₲"   },
  // ── Europe (non-EUR) ─────────────────────────────────────────────────────
  { code: "PLN", name: "Polish Złoty",          symbol: "zł"  },
  { code: "CZK", name: "Czech Koruna",          symbol: "Kč"  },
  { code: "HUF", name: "Hungarian Forint",      symbol: "Ft"  },
  { code: "RON", name: "Romanian Leu",          symbol: "lei" },
  { code: "BGN", name: "Bulgarian Lev",         symbol: "лв"  },
  { code: "HRK", name: "Croatian Kuna",         symbol: "kn"  },
  { code: "RSD", name: "Serbian Dinar",         symbol: "din" },
  { code: "ISK", name: "Icelandic Króna",       symbol: "kr"  },
  // ── Post-Soviet / Central Asia ───────────────────────────────────────────
  { code: "RUB", name: "Russian Ruble",         symbol: "₽"   },
  { code: "UAH", name: "Ukrainian Hryvnia",     symbol: "₴"   },
  { code: "KZT", name: "Kazakhstani Tenge",     symbol: "₸"   },
  { code: "UZS", name: "Uzbekistani Som",       symbol: "so'm"},
  { code: "GEL", name: "Georgian Lari",         symbol: "₾"   },
  { code: "AMD", name: "Armenian Dram",         symbol: "֏"   },
  { code: "AZN", name: "Azerbaijani Manat",     symbol: "₼"   },
  // ── Other Notable ────────────────────────────────────────────────────────
  { code: "AFN", name: "Afghan Afghani",        symbol: "؋"   },
  { code: "XAF", name: "Central African CFA",   symbol: "FCFA"},
  { code: "XOF", name: "West African CFA",      symbol: "CFA" },
];

// Lookup map for O(1) code → option resolution
const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));

/** Returns the full CurrencyOption for a code, or null */
export function getCurrency(code: string): CurrencyOption | null {
  return CURRENCY_MAP.get(code.toUpperCase()) ?? null;
}

// ── Component ────────────────────────────────────────────────────────────────

interface CurrencySelectProps {
  /** ISO 4217 code string, e.g. "USD".  Pass "" for unset. */
  value: string;
  /** Called with the ISO code string on change, or "" when cleared. */
  onChange: (code: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  /** @default "outlined" */
  variant?: "filled" | "outlined" | "standard";
  /** @default "medium" */
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  label = "Currency",
  required = false,
  error = false,
  helperText,
  variant = "outlined",
  size = "medium",
  fullWidth = true,
  disabled = false,
  placeholder,
}) => {
  const selected = value ? (CURRENCY_MAP.get(value.toUpperCase()) ?? null) : null;

  return (
    <Autocomplete
      options={CURRENCIES}
      value={selected}
      onChange={(_e, option) => onChange(option?.code ?? "")}
      fullWidth={fullWidth}
      disabled={disabled}
      isOptionEqualToValue={(opt, val) => opt.code === val.code}
      // Search by code, name, OR symbol
      filterOptions={(options, { inputValue }) => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
          (o) =>
            o.code.toLowerCase().includes(q) ||
            o.name.toLowerCase().includes(q) ||
            o.symbol.toLowerCase().includes(q)
        );
      }}
      getOptionLabel={(o) => `${o.code} — ${o.name} (${o.symbol})`}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ py: "6px !important" }}>
          {/* Code badge */}
          <Typography
            component="span"
            sx={{
              display: "inline-block",
              minWidth: 40,
              fontWeight: 700,
              fontSize: 12,
              color: "#605DFF",
              fontFamily: "monospace",
              mr: 1.5,
            }}
          >
            {option.code}
          </Typography>
          {/* Name */}
          <Typography component="span" variant="body2" sx={{ flex: 1 }}>
            {option.name}
          </Typography>
          {/* Symbol pill */}
          <Typography
            component="span"
            sx={{
              ml: 1.5,
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              bgcolor: "rgba(96,93,255,0.08)",
              color: "#605DFF",
              fontWeight: 700,
              fontSize: 13,
              minWidth: 28,
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {option.symbol}
          </Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          variant={variant}
          size={size}
          placeholder={placeholder}
        />
      )}
    />
  );
};

export default CurrencySelect;
