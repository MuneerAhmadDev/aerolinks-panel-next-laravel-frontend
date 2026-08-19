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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import { DataGrid, GridColDef, GridCellParams, GridRowId } from "@mui/x-data-grid";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import Link from "next/link"; // Added import for Link
import api from "@/api/api";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Swal from "sweetalert2";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface Role {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  departments: Department[];
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/users");
  
        if (response.data) {
          const formattedUsers = response.data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles,//.map((role: any) => role.name),
            departments: user.departments,//.map((dept: any) => dept.name),
          }));
  
          // Log the formatted data directly
          // Sort users based on 'id' or 'createdAt' (latest comes at the end)
            const sortedUsers: User[] = formattedUsers.sort((a: User, b: User) => {
            return a.id > b.id ? 1 : -1; // Sort by id in ascending order (latest comes at the end)
            });
          // Now set the users state
          setUsers(formattedUsers);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, []);
  useEffect(() => {
    const fetchRolesAndDepartments = async () => {
      try {
        const [rolesRes, departmentsRes] = await Promise.all([
          api.get("/api/roles"),
          api.get("/api/departments"),
        ]);
        setRoles(rolesRes.data);
        console.log(rolesRes.data);
        setDepartments(departmentsRes.data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
  
    fetchRolesAndDepartments();
  }, []); // Runs once on component mount to fetch roles and departments
  
  const handleDelete = async (userId: string) => {
    try {
      await api.delete(`/api/users/${userId}`);
      // Show SweetAlert success message
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'User deleted successfully.',
        confirmButtonText: 'OK',
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      // console.error("Error deleting user:", error);
      // Show SweetAlert error message
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete the user. Please try again.',
        confirmButtonText: 'OK'
      });  
    }
  };

  
  const handleEdit = (user: User) => {
    setCurrentUser({
      ...user,
      roles: user.roles || [],
      departments: user.departments || [],
    });
    // console.log(user.roles);
    // Update selected roles and departments with the user data
    setSelectedRoles(user.roles || []);
    setSelectedDepartments(user.departments || []);
  
    setDialogOpen(true);
    // Show SweetAlert success message
    Swal.fire({
      icon: 'success',
      title: 'Update!',
      text: 'User Updated successfully.',
      confirmButtonText: 'OK',
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentUser(null);
  };

  const handleDialogSave = async () => {
    if (currentUser) {
      const roleIds = selectedRoles.map((role)=> role.id);
      const departmentIds = selectedDepartments.map((department) => department.id);
      try {
        const response = await api.put(`/api/users/${currentUser.id}`, {
          name: currentUser.name,
          email: currentUser.email,
          roles: roleIds,
          departments: departmentIds
        });
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === currentUser.id ? currentUser : user
          )
        );

        setDialogOpen(false);
      } catch (error) {
        console.error("Error saving user:", error);
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  interface GridCellParams {
    map(arg0: (roles: any) => any): unknown;
    id: number | string;
    field: string;
    value: any;
    row: Record<string, any>; // Represents the entire row
    // Other properties...
  }
  const columns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr#",
      width: 80, // Width for the Sr# column
      renderCell: (params) => {
        const index = filteredUsers.findIndex((user) => user.id === params.row.id); // Find index based on the id
        return index + 1; // Serial number starts from 1
      },
    },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "roles",
      headerName: "Roles",
      flex: 1,
      valueGetter: (params: GridCellParams) => {
        if (!params) {
          return "No Data";
        }
        const roleNames = params.map((roles) => roles.name);
        return roleNames;
      },
    },
    {
      field: "departments",
      headerName: "Departments",
      flex: 1,
      valueGetter: (params: GridCellParams) =>{
        if (!params) {
          return "No Data";
        }
        const deptNames = params.map((dept) => dept.name);
        return deptNames;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          {/* Edit icon */}
          <IconButton
            aria-label="edit"
            color="secondary"
            onClick={() => handleEdit(params.row)} // Handle edit click
            style={{ cursor: "pointer", color: "blue" }} // Style icon
            sx={{ padding: "5px" }}
          >
            <i
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
            >
              edit
            </i>
          </IconButton>
          <IconButton
            aria-label="delete"
            color="error"
            onClick={() => handleDelete(params.row.id)} // Handle delete click
            style={{ cursor: "pointer", color: "red" }} // Style icon
            sx={{ padding: "5px" }}
          >
            <i
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
            >
              delete
            </i>
          </IconButton>
        </Box>
      ),
    },
  ];

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <>
      <Card 
      sx={{
        boxShadow: "none",
        borderRadius: "7px",
        mb: "25px",
        padding: { xs: "18px", sm: "20px", lg: "25px" },
      }}
      className="rmui-card"
      >


        <Box
            sx={{
              display: { xs: "block", sm: "flex" },
              alignItems: "center",
              justifyContent: "space-between",
              mb: "25px",
            }}
            >
            <Box
              component="form"
              className='t-search-form'
              sx={{
                width: "265px",
              }}
            >
              <label>
                <i className="material-symbols-outlined">search</i>
              </label>
              <input
                type="text"
                className='t-input'
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Box>

            <Link href="/users/add-user">
              <Button
                variant="outlined"
                sx={{
                  textTransform: "capitalize",
                  borderRadius: "7px",
                  fontWeight: "500",
                  fontSize: "13px",
                  padding: "6px 13px",
                }}
                color="primary"
              >
                <AddIcon sx={{ position: "relative", top: "-1px" }} /> Add New
                User
              </Button>
            </Link>
          </Box>



        <Box>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => row.id }
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </Box>
      </Card>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={currentUser?.name || ""}
            onChange={(e) =>
              setCurrentUser((prev) =>
                prev ? { ...prev, name: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            value={currentUser?.email || ""}
            onChange={(e) =>
              setCurrentUser((prev) =>
                prev ? { ...prev, email: e.target.value } : null
              )
            }
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            
            <Autocomplete
              multiple
              id="roles-select"
              options={roles}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name||""}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.name}
                  </li>
                );
              }}
              value={selectedRoles} // Bind to the selected roles
              onChange={(event, newValue) => {
                // console.log("Selected Roles:", newValue); // Debugging: log selected values
                setSelectedRoles(newValue); // Update state
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Roles"
                  placeholder="Choose roles"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id} // Compare based on the id
            />
          </FormControl>
          <FormControl fullWidth margin="dense">
            
            {/* Department Selection */}
            <Autocomplete
              multiple
              id="departments-select"
              options={departments}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.name}
                  </li>
                );
              }}
              value={selectedDepartments} // Bind to the selected departments
              onChange={(event, newValue) => setSelectedDepartments(newValue)} // Update selected departments
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Departments"
                  placeholder="Choose departments"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id} // Compare based on the id
            />
          </FormControl>
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

export default UsersList;
