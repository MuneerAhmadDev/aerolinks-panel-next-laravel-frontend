import * as React from "react";
import NextLink from 'next/link';     
import Courses from "@/components/LMS/Courses";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Courses List</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>LMS</li>
          <li>Courses List</li>
        </ul>
      </div>

      <Courses />
    </>
  );
}
