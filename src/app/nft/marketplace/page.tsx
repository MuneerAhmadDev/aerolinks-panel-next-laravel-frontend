import * as React from "react";
import NextLink from "next/link";
import ManageYourNFT from "@/components/NFT/Marketplace/ManageYourNFT";
import FeaturedNFTArtworks from "@/components/NFT/Marketplace/FeaturedNFTArtworks";
import TopCreators from "@/components/NFT/Marketplace/TopCreators";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Marketplace</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>Marketplace</li>
        </ul>
      </div>

      <ManageYourNFT />

      <FeaturedNFTArtworks />

      <TopCreators />
    </>
  );
}
