"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  AlertTitle,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Autocomplete,
  Checkbox,
  CircularProgress,
  Divider,
  TableFooter,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Link from "next/link";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import EditIcon from "@mui/icons-material/Edit";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
// import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import api from "@/api/api";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

// Helper: TabPanel for rendering tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tab-panel-${index}`,
  };
}

// TablePaginationActions for tables (inspired by your RecentOrders design)
interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number
  ) => void;
}

interface Permission {
    id: number;
    name: string;
  }
  
  interface Role {
    id: number;
    name: string;
    // We assume roles are returned with a list of permission names
    permissions: string[];
  }


function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page - 1);
  };





  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page + 1);
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        gap: "10px",
        padding: "14px 20px",
      }}
    >
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        sx={{ borderRadius: "4px", padding: "6px" }}
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        sx={{ borderRadius: "4px", padding: "6px" }}
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
    </Box>
  );
}

// Main component
const SiteSettingsTabsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState<number>(0);

  // ===== Panel 1: Site Settings State =====
  const [siteName, setSiteName] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [siteTitle, setSiteTitle] = useState<string>("");
  const [tagline, setTagline] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");

  const [siteSettingsError, setSiteSettingsError] = useState<string | null>(null);
  const [siteSettingsSuccess, setSiteSettingsSuccess] = useState<string | null>(null);
  const [siteSettingsLoading, setSiteSettingsLoading] = useState<boolean>(false);

  // ===== Panel 2: Roles State =====
//   const [roles, setRoles] = useState<any[]>([]);
  const [newRole, setNewRole] = useState<string>("");
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesSuccess, setRolesSuccess] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [rolesPage, setRolesPage] = useState<number>(0);
  const [rolesRowsPerPage, setRolesRowsPerPage] = useState<number>(5);
  

  // ===== Panel 3: Departments State =====
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDepartment, setNewDepartment] = useState<string>("");
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [departmentsSuccess, setDepartmentsSuccess] = useState<string | null>(null);
  const [departmentsLoading, setDepartmentsLoading] = useState<boolean>(false);
  const [departmentsPage, setDepartmentsPage] = useState<number>(0);
  const [departmentsRowsPerPage, setDepartmentsRowsPerPage] = useState<number>(5);
  const departmentsEmptyRows =
    departmentsPage > 0
      ? Math.max(0, (1 + departmentsPage) * departmentsRowsPerPage - departments.length)
      : 0;

  // ===== Panel 4: Permissions State =====
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<any | null>(null);
//   const [selectedPermissions, setSelectedPermissions] = useState<any[]>([]);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [permissionsSuccess, setPermissionsSuccess] = useState<string | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);



  //fetch permissions and roles
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newPermission, setNewPermission] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  //
  const rolesEmptyRows =
    rolesPage > 0
      ? Math.max(0, (1 + rolesPage) * rolesRowsPerPage - roles.length)
      : 0;
  useEffect(() => {
    const fetchPermissions = async () => {
        try {
        const res = await api.get("/api/permissions");
        setPermissions(res.data);
        } catch (err: any) {
        setError("Failed to fetch permissions");
        }
    };
    const fetchRoles = async () => {
        try {
        const res = await api.get("/api/roles");
        setRoles(res.data);
        } catch (err: any) {
        setError("Failed to fetch roles");
        }
    };
    fetchPermissions();
    fetchRoles();
    }, []);

    const handleAddPermission = async () => {
        setError(null);
        try {
          const res = await api.post("/api/permissions", { name: newPermission });
          setPermissions([...permissions, res.data]);
          setNewPermission("");
          setSuccess("Permission added");
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError("Failed to add permission");
        }
    };


    const handleAssignPermissions = async () => {
        if (!selectedRole) return;
        setError(null);
        try {
          const permissionNames = selectedPermissions.map((p) => p.name);
          const res = await api.post(`/api/roles/${selectedRole.id}/permissions`, { permissions: permissionNames });
          setSuccess("Permissions assigned to role");
          setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
          setError("Failed to assign permissions");
        }
    };
  // ===== Fetch Data for Panels 2, 3, 4 =====
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/api/roles");
        setRoles(res.data);
        setAvailableRoles(res.data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/api/departments");
        setDepartments(res.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    const fetchPermissions = async () => {
      try {
        const res = await api.get("/api/permissions");
        setAllPermissions(res.data);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchRoles();
    fetchDepartments();
    fetchPermissions();
  }, []);



  // Fetch roles and permissions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          api.get("/api/roles"),       // should return roles with permissions
          api.get("/api/permissions"), // should return all available permissions
        ]);
        setRoles(rolesRes.data);
        setPermissions(permsRes.data);
      } catch (err: any) {
        setError("Error fetching data");
      }
    };

    fetchData();
  }, []);


  //Permission edit and delet start
  
  // --- Add these state declarations along with your other permission state variables ---
