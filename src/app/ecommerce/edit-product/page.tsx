import * as React from "react";
import NextLink from 'next/link';    
import EditProduct from "@/components/eCommerce/EditProduct";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Edit Product</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Edit Product</li>
        </ul>
      </div>

      <EditProduct />
    </>
  );
}
