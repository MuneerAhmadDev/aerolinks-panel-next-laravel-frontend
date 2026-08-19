import * as React from "react";
import NextLink from 'next/link';       
import Instructors from "@/components/LMS/Instructors";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Instructors</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>LMS</li>
          <li>Instructors</li>
        </ul>
      </div>

      <Instructors />
    </>
  );
}
