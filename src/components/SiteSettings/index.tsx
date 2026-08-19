"use client";
import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import SiteSettingsTab from "./SiteSettingsTab";
import RolesTab from "./RolesTab";
import DepartmentsTab from "./DepartmentsTab";
import RolePermissionsManager from "./RolePermissionsManager";

export default function SettingsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ mt: 4 }}>
      <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
        <Tab label="Site Settings" />
        <Tab label="Roles" />
        <Tab label="Departments" />
        <Tab label="Permission Matrix" />
      </Tabs>

      {tab === 0 && <SiteSettingsTab />}
      {tab === 1 && <RolesTab />}
      {tab === 2 && <DepartmentsTab />}
      {tab === 3 && <RolePermissionsManager />}
    </Box>
  );
}
