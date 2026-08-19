import * as React from "react";
import NextLink from "next/link";
import Grid from "@mui/material/Grid";
import TotalBalance from "@/components/Finance/Wallet/TotalBalance";
import TotalIncome from "@/components/Finance/Wallet/TotalIncome";
import TotalExpenses from "@/components/Finance/Wallet/TotalExpenses";
import Static from "@/components/Dashboard/Finance/Static";
import TransactionHistory from "@/components/Dashboard/Finance/TransactionHistory";
import Cards from "@/components/Finance/Wallet/Cards";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Wallet</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>Finance</li>
          <li>Wallet</li>
        </ul>
      </div>

      <Grid
        container
        columnSpacing={{ xs: 1, sm: 2, md: 3, lg: 3 }}
        justifyContent="center"
      >
        <Grid item xs={12} md={12} lg={12} xl={4}>
          <Grid
            container
            columnSpacing={{ xs: 1, sm: 2, md: 3, lg: 3 }}
            justifyContent="center"
          >
            <Grid item xs={12} sm={6} md={4} lg={4} xl={12}>
              <TotalBalance />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={4} xl={12}>
              <TotalIncome />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={4} xl={12}>
              <TotalExpenses />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={8}>
          <Static />
        </Grid>
      </Grid>

      <Grid
        container
        columnSpacing={{ xs: 1, sm: 2, md: 3, lg: 3 }}
        justifyContent="center"
      >
        <Grid item xs={12} md={12} lg={12} xl={8}>
          <TransactionHistory />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={4}>
          <Cards />
        </Grid>
      </Grid>
    </>
  );
}
