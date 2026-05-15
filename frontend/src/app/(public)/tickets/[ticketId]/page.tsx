import { notFound } from "next/navigation";
import { fetchBackend } from "@/lib/apiClient";
import TicketClient from "./TicketClient";

import { TicketDisplay } from "@/types";

export const revalidate = 0; // Disable caching for ticket pages to ensure live status

export default async function TicketPage({ params }: { params: { ticketId: string } }) {
  let ticket: TicketDisplay;
  try {
    ticket = await fetchBackend(`/tickets/${params.ticketId}`, { requireAuth: false });
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    notFound();
  }

  return <TicketClient initialTicket={ticket} />;
}
