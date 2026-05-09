import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { fetchBackend } from "@/lib/apiClient";
import { LucideIcon, MapPin as MapPinIcon, Calendar as CalendarIcon, Users as UsersIcon, Info as InfoIcon } from "lucide-react";

export const revalidate = 30; // ISR cache revalidation every 30 seconds

export default async function EventPage({ params }: { params: { slug: string } }) {
  let event: any = null;
  try {
    event = await fetchBackend(`/events/public/${params.slug}`, { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    notFound();
  }

  const isSoldOut = event.ticketsSold >= event.maxCapacity || event.status === "SOLD_OUT";
  const isClosed = event.status === "CLOSED";
  const isCancelled = event.status === "CANCELLED";

  const availableSeats = Math.max(0, event.maxCapacity - event.ticketsSold);

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-24">
      {/* Header Image / Pattern Area */}
      <div className="h-64 bg-[#0F1A14] w-full relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A7A4A] to-transparent" />
        <h1 className="text-4xl md:text-5xl font-semibold text-white font-['Outfit'] z-10 px-6 text-center leading-tight">
          {event.title}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          {/* Status Banner */}
          {event.status !== "ACTIVE" && (
            <div
              className={`px-6 py-3 text-sm font-semibold tracking-wide text-center uppercase
                ${isClosed ? "bg-red-50 text-red-600" : ""}
                ${isCancelled ? "bg-red-100 text-red-700" : ""}
                ${event.status === "DRAFT" ? "bg-gray-100 text-gray-600" : ""}
                ${isSoldOut && event.status === "ACTIVE" ? "bg-orange-50 text-orange-600" : ""}
              `}
            >
              {EVENT_STATUS_LABELS[event.status]?.label || event.status}
              {isSoldOut && event.status === "ACTIVE" && "SOLD OUT"}
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {/* Price tag */}
            <div className="flex justify-between items-center pb-6 border-b border-[#E5E7EB]">
              <div>
                <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">Ticket Price</p>
                <p className="text-3xl font-semibold text-[#111827] font-['Outfit']">
                  {formatCurrency(event.ticketPrice, event.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">Status</p>
                <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-medium ${isSoldOut ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                  <span className={`w-2 h-2 rounded-full ${isSoldOut ? "bg-orange-500" : "bg-green-500"}`}></span>
                  <span>{isSoldOut ? "Sold Out" : "Tickets Available"}</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 text-[#1A7A4A] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">Date & Time</p>
                  <p className="text-[#6B7280] mt-0.5">{formatDateTime(event.dateTime)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-[#1A7A4A] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">Venue</p>
                  <p className="text-[#6B7280] mt-0.5">{event.venue}</p>
                  {event.venueMapUrl && (
                    <a href={event.venueMapUrl} target="_blank" rel="noreferrer" className="text-[#1A7A4A] text-sm hover:underline mt-1 inline-block">
                      View on Map
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:col-span-2">
                <InfoIcon className="w-5 h-5 text-[#1A7A4A] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">About Event</p>
                  <p className="text-[#6B7280] mt-0.5 whitespace-pre-wrap">{event.description || "No description provided."}</p>
                </div>
              </div>
            </div>

            {/* Availability Bar */}
            <div className="pt-6 border-t border-[#E5E7EB]">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[#111827] flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-[#6B7280]" />
                  Capacity
                </span>
                <span className="text-[#6B7280]">
                  {availableSeats} {availableSeats === 1 ? "seat" : "seats"} left
                </span>
              </div>
              <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className={`h-full ${isSoldOut ? "bg-orange-500" : "bg-[#1A7A4A]"}`}
                  style={{ width: `${Math.min(100, (event.ticketsSold / event.maxCapacity) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Organizer info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#6B7280]">
            Organized by <span className="font-medium text-[#111827]">{event.organizer?.name || "Organizer"}</span>
          </p>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E5E7EB] z-50">
        <div className="max-w-2xl mx-auto">
          {event.status === "ACTIVE" && !isSoldOut ? (
            <Link
              href={`/events/${event.slug}/buy`}
              className="block w-full py-4 rounded-xl font-semibold tracking-wide text-center bg-[#1A7A4A] text-white hover:bg-[#0F4D2E] transition-colors shadow-[0_4px_14px_0_rgba(26,122,74,0.39)]"
            >
              Buy Ticket
            </Link>
          ) : (
            <button
              disabled
              className="block w-full py-4 rounded-xl font-semibold tracking-wide text-center bg-gray-100 text-gray-500 cursor-not-allowed"
            >
              {isSoldOut ? "Sold Out" : "Sales Closed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
