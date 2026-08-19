import * as React from "react";
import NextLink from "next/link";  
import NftDetails from "@/components/NFT/NftDetails";
export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>NFT Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>NFT Details</li>
        </ul>
      </div>

      <NftDetails />
    </>
  );
}