const [dialogPermissionOpen, setDialogPermissionOpen] = useState(false);
const [currentPermissionToEdit, setCurrentPermissionToEdit] = useState<Permission | null>(null);
const [editPermissionName, setEditPermissionName] = useState<string>("");

// --- Add these handler functions below your other permission handlers ---

const handleEditPermission = (permission: Permission) => {
  setCurrentPermissionToEdit(permission);
  setEditPermissionName(permission.name);
  setDialogPermissionOpen(true);
};

const handleDeletePermission = async (permissionId: number) => {
  try {
    await api.delete(`/api/permissions/${permissionId}`);
    setPermissions((prev) => prev.filter((p) => p.id !== permissionId));
    setSuccess("Permission deleted successfully");
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    setError("Failed to delete permission");
    setTimeout(() => setError(null), 3000);
  }
};

const handlePermissionDialogSave = async () => {
  if (!currentPermissionToEdit) return;
  try {
    const res = await api.put(`/api/permissions/${currentPermissionToEdit.id}`, { name: editPermissionName });
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === currentPermissionToEdit.id ? res.data : p
      )
    );
    setDialogPermissionOpen(false);
    setSuccess("Permission updated successfully");
    setTimeout(() => setSuccess(null), 3000);
  } catch (err: any) {
    setError("Failed to update permission");
    setTimeout(() => setError(null), 3000);
  }
};

