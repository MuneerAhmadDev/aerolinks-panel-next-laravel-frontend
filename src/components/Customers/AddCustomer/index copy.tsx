"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  Autocomplete,
  IconButton,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import api from "@/api/api";

type SupplierType = {
  id: number;
  name: string;
};

const AddSupplier = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [existingSuppliers, setExistingSuppliers] = useState<any[]>([]);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
  const [selectedType, setSelectedType] = useState<number | "">("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [serviceData, setServiceData] = useState<{ [key: string]: any }[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSupplierTypes = async () => {
      try {
        const response = await api.get("/api/supplier-types/");
        setSupplierTypes(response.data);
      } catch (error) {
        console.error("Error fetching supplier types:", error);
      }
    };
    fetchSupplierTypes();
  }, []);

  useEffect(() => {
    const searchSuppliers = async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await api.get(`/api/suppliers?search=${searchQuery}`);
          // In searchSuppliers()
          const validSuppliers = response.data.filter((supplier: any) => 
            supplierTypes.some(t => t.id === supplier.supplier_type_id)
          );
          setExistingSuppliers(validSuppliers);
          // setExistingSuppliers(response.data);
        } catch (error) {
          console.error("Error searching suppliers:", error);
        }
      }
    };
    const debounceSearch = setTimeout(() => searchSuppliers(), 300);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    const updatedServices = serviceData.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    );
    setServiceData(updatedServices);
  };

  const addServiceEntry = () => {
    setServiceData([...serviceData, {}]);
  };

  const removeServiceEntry = (index: number) => {
    const newServices = serviceData.filter((_, i) => i !== index);
    setServiceData(newServices);
  };

  const renderServiceFields = () => {
    if (!selectedType) return null;
    const typeName = supplierTypes.find(t => t.id === selectedType)?.name.toLowerCase();

    return serviceData.map((service, index) => {
      const serviceFields = () => {
        switch (typeName) {
          case "transport":
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Type"
                    value={service.vehicle_type || ""}
                    onChange={(e) => handleServiceChange(index, 'vehicle_type', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Capacity"
                    type="number"
                    value={service.capacity || ""}
                    onChange={(e) => handleServiceChange(index, 'capacity', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cost"
                    type="number"
                    value={service.cost || ""}
                    onChange={(e) => handleServiceChange(index, 'cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Internal Cost"
                    type="number"
                    value={service.internal_cost || ""}
                    onChange={(e) => handleServiceChange(index, 'internal_cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amenities"
                    value={service.amenities || ""}
                    onChange={(e) => handleServiceChange(index, 'amenities', e.target.value)}
                  />
                </Grid>
              </Grid>
            );

          case "hotel":
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hotel Name"
                    value={service.name || ""}
                    onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Star Rating"
                    type="number"
                    inputProps={{ min: 1, max: 7 }}
                    value={service.star_rating || ""}
                    onChange={(e) => handleServiceChange(index, 'star_rating', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Meal Type"
                    value={service.meal_type || ""}
                    onChange={(e) => handleServiceChange(index, 'meal_type', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Room Type"
                    value={service.room_type || ""}
                    onChange={(e) => handleServiceChange(index, 'room_type', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Base Price"
                    type="number"
                    value={service.base_price || ""}
                    onChange={(e) => handleServiceChange(index, 'base_price', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Internal Cost"
                    type="number"
                    value={service.internal_cost || ""}
                    onChange={(e) => handleServiceChange(index, 'internal_cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facilities"
                    multiline
                    rows={3}
                    value={service.facilities || ""}
                    onChange={(e) => handleServiceChange(index, 'facilities', e.target.value)}
                  />
                </Grid>
              </Grid>
            );

          case "visa":
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Visa Type"
                    value={service.visa_type || ""}
                    onChange={(e) => handleServiceChange(index, 'visa_type', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nationality Requirements"
                    value={service.nationality_requirements || ""}
                    onChange={(e) => handleServiceChange(index, 'nationality_requirements', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Processing Days"
                    type="number"
                    value={service.processing_days || ""}
                    onChange={(e) => handleServiceChange(index, 'processing_days', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cost"
                    type="number"
                    value={service.cost || ""}
                    onChange={(e) => handleServiceChange(index, 'cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Internal Cost"
                    type="number"
                    value={service.internal_cost || ""}
                    onChange={(e) => handleServiceChange(index, 'internal_cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Requirements"
                    value={service.requirements || ""}
                    onChange={(e) => handleServiceChange(index, 'requirements', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Group Supported</InputLabel>
                    <Select
                      value={service.is_group_supported ? "true" : "false"}
                      onChange={(e) => handleServiceChange(index, 'is_group_supported', e.target.value === "true")}
                      label="Group Supported"
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            );

          case "sightseeing":
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tour Name"
                    value={service.tour_name || ""}
                    onChange={(e) => handleServiceChange(index, 'tour_name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Itinerary"
                    multiline
                    rows={4}
                    value={service.itinerary || ""}
                    onChange={(e) => handleServiceChange(index, 'itinerary', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cost"
                    type="number"
                    value={service.cost || ""}
                    onChange={(e) => handleServiceChange(index, 'cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Internal Cost"
                    type="number"
                    value={service.internal_cost || ""}
                    onChange={(e) => handleServiceChange(index, 'internal_cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Adult Price"
                    type="number"
                    value={service.adult_price || ""}
                    onChange={(e) => handleServiceChange(index, 'adult_price', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Child Price"
                    type="number"
                    value={service.child_price || ""}
                    onChange={(e) => handleServiceChange(index, 'child_price', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Guide Included</InputLabel>
                    <Select
                      value={service.guide_included ? "true" : "false"}
                      onChange={(e) => handleServiceChange(index, 'guide_included', e.target.value === "true")}
                      label="Guide Included"
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            );

          case "flight":
            return (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Airline"
                    value={service.airline || ""}
                    onChange={(e) => handleServiceChange(index, 'airline', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Class"
                    value={service.class || ""}
                    onChange={(e) => handleServiceChange(index, 'class', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Route"
                    value={service.route || ""}
                    onChange={(e) => handleServiceChange(index, 'route', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cost"
                    type="number"
                    value={service.cost || ""}
                    onChange={(e) => handleServiceChange(index, 'cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Internal Cost"
                    type="number"
                    value={service.internal_cost || ""}
                    onChange={(e) => handleServiceChange(index, 'internal_cost', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Taxes"
                    type="number"
                    value={service.taxes || ""}
                    onChange={(e) => handleServiceChange(index, 'taxes', e.target.value)}
                  />
                </Grid>
              </Grid>
            );

          default:
            return null;
        }
      };

      return (
        <Card key={index} sx={{ p: 3, mt: 2, position: 'relative' }}>
          {index > 0 && (
            <IconButton 
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => removeServiceEntry(index)}
            >
              <RemoveCircleOutline color="error" />
            </IconButton>
          )}
          <Typography variant="h6" gutterBottom>
            Service #{index + 1}
          </Typography>
          {serviceFields()}
        </Card>
      );
    });
  };

  const renderSupplierSelection = () => (
    <Grid item xs={12}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Supplier Selection</Typography>
        <Autocomplete
          freeSolo
          options={existingSuppliers}
          getOptionLabel={(option) => 
            typeof option === 'string' ? option : option.name
          }
          inputValue={searchQuery}
          onInputChange={(_, newValue) => setSearchQuery(newValue)}
          onChange={(_, newValue) => {
            if (newValue && typeof newValue !== 'string') {
              // Verify supplier type exists in current list
              const validType = supplierTypes.some(t => t.id === newValue.supplier_type_id);
              
              if (!validType) {
                setErrors({ submit: 'This supplier has an invalid type' });
                return;
              }
              setEditingSupplierId(newValue.id);
              setFormData({
                name: newValue.name,
                email: newValue.email,
                phone: newValue.phone,
                address: newValue.address
              });
              setSelectedType(newValue.supplier_type_id);
              setServiceData(newValue.services || []);
            } else {
              setEditingSupplierId(null);
              setFormData({ name: "", email: "", phone: "", address: "" });
              setServiceData([]);
              setSelectedType("");
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search existing suppliers or add new"
              variant="outlined"
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option.id}>
              <Box>
                <Typography>{option.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {option.supplier_type?.name} • {option.email}
                </Typography>
              </Box>
            </MenuItem>
          )}
        />
      </Card>
    </Grid>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const payload = {
        ...formData,
        supplier_type_id: selectedType,
        services: serviceData
      };

      let response;
      if (editingSupplierId) {
        response = await api.put(`/api/suppliers/${editingSupplierId}`, payload);
      } else {
        response = await api.post("/api/suppliers", payload);
      }
      
      if (response.data.success) {
        setSuccess(`Supplier ${editingSupplierId ? 'updated' : 'created'} successfully!`);
        if (!editingSupplierId) {
          setFormData({ name: "", email: "", phone: "", address: "" });
          setServiceData([]);
          setSelectedType("");
        }
        setExistingSuppliers([]);
        setSearchQuery("");
      }
    } catch (error: any) {
      const errorData = error.response?.data?.errors || {};
      setErrors(errorData);
      console.error("Submission error:", error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, margin: 'auto' }}>
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {editingSupplierId ? "Edit Supplier" : "Add New Supplier"}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {renderSupplierSelection()}

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Supplier Type *</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as number)}
                label="Supplier Type *"
              >
                {supplierTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && <Typography color="error" variant="body2">{errors.type}</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Supplier Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleSupplierChange}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleSupplierChange}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone *"
                    name="phone"
                    value={formData.phone}
                    onChange={handleSupplierChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address *"
                    name="address"
                    value={formData.address}
                    onChange={handleSupplierChange}
                    error={!!errors.address}
                    helperText={errors.address}
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12}>
            {renderServiceFields()}
            {selectedType && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutline />}
                  onClick={addServiceEntry}
                >
                  Add Service
                </Button>
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              {errors.submit && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.submit}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFormData({ name: "", email: "", phone: "", address: "" });
                    setSelectedType("");
                    setServiceData([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ minWidth: 120 }}
                >
                  {editingSupplierId ? "Update" : "Save"} Supplier
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default AddSupplier;