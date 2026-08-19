"use client";

import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  Box,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Skeleton,
  Typography,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import PeopleIcon from "@mui/icons-material/People";
import BadgeIcon from "@mui/icons-material/Badge";
import { useRouter } from "next/navigation";
import api from "@/api/api";

// ── Styled components ──────────────────────────────────────────────────────────

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: 7,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  color: "#757FEF",
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  right: "0",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 5,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    backgroundColor: "#F5F7FA",
    borderRadius: "7px",
    padding: theme.spacing(1.4, 0, 1.4, 2),
    paddingRight: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "110px",
      "&:focus": { width: "160px" },
    },
    [theme.breakpoints.up("md")]: {
      width: "200px",
      "&:focus": { width: "280px" },
    },
  },
}));

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: number;
  label: string;
  url: string;
}

interface SearchResults {
  bookings: SearchResult[];
  customers: SearchResult[];
  employees: SearchResult[];
}

interface FlatItem extends SearchResult {
  section: string;
}

function flattenResults(r: SearchResults): FlatItem[] {
  return [
    ...r.bookings.map((x) => ({ ...x, section: "bookings" })),
    ...r.customers.map((x) => ({ ...x, section: "customers" })),
    ...r.employees.map((x) => ({ ...x, section: "employees" })),
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

const SearchForm: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(-1);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatItems = React.useMemo(
    () => (results ? flattenResults(results) : []),
    [results]
  );

  const totalCount = flatItems.length;

  const hasResults =
    results &&
    (results.bookings.length > 0 ||
      results.customers.length > 0 ||
      results.employees.length > 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get<SearchResults>("/api/search", { params: { q: val } });
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleFocus = () => {
    if (blurRef.current) clearTimeout(blurRef.current);
    if (results && query.length >= 2) setOpen(true);
  };

  const handleBlur = () => {
    blurRef.current = setTimeout(() => {
      setOpen(false);
      setActiveIdx(-1);
    }, 150);
  };

  const handleNavigate = (url: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setActiveIdx(-1);
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || flatItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleNavigate(flatItems[activeIdx].url);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // flat index tracker (reset before renderSection calls)
  let globalIdx = 0;

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: SearchResult[]
  ) => {
    if (items.length === 0) return null;
    const sectionStart = globalIdx;
    globalIdx += items.length;

    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            pt: 1,
            pb: 0.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ color: "primary.main", display: "flex", fontSize: 16 }}>{icon}</Box>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              {title}
            </Typography>
          </Box>
          <Chip
            label={items.length}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: "rgba(96,93,255,0.1)",
              color: "#605DFF",
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        </Box>
        <List dense disablePadding>
          {items.map((item, i) => {
            const idx = sectionStart + i;
            return (
              <ListItemButton
                key={item.id}
                selected={idx === activeIdx}
                onClick={() => handleNavigate(item.url)}
                sx={{
                  px: 2,
                  py: 0.6,
                  "&:hover": { bgcolor: "rgba(96,93,255,0.06)" },
                  "&.Mui-selected": { bgcolor: "rgba(96,93,255,0.10)" },
                  "&.Mui-selected:hover": { bgcolor: "rgba(96,93,255,0.14)" },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    );
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <Search className="search-form" ref={anchorRef}>
          <SearchIconWrapper>
            {loading ? (
              <CircularProgress size={16} sx={{ color: "#757FEF" }} />
            ) : (
              <SearchIcon />
            )}
          </SearchIconWrapper>

          <StyledInputBase
            placeholder="AI Search…"
            inputProps={{ "aria-label": "search" }}
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </Search>
      </form>

      <Popper
        open={open && query.length >= 2}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300, minWidth: anchorRef.current?.offsetWidth ?? 280 }}
      >
        <Paper
          elevation={4}
          sx={{
            mt: 0.5,
            borderRadius: 2,
            overflow: "hidden",
            minWidth: 320,
            maxWidth: 440,
            maxHeight: 420,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(96,93,255,0.18)",
          }}
        >
          {/* ── Header ── */}
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(96,93,255,0.04)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AutoAwesomeIcon sx={{ fontSize: 14, color: "#605DFF" }} />
              <Typography variant="caption" fontWeight={600} color="#605DFF">
                AI Search
              </Typography>
            </Box>
            {loading ? (
              <Skeleton variant="rounded" width={60} height={16} />
            ) : totalCount > 0 ? (
              <Typography variant="caption" color="text.secondary">
                {totalCount} result{totalCount !== 1 ? "s" : ""}
              </Typography>
            ) : null}
          </Box>

          {/* ── Body ── */}
          {loading ? (
            <Box sx={{ px: 2, py: 1.5 }}>
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} variant="text" height={32} sx={{ mb: 0.5 }} />
              ))}
            </Box>
          ) : hasResults ? (
            <>
              {renderSection("Bookings", <FlightTakeoffIcon fontSize="inherit" />, results!.bookings)}
              {results!.bookings.length > 0 &&
                (results!.customers.length > 0 || results!.employees.length > 0) && (
                  <Divider />
                )}
              {renderSection("Customers", <PeopleIcon fontSize="inherit" />, results!.customers)}
              {results!.customers.length > 0 && results!.employees.length > 0 && <Divider />}
              {renderSection("Employees", <BadgeIcon fontSize="inherit" />, results!.employees)}
            </>
          ) : (
            <Box sx={{ px: 2, py: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No results for &ldquo;{query}&rdquo;
              </Typography>
            </Box>
          )}

          {/* ── Footer hint ── */}
          {!loading && hasResults && (
            <Box
              sx={{
                px: 2,
                py: 0.75,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "rgba(0,0,0,0.01)",
              }}
            >
              <Typography variant="caption" color="text.disabled">
                ↑↓ navigate &nbsp;·&nbsp; Enter select &nbsp;·&nbsp; Esc close
              </Typography>
            </Box>
          )}
        </Paper>
      </Popper>
    </>
  );
};

export default SearchForm;