// --- Define columns for the Permissions table ---
const permissionColumns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 80 },
  { field: "name", headerName: "Permission Name", flex: 1 },
  {
    field: "actions",
    headerName: "Actions",
    flex: 0.5,
    renderCell: (params: GridRenderCellParams) => (
      <Box display="flex" gap={1}>
        <IconButton onClick={() => handleEditPermission(params.row as Permission)} color="primary">
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={() => handleDeletePermission(params.row.id)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
  },
];


  //Permission edit and delete ends   

  // Handler to update a permission for a given role
  const handleCheckboxChange = async (role: Role, permissionName: string, checked: boolean) => {
    try {
      let updatedPermissions: string[] = [...role.permissions];
      if (checked) {
        // add the permission if not already there
        if (!updatedPermissions.includes(permissionName)) {
          updatedPermissions.push(permissionName);
        }
      } else {
        // remove the permission
        updatedPermissions = updatedPermissions.filter((p) => p !== permissionName);
      }
      // Optimistically update UI
      setRoles((prevRoles) =>
        prevRoles.map((r) => (r.id === role.id ? { ...r, permissions: updatedPermissions } : r))
      );
      // Call API endpoint to sync permissions for this role
      await api.post(`/api/roles/${role.id}/permissions`, { permissions: updatedPermissions });
      setSuccess("Role permissions updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Error updating permissions");
      setTimeout(() => setError(null), 3000);
    }
  };
  // ===== File Upload Handler =====
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setLogoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ===== Handle Tab Change =====
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // ===== Panel 1: Submit Site Settings =====
  const handleSiteSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiteSettingsError(null);
    setSiteSettingsSuccess(null);
    setSiteSettingsLoading(true);
    try {
      const formData = new FormData();
      formData.append("site_name", siteName);
      formData.append("currency", currency);
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      formData.append("site_title", siteTitle);
      formData.append("tagline", tagline);
      formData.append("contact_email", contactEmail);
      const res = await api.post("/api/site-settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 200 || res.status === 201) {
        setSiteSettingsSuccess("Site settings updated successfully!");
      } else {
        setSiteSettingsError("Failed to update site settings.");
      }
    } catch (error: any) {
      setSiteSettingsError(error.response?.data?.message || "Error updating site settings.");
    } finally {
      setSiteSettingsLoading(false);
    }
  };

  // ===== Panel 2: Add New Role =====
  const handleAddRole = async () => {
    if (!newRole) return;
    setRolesError(null);
    setRolesSuccess(null);
    setRolesLoading(true);
    try {
      const res = await api.post("/api/roles", { name: newRole });
      if (res.status === 200 || res.status === 201) {
        setRolesSuccess("Role added successfully!");
        const updated = await api.get("/api/roles");
        setRoles(updated.data);
        setAvailableRoles(updated.data);
        setNewRole("");
      } else {
        setRolesError("Failed to add role.");
      }
    } catch (error: any) {
      setRolesError(error.response?.data?.message || "Error adding role.");
    } finally {
      setRolesLoading(false);
    }
  };

  // ===== Panel 3: Add New Department =====
  const handleAddDepartment = async () => {
    if (!newDepartment) return;
    setDepartmentsError(null);
    setDepartmentsSuccess(null);
    setDepartmentsLoading(true);
    try {
      const res = await api.post("/api/departments", { name: newDepartment });
      if (res.status === 200 || res.status === 201) {
        setDepartmentsSuccess("Department added successfully!");
        const updated = await api.get("/api/departments");
        setDepartments(updated.data);
        setNewDepartment("");
      } else {
        setDepartmentsError("Failed to add department.");
      }
    } catch (error: any) {
      setDepartmentsError(error.response?.data?.message || "Error adding department.");
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // ===== Panel 4: Assign Permissions =====
  const handlePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForPermissions) {
      setPermissionsError("Please select a role.");
      return;
    }
    setPermissionsError(null);
    setPermissionsSuccess(null);
    setPermissionsLoading(true);
    try {
      const permissionIds = selectedPermissions.map((p) => p.id);
      const payload = {
        role_id: selectedRoleForPermissions.id,
        permissions: permissionIds,
      };
      const res = await api.post("/api/assign-permissions", payload);
      if (res.status === 200 || res.status === 201) {
        setPermissionsSuccess("Permissions assigned successfully!");
      } else {
        setPermissionsError("Failed to assign permissions.");
      }
    } catch (error: any) {
      setPermissionsError(error.response?.data?.message || "Error assigning permissions.");
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Pagination handlers for Roles table
  const handleRolesPageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setRolesPage(newPage);
  };
  const handleRolesRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRolesRowsPerPage(parseInt(event.target.value, 10));
    setRolesPage(0);
  };

  // Pagination handlers for Departments table
  const handleDepartmentsPageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setDepartmentsPage(newPage);
  };
  const handleDepartmentsRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setDepartmentsRowsPerPage(parseInt(event.target.value, 10));
    setDepartmentsPage(0);
  };

  return (
    <Box sx={{ width: "100%", mt: 4 }}>
      {/* <Typography variant="h4" align="center" gutterBottom>
        Site Settings & Configuration
      </Typography> */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Site Settings" {...a11yProps(0)} />
        <Tab label="Roles" {...a11yProps(1)} />
        <Tab label="Departments" {...a11yProps(2)} />
        <Tab label="Permissions" {...a11yProps(3)} />
      </Tabs>

      {/* ===== Tab Panel 1: Site Settings ===== */}
      <TabPanel value={tabIndex} index={0}>
        <Card
          sx={{
            boxShadow: "none",
            borderRadius: "7px",
            mb: "25px",
            p: { xs: "18px", sm: "20px", lg: "25px" },
          }}
          className="rmui-card"
        >
          <Box component="form" onSubmit={handleSiteSettingsSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  
                  <TextField
                    variant="filled"
                    value={siteName}
                    label="Site Name"
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter site name"
                    required
                    sx={{
                      "& .MuiInputBase-root": {
                        border: "1px solid #D5D9E2",
                        backgroundColor: "#fff",
                        borderRadius: "7px",
                      },
                      "& .MuiInputBase-root::before": { border: "none" },
                      "& .MuiInputBase-root:hover::before": { border: "none" },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <TextField
                    variant="filled"
                    label="Site Title"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    placeholder="Enter site title"
                    required
                    sx={{
                      "& .MuiInputBase-root": {
                        border: "1px solid #D5D9E2",
                        backgroundColor: "#fff",
                        borderRadius: "7px",
                      },
                      "& .MuiInputBase-root::before": { border: "none" },
                      "& .MuiInputBase-root:hover::before": { border: "none" },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <TextField
                    variant="filled"
                    label="Tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Enter tagline"
                    required
                    sx={{
                      "& .MuiInputBase-root": {
                        border: "1px solid #D5D9E2",
                        backgroundColor: "#fff",
                        borderRadius: "7px",
                      },
                      "& .MuiInputBase-root::before": { border: "none" },
                      "& .MuiInputBase-root:hover::before": { border: "none" },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <TextField
                    variant="filled"
                    label="Contact Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter contact email"
                    required
                    sx={{
                      "& .MuiInputBase-root": {
                        border: "1px solid #D5D9E2",
                        backgroundColor: "#fff",
                        borderRadius: "7px",
                      },
                      "& .MuiInputBase-root::before": { border: "none" },
                      "& .MuiInputBase-root:hover::before": { border: "none" },
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="filled">
                  <InputLabel id="currency-label">Currency</InputLabel>  
                  <Select
                    label="Currency"
                    labelId="currency-label"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        border: "1px solid #D5D9E2",
                        backgroundColor: "#fff",
                        borderRadius: "7px",
                      },
                    }}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="INR">INR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid container item xs={12}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                    <Typography
                        component="label"
                        sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                        }}
                        className="text-black"
                    >
                        Logo
                    </Typography>
                    <Button variant="outlined" component="label">
                        Upload Logo
                        <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoChange}
                        />
                    </Button>
                    {logoPreview && (
                        <Box mt={2}>
                        <img
                            src={logoPreview}
                            alt="Logo Preview"
                            style={{ maxWidth: "200px" }}
                        />
                        </Box>
                    )}
                    </FormControl>
                </Grid>
              </Grid>

              {siteSettingsError && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    {siteSettingsError}
                  </Alert>
                </Grid>
              )}
              {siteSettingsSuccess && (
                <Grid item xs={12}>
                  <Alert severity="success">
                    <AlertTitle>Success</AlertTitle>
                    {siteSettingsSuccess}
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "6px",
                    fontWeight: "500",
                    fontSize: "16px",
                    padding: "10px 24px",
                    color: "#fff !important",
                    boxShadow: "none",
                    width: "250px",
                  }}
                  disabled={siteSettingsLoading}
                >
                  {siteSettingsLoading ? <CircularProgress size={24} /> : "Save Site Settings"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>
      </TabPanel>

      {/* ===== Tab Panel 2: Roles ===== */}
      <TabPanel value={tabIndex} index={1}>
        <Card
          sx={{
            boxShadow: "none",
            borderRadius: "7px",
            mb: "25px",
            p: { xs: "18px", sm: "20px", lg: "25px" },
          }}
          className="rmui-card"
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {rolesError && (
                <Alert severity="error">
                  <AlertTitle>Error</AlertTitle>
                  {rolesError}
                </Alert>
              )}
              {rolesSuccess && (
                <Alert severity="success">
                  <AlertTitle>Success</AlertTitle>
                  {rolesSuccess}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <TextField
                  variant="filled"
                  label="New Role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Enter new role"
                  sx={{
                    "& .MuiInputBase-root": {
                      border: "1px solid #D5D9E2",
                      backgroundColor: "#fff",
                      borderRadius: "7px",
                    },
                    "& .MuiInputBase-root::before": { border: "none" },
                    "& .MuiInputBase-root:hover::before": { border: "none" },
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                <Button
                  variant="contained"
                  onClick={handleAddRole}
                  disabled={rolesLoading}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "6px",
                    fontWeight: "500",
                    fontSize: "16px",
                    padding: "10px 24px",
                    color: "#fff !important",
                    boxShadow: "none",
                    width: "150px",
                  }}
                >
                  {rolesLoading ? <CircularProgress size={24} /> : "Add Role"}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TableContainer
                component={Paper}
                sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}
              >
                <Table sx={{ minWidth: 650 }} aria-label="Roles Table">
                  <TableHead sx={{ backgroundColor: "#f6f7f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                        ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                        Role Name
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles
                      .slice(
                        rolesPage * rolesRowsPerPage,
                        rolesPage * rolesRowsPerPage + rolesRowsPerPage
                      )
                      .map((role: any) => (
                        <TableRow key={role.id}>
                          <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }} className="text-black">
                            {role.id}
                          </TableCell>
                          <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }} className="text-black">
                            {role.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    {rolesEmptyRows > 0 && (
                      <TableRow style={{ height: 53 * rolesEmptyRows }}>
                        <TableCell colSpan={2} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                          colSpan={2}
                          count={roles.length}
                          rowsPerPage={rolesRowsPerPage}
                          page={rolesPage}
                          onPageChange={handleRolesPageChange}
                          onRowsPerPageChange={handleRolesRowsPerPageChange}
                          ActionsComponent={TablePaginationActions}
                        />
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Card>
      </TabPanel>

      {/* ===== Tab Panel 3: Departments ===== */}
      <TabPanel value={tabIndex} index={2}>
        <Card
          sx={{
            boxShadow: "none",
            borderRadius: "7px",
            mb: "25px",
            p: { xs: "18px", sm: "20px", lg: "25px" },
          }}
          className="rmui-card"
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {departmentsError && (
                <Alert severity="error">
                  <AlertTitle>Error</AlertTitle>
                  {departmentsError}
                </Alert>
              )}
              {departmentsSuccess && (
                <Alert severity="success">
                  <AlertTitle>Success</AlertTitle>
                  {departmentsSuccess}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <TextField
                  variant="filled"
                  label="New Department"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Enter new department"
                  sx={{
                    "& .MuiInputBase-root": {
                      border: "1px solid #D5D9E2",
                      backgroundColor: "#fff",
                      borderRadius: "7px",
                    },
                    "& .MuiInputBase-root::before": { border: "none" },
                    "& .MuiInputBase-root:hover::before": { border: "none" },
                  }}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                <Button
                  variant="contained"
                  onClick={handleAddDepartment}
                  disabled={departmentsLoading}
                  sx={{
                    textTransform: "capitalize",
                    borderRadius: "6px",
                    fontWeight: "500",
                    fontSize: "16px",
                    padding: "10px 24px",
                    color: "#fff !important",
                    boxShadow: "none",
                    width: "200px",
                  }}
                >
                  {departmentsLoading ? <CircularProgress size={24} /> : "Add Department"}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TableContainer
                component={Paper}
                sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}
              >
                <Table sx={{ minWidth: 650 }} aria-label="Departments Table">
                  <TableHead sx={{ backgroundColor: "#f6f7f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                        ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                        Department Name
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departments
                      .slice(
                        departmentsPage * departmentsRowsPerPage,
                        departmentsPage * departmentsRowsPerPage + departmentsRowsPerPage
                      )
                      .map((dept: any) => (
                        <TableRow key={dept.id}>
                          <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }} className="text-black">
                            {dept.id}
                          </TableCell>
                          <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }} className="text-black">
                            {dept.name}
                          </TableCell>
                        </TableRow>
                      ))}
                    {departmentsEmptyRows > 0 && (
                      <TableRow style={{ height: 53 * departmentsEmptyRows }}>
                        <TableCell colSpan={2} />
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                          colSpan={2}
                          count={departments.length}
                          rowsPerPage={departmentsRowsPerPage}
                          page={departmentsPage}
                          onPageChange={handleDepartmentsPageChange}
                          onRowsPerPageChange={handleDepartmentsRowsPerPageChange}
                          ActionsComponent={TablePaginationActions}
                        />
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Card>
      </TabPanel>

      {/* ===== Tab Panel 4: Permissions ===== */}
      <TabPanel value={tabIndex} index={3}>
        <Card
          sx={{
            boxShadow: "none",
            borderRadius: "7px",
            mb: "25px",
            p: { xs: "18px", sm: "20px", lg: "25px" },
          }}
          className="rmui-card"
        >
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" mb={1}>
                            Add New Permission
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                <AlertTitle>Error</AlertTitle>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                <AlertTitle>Success</AlertTitle>
                                {success}
                            </Alert>
                        )}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                            label="Permission Name"
                            value={newPermission}
                            onChange={(e) => setNewPermission(e.target.value)}
                            fullWidth
                            variant="filled"
                            />
                            <Button variant="contained" onClick={handleAddPermission}>
                            Add
                            </Button>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={12}>
                 {/* In your Tab Panel 4 (Permissions) section, insert the following block where you want to display the permissions table: --- */}

                    <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Permissions List
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="Permissions Table">
                        <TableHead sx={{ backgroundColor: "#f6f7f9" }}>
                            <TableRow>
                            <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                                ID
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                                Permission Name
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500, padding: "10px 20px", fontSize: "14px" }} className="text-black">
                                Actions
                            </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {permissions.map((perm) => (
                            <TableRow key={perm.id}>
                                <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }} className="text-black">
                                {perm.id}
                                </TableCell>
                                <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }} className="text-black">
                                {perm.name}
                                </TableCell>
                                <TableCell sx={{ padding: "14px 20px", fontSize: "14px" }}>
                                <IconButton onClick={() => handleEditPermission(perm)} color="primary">
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton onClick={() => handleDeletePermission(perm.id)} color="error">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </TableContainer>
                    </Box>

                    {/* --- Add the Edit Permission Dialog --- */}
                    <Dialog open={dialogPermissionOpen} onClose={() => setDialogPermissionOpen(false)}>
                    <DialogTitle>Edit Permission</DialogTitle>
                    <DialogContent>
                        <TextField
                        label="Permission Name"
                        value={editPermissionName}
                        onChange={(e) => setEditPermissionName(e.target.value)}
                        fullWidth
                        variant="filled"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogPermissionOpen(false)}>Cancel</Button>
                        <Button onClick={handlePermissionDialogSave} variant="contained" color="primary">
                        Save
                        </Button>
                    </DialogActions>
                    </Dialog>
                </Grid>
            </Grid>
            
          <Box component="form" onSubmit={handlePermissionsSubmit} sx={{ mt: 4 }}>
            {/* {permissionsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Error</AlertTitle>
                {permissionsError}
              </Alert>
            )}
            {permissionsSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Success</AlertTitle>
                {permissionsSuccess}
              </Alert>
            )} */}
            <Grid container spacing={2}>
                <Grid item xs={12 }>
                    {/* <FormControl fullWidth variant="filled" sx={{ mb: 2 }}>
                        <InputLabel id="role-permission-label">Select Role</InputLabel>
                        <Select
                            labelId="role-permission-label"
                            value={selectedRoleForPermissions ? selectedRoleForPermissions.id : ""}
                            onChange={(e) => {
                            const roleId = e.target.value;
                            const role = availableRoles.find((r: any) => r.id === roleId);
                            setSelectedRoleForPermissions(role || null);
                            }}
                            label="Select Role"
                            sx={{
                            "& .MuiInputBase-root": {
                                border: "1px solid #D5D9E2",
                                backgroundColor: "#fff",
                                borderRadius: "7px",
                            },
                            }}
                        >
                            {availableRoles.map((role: any) => (
                            <MenuItem key={role.id} value={role.id}>
                                {role.name}
                            </MenuItem>
                            ))}
                        </Select>
                    </FormControl> */}
                    <Typography variant="h6" mb={1}>
                        Assign Permissions to Role
                    </Typography>
                    
                </Grid>
                <Grid item xs={12 } md={3}>
                    <Autocomplete
                            options={roles}
                            getOptionLabel={(option: Role) => option.name}
                            getOptionDisabled={(option: Role) => option.name === "SuperAdmin"}
                            value={selectedRole}
                            onChange={(event, newValue) => setSelectedRole(newValue)}
                            renderInput={(params) => (
                            <TextField {...params} label="Select Role" variant="filled" fullWidth />
                            )}
                            sx={{ mb: 2 }}
                    />
                    {/* <Autocomplete
                    multiple
                    id="permissions-select"
                    options={allPermissions}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option.name}
                    renderOption={(props, option, { selected }) => (
                        <li {...props}>
                        <Checkbox checked={selected} style={{ marginRight: 8 }} />
                        {option.name}
                        </li>
                    )}
                    value={selectedPermissions}
                    onChange={(event, newValue) => setSelectedPermissions(newValue)}
                    renderInput={(params) => (
                        <TextField
                        {...params}
                        label="Select Permissions"
                        placeholder="Choose permissions"
                        variant="filled"
                        sx={{
                            "& .MuiInputBase-root": {
                            border: "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                            },
                        }}
                        />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    sx={{ mb: 2 }}
                    /> */}
                </Grid>
                <Grid item xs={12 } md={3}>
                    <Autocomplete
                        multiple
                        options={permissions}
                        disableCloseOnSelect
                        getOptionLabel={(option: Permission) => option.name}
                        value={selectedPermissions}
                        onChange={(event, newValue) => setSelectedPermissions(newValue)}
                        renderOption={(props, option, { selected }) => (
                            <li {...props}>
                            <Checkbox checked={selected} style={{ marginRight: 8 }} />
                            {option.name}
                            </li>
                        )}
                        renderInput={(params) => (
                        <TextField {...params} label="Select Permissions" variant="filled" fullWidth />
                        )}
                        sx={{ mb: 2 }}
                    />
                    
                </Grid>    
                <Grid item xs={12 } md={3}>
                    {/* <Button variant="contained" onClick={handleAssignPermissions}>
                            Assign Permissions
                        </Button> */}
                    <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    onClick={handleAssignPermissions}
                    disabled={permissionsLoading}
                    sx={{
                        textTransform: "capitalize",
                        borderRadius: "6px",
                        fontWeight: "500",
                        fontSize: "16px",
                        padding: "10px 24px",
                        color: "#fff !important",
                        boxShadow: "none",
                        width: "100%",
                    }}
                    >
                    {permissionsLoading ? <CircularProgress size={24} /> : "Assign Permissions"}
                    </Button>
                </Grid>
            </Grid>
          </Box>
        </Card>
        <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
            <Card sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                Permissions Matrix
                </Typography>
                {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Error</AlertTitle>
                    {error}
                </Alert>
                )}
                {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    <AlertTitle>Success</AlertTitle>
                    {success}
                </Alert>
                )}
                <TableContainer>
                <Table>
                    <TableHead>
                    <TableRow>
                        <TableCell>Role</TableCell>
                        {permissions.map((perm) => (
                        <TableCell key={perm.id} align="center">
                            {perm.name}
                        </TableCell>
                        ))}
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role.id}>
                        <TableCell component="th" scope="row">
                            {role.name} {role.name === "SuperAdmin" && "(Unmodifiable)"}
                        </TableCell>
                        {permissions.map((perm) => (
                            <TableCell key={perm.id} align="center">
                            {/* <Checkbox
                                checked={role.permissions.includes(perm.name)}
                                onChange={(e) =>
                                handleCheckboxChange(role, perm.name, e.target.checked)
                                }
                            /> */}
                            {/* <Checkbox
                                checked={(role.permissions || []).includes(perm.name)}
                                onChange={(e) =>
                                    handleCheckboxChange(role, perm.name, e.target.checked)
                                }
                                /> */}
                                <Checkbox
                                    disabled={role.name === "SuperAdmin"}
                                    checked={
                                        (role.permissions || []).map((p: any) => p.name).includes(perm.name)
                                    }
                                    onChange={(e) =>
                                        handleCheckboxChange(role, perm.name, e.target.checked)
                                    }
                                    />
                            </TableCell>
                        ))}
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
                <Box sx={{ mt: 3, textAlign: "right" }}>
                <Button variant="contained" onClick={() => window.location.reload()}>
                    Refresh
                </Button>
                </Box>
            </Card>
            </Box>
      </TabPanel>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Box>
    </Box>
  );
};

export default SiteSettingsTabsPage;
