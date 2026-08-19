import * as React from "react";
import NextLink from 'next/link';     
import Grid from "@mui/material/Grid";
import OrderTracking from "@/components/eCommerce/OrderTracking";
import OrderSummary from "@/components/eCommerce/OrderDetails/OrderSummary";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Order Tracking</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Order Tracking</li>
        </ul>
      </div>
    
      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={8}>
          <OrderTracking />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={4}>
          <OrderSummary />
        </Grid>
      </Grid>
    </>
  );
}
