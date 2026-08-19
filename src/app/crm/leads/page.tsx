import * as React from "react";
import Grid from "@mui/material/Grid";
import NextLink from 'next/link';     
import RevenueGrowth from "@/components/Dashboard/Crm/RevenueGrowth";
import LeadConversion from "@/components/Dashboard/Crm/LeadConversion";
import TotalOrders from "@/components/Dashboard/Crm/TotalOrders"; 
import AnnualProfit from "@/components/Dashboard/Crm/AnnualProfit"; 
import LeadsTable from "@/components/CRM/LeadsTable";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Leads</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>CRM</li>
          <li>Leads</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <RevenueGrowth />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <LeadConversion />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <TotalOrders />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <AnnualProfit />
        </Grid>
      </Grid>

      <LeadsTable />
    </>
  );
}
