import * as React from "react";
import NextLink from 'next/link';
import Grid from "@mui/material/Grid"; 
import BasicPieChart from "@/components/Charts/PieCharts/BasicPieChart";
import PieDonutChart from "@/components/Charts/PieCharts/PieDonutChart";
import PieMonochromeChart from "@/components/Charts/PieCharts/PieMonochromeChart";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Pie Charts</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Charts</li>
          <li>Pie Charts</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={6} lg={6} xl={4}>
          <BasicPieChart />
        </Grid>

        <Grid item xs={12} md={6} lg={6} xl={4}>
          <PieDonutChart />
        </Grid>

        <Grid item xs={12} md={6} lg={6} xl={4}>
          <PieMonochromeChart />
        </Grid>
      </Grid>
    </>
  );
}
