"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Checkbox,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "@/api/api";

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

interface Department {
  id: number;
  name: string;
}

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | "">("");
  const [newPermission, setNewPermission] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Permission | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchAll();
    }
  }, [selectedDepartment]);

  async function fetchDepartments() {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch departments" });
    }
  }

  async function fetchAll() {
    if (!selectedDepartment) return;
    try {
      const [perms, rolesRes] = await Promise.all([
        api.get(`/api/permissions?department_id=${selectedDepartment}`),
        api.get(`/api/roles?department_id=${selectedDepartment}`),
      ]);
      setPermissions(perms.data);
      setRoles(rolesRes.data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch data" });
    }
  }

  async function addPermission() {
    if (!newPermission.trim() || !selectedDepartment) return;
    setLoading(true);
    try {
      await api.post("/api/permissions", { name: newPermission, department_id: selectedDepartment });
      setNewPermission("");
      fetchAll();
      setMessage({ type: "success", text: "Permission added" });
    } catch {
      setMessage({ type: "error", text: "Failed to add permission" });
    } finally {
      setLoading(false);
    }
  }

  async function deletePermission(id: number) {
    try {
      await api.delete(`/api/permissions/${id}`);
      fetchAll();
      setMessage({ type: "success", text: "Deleted successfully" });
    } catch {
      setMessage({ type: "error", text: "Delete failed" });
    }
  }

  async function saveEdit() {
    if (!currentEdit) return;
    try {
      await api.put(`/api/permissions/${currentEdit.id}`, { name: editName });
      setEditDialogOpen(false);
      fetchAll();
      setMessage({ type: "success", text: "Updated successfully" });
    } catch {
      setMessage({ type: "error", text: "Update failed" });
    }
  }

  async function togglePermission(role: Role, permission: string, checked: boolean) {
    if (!selectedDepartment) return;
    let updated = checked
      ? [...role.permissions, permission]
      : role.permissions.filter((p) => p !== permission);
    try {
      await api.post(`/api/roles/${role.id}/permissions`, { permissions: updated, department_id: selectedDepartment });
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, permissions: updated } : r))
      );
    } catch {
      setMessage({ type: "error", text: "Failed to update role permissions" });
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Department</InputLabel>
        <Select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value as number)}
        >
          {departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              {dept.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedDepartment && (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              label="New Permission"
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={addPermission} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Add"}
            </Button>
          </Box>

          {message && (
            <Alert severity={message.type}>
              <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
              {message.text}
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Permissions
          </Typography>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell>{perm.id}</TableCell>
                    <TableCell>{perm.name}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => {
                          setCurrentEdit(perm);
                          setEditName(perm.name);
                          setEditDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deletePermission(perm.id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Permissions Matrix */}
          <Typography variant="h6" sx={{ mt: 5 }}>
            Assign Permissions to Roles
          </Typography>
          <Paper sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  {permissions.map((p) => (
                    <TableCell key={p.id} align="center">
                      {p.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    {permissions.map((p) => (
                      <TableCell key={p.id} align="center">
                        <Checkbox
                          checked={r.permissions.includes(p.name)}
                          onChange={(e) => togglePermission(r, p.name, e.target.checked)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogContent>
              <TextField
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={saveEdit}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
