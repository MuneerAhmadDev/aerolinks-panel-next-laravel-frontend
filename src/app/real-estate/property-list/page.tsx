import * as React from "react";
import NextLink from 'next/link'; 
import PropertyList from "@/components/RealEstate/PropertyList";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Property List</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Real Estate</li>
          <li>Property List</li>
        </ul>
      </div>

      <PropertyList />
    </>
  );
}
