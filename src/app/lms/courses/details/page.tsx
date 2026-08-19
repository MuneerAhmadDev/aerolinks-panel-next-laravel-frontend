import * as React from "react";
import Grid from "@mui/material/Grid";
import NextLink from 'next/link';      
import Courses from "@/components/LMS/CoursesDetails/Course";
import TablesOfContent from "@/components/LMS/CoursesDetails/TablesOfContent";
import CourseInstructor from "@/components/LMS/CoursesDetails/CourseInstructor";
import EnrolledStudents from "@/components/LMS/CoursesDetails/EnrolledStudents";
import Reviews from "@/components/LMS/CoursesDetails/Reviews";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Course Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>LMS</li>
          <li>Courses</li>
          <li>Course Details</li>
        </ul>
      </div>

      <Courses />

      <TablesOfContent />

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={7}>
          <CourseInstructor />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={5}>
          <EnrolledStudents />
        </Grid>
      </Grid>

      <Reviews />
    </>
  );
}
