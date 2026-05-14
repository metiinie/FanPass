import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import { fetchBackend } from "@/lib/apiClient";
import {
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  Users as UsersIcon,
  Info as InfoIcon,
  BadgeCheck,
  Trophy,
  Clock,
} from "lucide-react";

export const revalidate = 30;

export default async function EventPage({ params }: { params: { slug: string } }) {
  let event: any = null;
  try {
    event = await fetchBackend(`/events/public/${params.slug}`, { requireAuth: false });
  } catch (error) {
    notFound();
  }

  const isSoldOut = event.ticketsSold >= event.maxCapacity || event.status === "SOLD_OUT";
  const isClosed = event.status === "CLOSED";
  const isCancelled = event.status === "CANCELLED";
  const availableSeats = Math.max(0, event.maxCapacity - event.ticketsSold);
  const inf = event.influencer;

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-24">
      {/* Header Banner */}
      <div
        className="pt-16 pb-0 w-full relative overflow-hidden"
        style={{ backgroundColor: inf?.teamColor ? `${inf.teamColor}18` : "#0F1A14" }}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1A7A4A] to-transparent" />

        <div className="max-w-2xl mx-auto px-6 pt-10 pb-16 relative z-10 text-center">
          {/* Competition badge */}
          {event.competition && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold uppercase tracking-wider mb-4">
              <Trophy className="w-3 h-3" />
              {event.competition}
            </div>
          )}

          {/* Match title */}
          {event.homeTeam && event.awayTeam ? (
            <h1 className="text-4xl md:text-5xl font-bold text-white font-['Outfit'] mb-2">
              {event.homeTeam}
              <span className="text-white/40 mx-3 font-light">vs</span>
              {event.awayTeam}
            </h1>
          ) : (
            <h1 className="text-4xl font-bold text-white font-['Outfit'] mb-2">{event.title}</h1>
          )}

          {event.matchKickoff && (
            <p className="text-white/60 text-sm flex items-center justify-center gap-1.5 mt-2">
              <Clock className="w-4 h-4" />
              Kick-off: {formatDateTime(event.matchKickoff)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-20 space-y-4">
        {/* Influencer Card */}
        {inf && (
          <Link
            href={`/influencers/${inf.slug}`}
            className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-[#1A7A4A]/30 transition-colors"
          >
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden text-white font-bold text-lg border-2"
              style={{ backgroundColor: inf.teamColor || "#1A7A4A", borderColor: inf.teamColor || "#1A7A4A" }}
            >
              {inf.profilePhoto ? (
                <img src={inf.profilePhoto} alt={inf.name} className="w-full h-full object-cover" />
              ) : (
                inf.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                Hosted by
              </p>
              <p className="font-bold text-[#111827] flex items-center gap-1.5">
                {inf.name}
                {inf.isVerified && <BadgeCheck className="w-4 h-4 text-[#1A7A4A]" />}
              </p>
              {inf.teamSupported && (
                <p className="text-xs text-gray-400">{inf.teamSupported} Fan · Watch Party Host</p>
              )}
            </div>
            <span className="text-[#1A7A4A] text-sm font-semibold">Profile →</span>
          </Link>
        )}

        {/* Main event card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          {/* Status Banner */}
          {event.status !== "ACTIVE" && (
            <div
              className={`px-6 py-3 text-sm font-semibold tracking-wide text-center uppercase
                ${isClosed ? "bg-red-50 text-red-600" : ""}
                ${isCancelled ? "bg-red-100 text-red-700" : ""}
                ${event.status === "DRAFT" ? "bg-gray-100 text-gray-600" : ""}
              `}
            >
              {EVENT_STATUS_LABELS[event.status]?.label || event.status}
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {/* Price tag */}
            <div className="flex justify-between items-center pb-6 border-b border-[#E5E7EB]">
              <div>
                <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">
                  Ticket Price
                </p>
                <p className="text-3xl font-semibold text-[#111827] font-['Outfit']">
                  {formatCurrency(event.ticketPrice, event.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6B7280] font-medium uppercase tracking-wider mb-1">
                  Status
                </p>
                <div
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    isSoldOut
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isSoldOut ? "bg-orange-500" : "bg-green-500"}`}
                  />
                  <span>{isSoldOut ? "Sold Out" : "Available"}</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 text-[#1A7A4A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">Doors Open</p>
                  <p className="text-[#6B7280] mt-0.5">{formatDateTime(event.dateTime)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-[#1A7A4A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">Venue</p>
                  <p className="text-[#6B7280] mt-0.5">{event.venue}</p>
                  {event.city && (
                    <p className="text-sm text-gray-400">{event.city}</p>
                  )}
                  {event.venueMapUrl && (
                    <a
                      href={event.venueMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1A7A4A] text-sm hover:underline mt-1 inline-block"
                    >
                      View on Map
                    </a>
                  )}
                </div>
              </div>

              {event.description && (
                <div className="flex items-start space-x-3 sm:col-span-2">
                  <InfoIcon className="w-5 h-5 text-[#1A7A4A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#111827]">About</p>
                    <p className="text-[#6B7280] mt-0.5 whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}
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
                  style={{
                    width: `${Math.min(100, (event.ticketsSold / event.maxCapacity) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
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
