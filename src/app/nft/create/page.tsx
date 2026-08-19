import * as React from "react";
import NextLink from "next/link";  
import CreateNft from "@/components/NFT/CreateNft";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Create NFT</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>Create NFT</li>
        </ul>
      </div>  

      <CreateNft />
    </>
  );
}
