import * as React from "react";
import NextLink from "next/link";   
import DetailsContent from "@/components/NFT/Creators/DetailsContent";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Creator Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>Creator Details</li>
        </ul>
      </div>
      
      <DetailsContent />
    </>
  );
}
