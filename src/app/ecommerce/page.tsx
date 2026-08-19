import * as React from "react";
import NextLink from 'next/link';   
import ProductsGrid from "@/components/eCommerce/ProductsGrid";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Products Grid</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Products Grid</li>
        </ul>
      </div>

      {/* ProductsGrid */}
      <ProductsGrid />
    </>
  );
}
