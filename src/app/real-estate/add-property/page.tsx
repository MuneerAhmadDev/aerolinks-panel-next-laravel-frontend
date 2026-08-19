import * as React from "react";
import NextLink from 'next/link';   
import AddProperty from "@/components/RealEstate/AddProperty";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Add Property</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Real Estate</li>
          <li>Add Property</li>
        </ul>
      </div> 

      <AddProperty />
    </>
  );
}
