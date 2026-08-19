import * as React from "react";
import NextLink from 'next/link';    
import Agents from "@/components/RealEstate/Agents";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Agents</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Real Estate</li>
          <li>Agents</li>
        </ul>
      </div> 

      <Agents />
    </>
  );
}
