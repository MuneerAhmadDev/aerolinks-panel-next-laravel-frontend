import * as React from "react";
import NextLink from 'next/link';     
import SellersContent from "@/components/eCommerce/Sellers/SellersContent";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Sellers</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Sellers</li>
        </ul>
      </div>

      <SellersContent />
    </>
  );
}
