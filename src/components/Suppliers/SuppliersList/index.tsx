"use client";

import React, { useState, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Checkbox,
  Typography,
  Divider,
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
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

// Full list of world countries
const countries = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AS", name: "American Samoa" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AI", name: "Anguilla" },
  { code: "AQ", name: "Antarctica" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AW", name: "Aruba" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BM", name: "Bermuda" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BQ", name: "Bonaire, Sint Eustatius and Saba" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BV", name: "Bouvet Island" },
  { code: "BR", name: "Brazil" },
  { code: "IO", name: "British Indian Ocean Territory" },
  { code: "BN", name: "Brunei Darussalam" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "KY", name: "Cayman Islands" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CX", name: "Christmas Island" },
  { code: "CC", name: "Cocos (Keeling) Islands" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (Democratic Republic)" },
  { code: "CK", name: "Cook Islands" },
  { code: "CR", name: "Costa Rica" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CW", name: "Curaçao" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FK", name: "Falkland Islands" },
  { code: "FO", name: "Faroe Islands" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GF", name: "French Guiana" },
  { code: "PF", name: "French Polynesia" },
  { code: "TF", name: "French Southern Territories" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GI", name: "Gibraltar" },
  { code: "GR", name: "Greece" },
  { code: "GL", name: "Greenland" },
  { code: "GD", name: "Grenada" },
  { code: "GP", name: "Guadeloupe" },
  { code: "GU", name: "Guam" },
  { code: "GT", name: "Guatemala" },
  { code: "GG", name: "Guernsey" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HM", name: "Heard Island and McDonald Islands" },
  { code: "VA", name: "Holy See" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IM", name: "Isle of Man" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JE", name: "Jersey" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macao" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MQ", name: "Martinique" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "YT", name: "Mayotte" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MS", name: "Montserrat" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NC", name: "New Caledonia" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "NU", name: "Niue" },
  { code: "NF", name: "Norfolk Island" },
  { code: "MP", name: "Northern Mariana Islands" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PN", name: "Pitcairn" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "QA", name: "Qatar" },
  { code: "RE", name: "Réunion" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "BL", name: "Saint Barthélemy" },
  { code: "SH", name: "Saint Helena" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "MF", name: "Saint Martin" },
  { code: "PM", name: "Saint Pierre and Miquelon" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SX", name: "Sint Maarten" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TC", name: "Turks and Caicos Islands" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "WF", name: "Wallis and Futuna" },
  { code: "EH", name: "Western Sahara" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "KRW", name: "South Korean Won" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "INR", name: "Indian Rupee" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ZAR", name: "South African Rand" },
];

interface SupplierType {
  id: number;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  supplier_country: string;
  supplier_currency: string; // legacy single value, kept as the primary/first currency
  supplier_currencies: string[]; // a supplier can be paid in more than one currency
  supplierTypes: SupplierType[];
}

const SupplierList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // For filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<SupplierType[]>([]);

  // All supplier types for edit & filter
  const [allSupplierTypes, setAllSupplierTypes] = useState<SupplierType[]>([]);
  // Build the options for the filter:
  const countriesFilterOptions = countries.map(({ code, name }) => ({ code, label: name }));

  // In your component, ensure you have a state variable to hold the filter:
  // const [countryFilter, setCountryFilter] = useState<string>("all");

  // Fetch suppliers and map data
  // useEffect(() => {
  //   const fetchSuppliers = async () => {
  //     try {
  //       const response = await api.get("/api/suppliers");
  //       // Adjust based on your API's nesting structure:
  //       const suppliersData = response.data.data?.data || response.data.data || response.data;
  //       const formattedSuppliers = Array.isArray(suppliersData)
  //         ? suppliersData.map((sup: any) => ({
  //             ...sup,
  //             supplier_country: sup.supplier_country || "",
  //             supplier_currency: sup.supplier_currency || "",
  //             supplierTypes: sup.supplierTypes || sup.supplier_types || [],
  //           }))
  //         : [];
  //       setSuppliers(formattedSuppliers);
  //     } catch (err: any) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchSuppliers();
  // }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api.get("/api/suppliers");
        const suppliersData = response.data.data?.data || response.data.data || response.data;
        const formattedSuppliers = Array.isArray(suppliersData)
          ? suppliersData.map((sup: any) => {
              const countryObj = countries.find((c) => c.code === sup.supplier_country);
              return {
                ...sup,
                supplier_country: sup.supplier_country || "",
                supplier_country_name: countryObj ? countryObj.name : sup.supplier_country,
                supplier_currencies:
                  sup.supplier_currencies && sup.supplier_currencies.length > 0
                    ? sup.supplier_currencies
                    : sup.supplier_currency
                    ? [sup.supplier_currency]
                    : [],
                supplierTypes: sup.supplierTypes || sup.supplier_types || [],
              };
            })
          : [];
        setSuppliers(formattedSuppliers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);
  
  const uniqueSupplierCountries = React.useMemo(() => {
    // Extract only the supplier_country codes from your supplier data
    const codes = suppliers.map(s => s.supplier_country).filter(code => code);
    // Get unique codes
    const uniqueCodes = Array.from(new Set(codes));
    // Map each code to a { code, name } object using your countries mapping
    return uniqueCodes.map(code => {
      const countryObj = countries.find(c => c.code === code);
      return { code, name: countryObj ? countryObj.name : code };
    });
  }, [suppliers]);
  

  // Fetch supplier types for filters and edit dialog
  useEffect(() => {
    const fetchSupplierTypes = async () => {
      try {
        const response = await api.get("/api/supplier-types/");
        setAllSupplierTypes(response.data);
      } catch (err: any) {
        console.error("Error fetching supplier types:", err);
      }
    };
    fetchSupplierTypes();
  }, []);

  // Build unique countries for the Country filter
  const uniqueCountries = Array.from(
    new Set(suppliers.map((s) => s.supplier_country).filter((c) => c))
  ).sort();

  const handleDelete = async (supplierId: string) => {
    try {
      await api.delete(`/api/suppliers/${supplierId}`);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Supplier deleted successfully.",
        confirmButtonText: "OK",
      });
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete the supplier. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentSupplier(null);
  };

  const handleDialogSave = async () => {
    if (currentSupplier) {
      try {
        const payload = {
          name: currentSupplier.name,
          email: currentSupplier.email,
          supplier_country: currentSupplier.supplier_country,
          supplier_currencies: currentSupplier.supplier_currencies,
          // Send supplier types as an array of IDs
          supplier_type_ids: currentSupplier.supplierTypes.map((type) => type.id),
        };
        console.log("Payload:", payload);
        const response = await api.put(`/api/suppliers/${currentSupplier.id}`, payload);
        const updatedSupplier = response.data.data || response.data;
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === currentSupplier.id ? updatedSupplier : s
          )
        );
        setDialogOpen(false);
      } catch (err: any) {
        console.error("Error saving supplier:", err);
      }
    }
  };

  // Filters
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry =
      countryFilter === "all" || supplier.supplier_country === countryFilter;
    const matchesType =
      supplierTypeFilter.length === 0 ||
      supplier.supplierTypes.some((type) =>
        supplierTypeFilter.some((f) => Number(f.id) === Number(type.id))
      );
    return matchesSearch && matchesCountry && matchesType;
  });

  const handleResetFilters = () => {
    setCountryFilter("all");
    setSupplierTypeFilter([]);
    setSearchQuery("");
  };

  // DataGrid columns definition
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "supplier_currencies",
      headerName: "Currencies",
      flex: 1,
      valueGetter: (_value: unknown, row: Supplier) =>
        (row.supplier_currencies?.length ? row.supplier_currencies : [row.supplier_currency]).join(", "),
    },
    { field: "supplier_country_name", headerName: "Country", flex: 1 },
    {
      field: "supplierTypes",
      headerName: "Supplier Types",
      flex: 1,
      renderCell: (params: GridRenderCellParams<any, Supplier, any>) => {
        const types = params.row.supplierTypes;
        if (!types || !Array.isArray(types) || types.length === 0) return "No Data";
        return types.map((t: SupplierType) => t.name).join(", ");
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<any, Supplier, any>) => (
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

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error"><AlertTitle>Error</AlertTitle>{error}</Alert>;

  return (
    <>
      <Card sx={{ mb: 3, p: 3 }}>
        {/* Filter Controls */}
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search suppliers..."
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
          {/* <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="country-filter-label">Country</InputLabel>
            <Select
              labelId="country-filter-label"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              label="Country"
            >
              <MenuItem value="all">All</MenuItem>
              {uniqueCountries.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
          {/* <Autocomplete
            freeSolo={false}
            options={countries}
            getOptionLabel={(option) => option.name}
            value={countryFilter === "all" ? null : countries.find(c => c.code === countryFilter) || null}
            onChange={(event, newValue) => {
              setCountryFilter(newValue ? newValue.code : "all");
            }}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Country" size="small" />
            )}
            sx={{ minWidth: 150 }}
          /> */}
          <Autocomplete
  freeSolo={false}
  options={uniqueSupplierCountries}
  getOptionLabel={(option) => option.name}
  value={
    countryFilter === "all"
      ? null
      : uniqueSupplierCountries.find((c) => c.code === countryFilter) || null
  }
  onChange={(event, newValue) => {
    setCountryFilter(newValue ? newValue.code : "all");
  }}
  renderInput={(params) => (
    <TextField {...params} variant="outlined" label="Country" size="small" />
  )}
  sx={{ minWidth: 150 }}
/>


          <Autocomplete
            multiple
            disableCloseOnSelect
            options={allSupplierTypes}
            getOptionLabel={(option) => option.name}
            value={supplierTypeFilter}
            onChange={(e, newValue) => setSupplierTypeFilter(newValue)}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Supplier Types" size="small" />
            )}
            isOptionEqualToValue={(option, value) =>
              Number(option.id) === Number(value.id)
            }
            sx={{ minWidth: 200 }}
          />
          <Button variant="outlined" size="small" onClick={handleResetFilters}>
            Reset Filters
          </Button>
          {/* Preserve the Add Supplier button */}
          <Link href="/suppliers/add-supplier">
            <Button variant="outlined" startIcon={<AddIcon />}>
              Add Supplier
            </Button>
          </Link>
        </Box>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            autoHeight
            rows={filteredSuppliers}
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
        <DialogTitle>Edit Supplier</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={currentSupplier?.name || ""}
            onChange={(e) =>
              setCurrentSupplier((prev) =>
                prev ? { ...prev, name: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            value={currentSupplier?.email || ""}
            onChange={(e) =>
              setCurrentSupplier((prev) =>
                prev ? { ...prev, email: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
          />
          {/* <Autocomplete
            options={countries}
            getOptionLabel={(option) => option.name}
            value={
              countries.find(c => c.name === currentSupplier?.supplier_country) || null
            }
            onChange={(event, newValue) =>
              setCurrentSupplier(prev =>
                prev ? { ...prev, supplier_country: newValue ? newValue.name : "" } : null
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Country" variant="filled" margin="dense" />
            )}
          /> */}
          <Autocomplete
            options={countries}
            getOptionLabel={(option) => option.name}
            value={
              countries.find(c => c.code === currentSupplier?.supplier_country) || null
            }
            onChange={(event, newValue) =>
              setCurrentSupplier(prev =>
                prev ? { ...prev, supplier_country: newValue ? newValue.code : "" } : null
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Country" variant="filled" margin="dense" />
            )}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={currencies}
            getOptionLabel={(option) => `${option.code} — ${option.name}`}
            value={
              (currentSupplier?.supplier_currencies ?? []).map(
                (code) => currencies.find((c) => c.code === code) ?? { code, name: code }
              )
            }
            onChange={(event, newValue) =>
              setCurrentSupplier(prev =>
                prev ? { ...prev, supplier_currencies: newValue.map((c) => c.code) } : null
              )
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.code} — {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Supplier Currencies" variant="filled" margin="dense" />
            )}
            isOptionEqualToValue={(option, value) => option.code === value.code}
          />

          <Autocomplete
            multiple
            id="edit-supplier-types"
            options={allSupplierTypes}
            disableCloseOnSelect
            getOptionLabel={(option) => option.name}
            value={currentSupplier?.supplierTypes || []}
            onChange={(event, newValue) =>
              setCurrentSupplier((prev) =>
                prev ? { ...prev, supplierTypes: newValue } : null
              )
            }
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Supplier Types" variant="filled" margin="dense" />
            )}
            isOptionEqualToValue={(option, value) =>
              Number(option.id) === Number(value.id)
            }
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

export default SupplierList;
