import * as React from "react";
import NextLink from 'next/link';      
import CreateCourse from "@/components/LMS/CreateCourse";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Create Course</h5>

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

      <CreateCourse />
    </>
  );
}
