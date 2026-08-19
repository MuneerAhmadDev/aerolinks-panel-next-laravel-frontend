import * as React from "react";
import NextLink from 'next/link';    
// import TeamMembers from "@/components/Users/TeamMembers";
import BookingReadOnlyPage from "@/components/Bookings/ViewBooking/BookingReadOnlyPage";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>View Booking</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Bookings</li>
          <li>View Booking</li>
        </ul>
      </div>

      <BookingReadOnlyPage />
    </>
  );
}
