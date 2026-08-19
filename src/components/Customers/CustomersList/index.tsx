"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  AlertTitle,
  Grid,
  Autocomplete,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import api from "@/api/api";
import Swal from "sweetalert2";

// Static list of countries
const countries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  // ... add more countries as needed
];

interface Customer {
  id: string;
  name: string;
  passport_number: string;
  passport_expiry: string;
  issuing_country: string;
  issuing_country_name?: string;
  date_of_birth: string;
}

const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  // For field-level errors in edit dialog
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});

  // Fetch customers from API and map data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/api/customers");
        // Adjust based on your API structure:
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];
        const formatted = data.map((cust: any) => {
          const countryObj = countries.find(c => c.code === cust.issuing_country);
          return {
            ...cust,
            issuing_country: cust.issuing_country || "",
            issuing_country_name: countryObj ? countryObj.name : cust.issuing_country,
          };
        });
        setCustomers(formatted);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Build unique countries for filter options
  const uniqueCountries = useMemo(() => {
    const codes = customers.map(c => c.issuing_country).filter(Boolean);
    const uniqueCodes = Array.from(new Set(codes));
    return uniqueCodes.map(code => {
      const countryObj = countries.find(c => c.code === code);
      return { code, name: countryObj ? countryObj.name : code };
    });
  }, [customers]);

  // Filter customers based on search and country filter
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.passport_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry =
      countryFilter === "all" || cust.issuing_country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const handleDelete = async (customerId: string) => {
    try {
      await api.delete(`/api/customers/${customerId}`);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Customer deleted successfully.",
        confirmButtonText: "OK",
      });
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete customer. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setCurrentCustomer(customer);
    setEditErrors({});
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentCustomer(null);
    setEditErrors({});
  };

  const handleDialogSave = async () => {
    if (currentCustomer) {
      try {
        // Prepare payload for update
        const payload = {
          name: currentCustomer.name,
          passport_number: currentCustomer.passport_number,
          passport_expiry: currentCustomer.passport_expiry,
          issuing_country: currentCustomer.issuing_country,
          date_of_birth: currentCustomer.date_of_birth,
        };
        const response = await api.put(`/api/customers/${currentCustomer.id}`, payload);
        let updated = response.data.data || response.data;
        // Map issuing_country code to country name immediately
        const countryObj = countries.find(c => c.code === updated.issuing_country);
        updated.issuing_country_name = countryObj ? countryObj.name : updated.issuing_country;
        setCustomers(prev =>
          prev.map(c => c.id === currentCustomer.id ? updated : c)
        );
        setDialogOpen(false);
      } catch (err: any) {
        // Assuming error response is in format { errors: { field: ["error message"] } }
        if (err.response && err.response.data && err.response.data.errors) {
          setEditErrors(err.response.data.errors);
        } else {
          setError(err.response?.data?.message || "An error occurred while updating the customer.");
        }
        console.error("Error saving customer:", err);
      }
    }
  };

  // DataGrid columns definition
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "passport_number", headerName: "Passport Number", flex: 1 },
    { field: "passport_expiry", headerName: "Passport Expiry", flex: 1 },
    { field: "issuing_country_name", headerName: "Issuing Country", flex: 1 },
    { field: "date_of_birth", headerName: "Date of Birth", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<any, Customer, any>) => (
        <Box display="flex" gap={1}>
          <IconButton
            aria-label="edit"
            color="secondary"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleResetFilters = () => {
    setCountryFilter("all");
    setSearchQuery("");
  };

  if (loading) return <CircularProgress />;
  if (error)
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );

  return (
    <>
      <Card sx={{ mb: 3, p: 3 }}>
        {/* Filter Controls */}
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by name or passport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <Autocomplete
            freeSolo={false}
            options={uniqueCountries}
            getOptionLabel={(option) => option.name}
            value={
              countryFilter === "all"
                ? null
                : uniqueCountries.find((c) => c.code === countryFilter) || null
            }
            onChange={(event, newValue) => {
              setCountryFilter(newValue ? newValue.code : "all");
            }}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Issuing Country" size="small" />
            )}
            sx={{ minWidth: 150 }}
          />
          <Button variant="outlined" size="small" onClick={handleResetFilters}>
            Reset Filters
          </Button>
          <Link href="/customers/add-customer">
            <Button variant="outlined" startIcon={<AddIcon />}>
              Add Customer
            </Button>
          </Link>
        </Box>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            autoHeight
            rows={filteredCustomers}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 20]}
            sx={{
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordWrap: "break-word",
              },
            }}
          />
        </Box>
      </Card>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={currentCustomer?.name || ""}
            onChange={(e) =>
              setCurrentCustomer((prev) =>
                prev ? { ...prev, name: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
            error={!!editErrors.name}
            helperText={editErrors.name ? editErrors.name[0] : ""}
          />
          <TextField
            label="Passport Number"
            value={currentCustomer?.passport_number || ""}
            onChange={(e) =>
              setCurrentCustomer((prev) =>
                prev ? { ...prev, passport_number: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
            error={!!editErrors.passport_number}
            helperText={editErrors.passport_number ? editErrors.passport_number[0] : ""}
          />
          <TextField
            label="Passport Expiry"
            type="date"
            value={currentCustomer?.passport_expiry || ""}
            onChange={(e) =>
              setCurrentCustomer((prev) =>
                prev ? { ...prev, passport_expiry: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            error={!!editErrors.passport_expiry}
            helperText={editErrors.passport_expiry ? editErrors.passport_expiry[0] : ""}
          />
          <Autocomplete
            options={countries}
            getOptionLabel={(option) => option.name}
            value={countries.find(c => c.code === currentCustomer?.issuing_country) || null}
            onChange={(event, newValue) =>
              setCurrentCustomer(prev =>
                prev ? { ...prev, issuing_country: newValue ? newValue.code : "" } : null
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Issuing Country" variant="filled" margin="dense" error={!!editErrors.issuing_country} helperText={editErrors.issuing_country ? editErrors.issuing_country[0] : ""} />
            )}
          />
          <TextField
            label="Date of Birth"
            type="date"
            value={currentCustomer?.date_of_birth || ""}
            onChange={(e) =>
              setCurrentCustomer((prev) =>
                prev ? { ...prev, date_of_birth: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            error={!!editErrors.date_of_birth}
            helperText={editErrors.date_of_birth ? editErrors.date_of_birth[0] : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomersList;
