import * as React from "react";
import NextLink from 'next/link';      
import AddAgent from "@/components/RealEstate/AddAgent";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Add Agent</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Real Estate</li>
          <li>Agents</li>
          <li>Add Agent</li>
        </ul>
      </div> 

      <AddAgent />
    </>
  );
}
