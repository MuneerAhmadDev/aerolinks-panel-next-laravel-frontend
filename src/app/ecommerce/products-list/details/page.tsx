import * as React from "react";
import NextLink from "next/link";
import ProductDetailsContent from "@/components/eCommerce/ProductDetails/ProductDetailsContent";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Product Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Products</li>
          <li>Product Details</li>
        </ul>
      </div>

      <ProductDetailsContent />
    </>
  );
}
