import * as React from "react";
import NextLink from 'next/link';    
import RefundsTable from "@/components/eCommerce/Refunds/RefundsTable"; 

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Refunds</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Refunds</li>
        </ul>
      </div>

      <RefundsTable />
    </>
  );
}
