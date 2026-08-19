import * as React from "react"; 
import NextLink from 'next/link';      
import DealsTable from "@/components/CRM/DealsTable";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Deals</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>CRM</li>
          <li>Deals</li>
        </ul>
      </div>
 
      <DealsTable />
    </>
  );
}
