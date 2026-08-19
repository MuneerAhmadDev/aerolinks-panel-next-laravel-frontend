import * as React from "react";
import NextLink from 'next/link';      
import Grid from "@mui/material/Grid";
import SellerOverview from "@/components/eCommerce/SellerDetails/SellerOverview";
import Seller from "@/components/eCommerce/SellerDetails/Seller";
import Revenue from "@/components/eCommerce/SellerDetails/Revenue";
import ProductsList from "@/components/eCommerce/ProductsList";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Seller Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Seller Details</li>
        </ul>
      </div>

      <SellerOverview />

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={3}>
          <Seller />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={9}>
          <Revenue />
        </Grid>
      </Grid>

      <ProductsList />
    </>
  );
}
