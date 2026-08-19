import * as React from "react";
import NextLink from 'next/link';      
import Grid from "@mui/material/Grid";
import TransactionsHistory from "@/components/eCommerce/CustomerDetails/TransactionsHistory";
import CustomerId from "@/components/eCommerce/CustomerDetails/CustomerId";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Customer Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Customer Details</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={8} lg={8} xl={9}>
          <TransactionsHistory />
        </Grid>

        <Grid item xs={12} md={4} lg={4} xl={3}>
          <CustomerId />
        </Grid>
      </Grid>
    </>
  );
}
