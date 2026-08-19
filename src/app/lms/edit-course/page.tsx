import * as React from "react";
import NextLink from 'next/link';      
import EditCourse from "@/components/LMS/EditCourse";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Edit Course</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>LMS</li>
          <li>Create Course</li>
        </ul>
      </div>

      <EditCourse />
    </>
  );
}
