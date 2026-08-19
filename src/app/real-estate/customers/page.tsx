import * as React from "react";
import NextLink from 'next/link';    
import Customers from "@/components/RealEstate/Customers";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Customers</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Real Estate</li>
          <li>Customers</li>
        </ul>
      </div> 

      <Customers />
    </>
  );
}
