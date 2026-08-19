import * as React from "react";
import NextLink from 'next/link';    
import CreateSeller from "@/components/eCommerce/Sellers/CreateSeller";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Create Seller</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Sellers</li>
          <li>Create Seller</li>
        </ul>
      </div>

      <CreateSeller />
    </>
  );
}
