"use client";

import React from "react";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PublicIcon from "@mui/icons-material/Public";
import { useDepartment } from "@/context/DepartmentContext";

/**
 * DepartmentSwitcher
 *
 * Lets the logged-in user switch between their assigned departments.
 * For Super Admins a persistent "Global View" option is shown at the top:
 *   • Global View selected  → activeDepartment = null, X-Department-Id header
 *     is removed, backend DepartmentScope is bypassed, full data is returned.
 *   • Department selected   → normal scoped view for that department.
 *
 * The special sentinel value "__global__" is used as the MUI Select value
 * when Global View is active so the Select stays controlled (never empty).
 */

const GLOBAL_VALUE = "__global__";

const DepartmentSwitcher: React.FC = () => {
  const {
    departments,
    activeDepartment,
    setActiveDepartment,
    isLoading,
    isSuperAdmin,
  } = useDepartment();

  // Render for Super Admins even when they have no department assignments.
  // Regular users without departments don't need the switcher.
  if (isLoading) return null;
  if (!isSuperAdmin && departments.length === 0) return null;

  const selectValue =
    activeDepartment?.id != null ? activeDepartment.id : GLOBAL_VALUE;

  const handleChange = (value: number | typeof GLOBAL_VALUE) => {
    if (value === GLOBAL_VALUE) {
      setActiveDepartment(null);
    } else {
      const chosen = departments.find((d) => d.id === value) ?? null;
      setActiveDepartment(chosen);
    }
  };

  return (
    <FormControl
      size="small"
      sx={{ minWidth: { xs: "120px", md: "155px" } }}
    >
        <Select
          value={selectValue}
          onChange={(e) =>
            handleChange(e.target.value as number | typeof GLOBAL_VALUE)
          }
          displayEmpty
          renderValue={() => {
            const isGlobal = activeDepartment == null;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {isGlobal ? (
                  <PublicIcon sx={{ fontSize: "15px", color: "#605DFF" }} />
                ) : (
                  <BusinessIcon sx={{ fontSize: "15px", color: "#605DFF" }} />
                )}
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#260944",
                    maxWidth: "105px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isGlobal ? "Global View" : activeDepartment?.name}
                </Typography>
              </Box>
            );
          }}
          sx={{
            borderRadius: "7px",
            backgroundColor: "#F6F7F9",
            fontSize: "12px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#eceef2",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#605DFF",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#605DFF",
              borderWidth: "1px",
            },
            "& .MuiSelect-select": {
              py: "6px",
              px: "10px",
              display: "flex",
              alignItems: "center",
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: "7px",
                boxShadow: "0 4px 45px #0000001a",
                mt: 0.5,
              },
            },
          }}
        >
          {/* ── Global View — Super Admin only ─────────────────────────── */}
          {isSuperAdmin && (
            <MenuItem
              value={GLOBAL_VALUE}
              sx={{
                fontSize: "13px",
                gap: "8px",
                "&.Mui-selected": {
                  backgroundColor: "#F0EFFF",
                  "&:hover": { backgroundColor: "#E8E7FF" },
                },
              }}
            >
              <PublicIcon sx={{ fontSize: "16px", color: "#605DFF" }} />
              <Box sx={{ flex: 1 }}>Global View</Box>
              {activeDepartment == null && (
                <Chip
                  label="Active"
                  size="small"
                  sx={{
                    ml: "auto",
                    height: 18,
                    fontSize: "10px",
                    backgroundColor: "#605DFF",
                    color: "#fff",
                    "& .MuiChip-label": { px: "6px" },
                  }}
                />
              )}
            </MenuItem>
          )}

          {/* Divider between Global View and department list */}
          {isSuperAdmin && departments.length > 0 && (
            <Divider sx={{ my: 0.5 }} />
          )}

          {/* ── Per-department items ───────────────────────────────────── */}
          {departments.map((dept) => (
            <MenuItem
              key={dept.id}
              value={dept.id}
              sx={{
                fontSize: "13px",
                gap: "8px",
                "&.Mui-selected": {
                  backgroundColor: "#F0EFFF",
                  "&:hover": { backgroundColor: "#E8E7FF" },
                },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    activeDepartment?.id === dept.id ? "#605DFF" : "#b1bbc8",
                  flexShrink: 0,
                }}
              />
              {dept.name}
              {activeDepartment?.id === dept.id && (
                <Chip
                  label="Active"
                  size="small"
                  sx={{
                    ml: "auto",
                    height: 18,
                    fontSize: "10px",
                    backgroundColor: "#605DFF",
                    color: "#fff",
                    "& .MuiChip-label": { px: "6px" },
                  }}
                />
              )}
            </MenuItem>
          ))}
        </Select>
    </FormControl>
  );
};

export default DepartmentSwitcher;
