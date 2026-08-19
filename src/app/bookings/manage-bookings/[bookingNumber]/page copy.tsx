import * as React from "react";
import NextLink from 'next/link';     
// import ManageBookings from "@/components/Bookings/ManageBookings";
import BookingViewPage from "@/components/Bookings/ManageBookings/bookingNumber";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Manage Bookings</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Bookings</li>
          <li>Manage Booking</li>
        </ul>
      </div>

      <BookingViewPage />
    </>
  );
}
