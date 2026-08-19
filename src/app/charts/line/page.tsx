import * as React from "react";
import NextLink from 'next/link';
import Grid from "@mui/material/Grid";
import BasicLineChart from "@/components/Charts/LineCharts/BasicLineChart";
import GradientLineChart from "@/components/Charts/LineCharts/GradientLineChart";
import SteplineLineChart from "@/components/Charts/LineCharts/SteplineLineChart";
import DashedLineChart from "@/components/Charts/LineCharts/DashedLineChart";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Line Charts</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Charts</li>
          <li>Line Charts</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={6}>
          <BasicLineChart />

          <GradientLineChart /> 
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={6}>
          <DashedLineChart />

          <SteplineLineChart />
        </Grid>
      </Grid>
    </>
  );
}
