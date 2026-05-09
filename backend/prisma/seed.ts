import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const TICKET_JWT_SECRET = process.env.TICKET_JWT_SECRET || 'ticket-secret-key-999';

function signTicketToken(ticketId: string, eventId: string): string {
  return jwt.sign({ ticketId, eventId }, TICKET_JWT_SECRET);
}

async function main() {
  console.log("Seeding database...");

  // Clean up existing data to prevent unique constraint errors
  await prisma.scanLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.eventStaff.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.otpCode.deleteMany();

  // Create Organizer
  const organizer = await prisma.organizer.create({
    data: {
      name: "Dawit Haile",
      phone: "+251911000001",
    },
  });
  console.log(`Created Organizer: ${organizer.name}`);

  // Create Event
  const eventDateTime = new Date();
  eventDateTime.setHours(eventDateTime.getHours() + 48); // 48 hours from now

  const event = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      title: "EPL Match Night — Arsenal vs Man City",
      venue: "Sky Lounge Hall, Bole",
      dateTime: eventDateTime,
      ticketPrice: 15000, // 150 ETB in santim
      maxCapacity: 200,
      status: "ACTIVE",
      paymentMethods: ["TELEBIRR"],
      slug: "epl-arsenal-man-city-01",
      ticketsSold: 2,
    },
  });
  console.log(`Created Event: ${event.title}`);

  // Create Staff
  const staff = await prisma.staff.create({
    data: {
      name: "Selam Tadesse",
      phone: "+251922000002",
      organizerId: organizer.id,
      assignments: {
        create: {
          eventId: event.id,
        },
      },
    },
  });
  console.log(`Created Staff: ${staff.name} assigned to event.`);

  // Create Two Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      eventId: event.id,
      buyerPhone: "+251933000003",
      buyerName: "Abebe Kebede",
      status: "ISSUED",
    },
  });
  // Update with QR Token
  await prisma.ticket.update({
    where: { id: ticket1.id },
    data: { qrToken: signTicketToken(ticket1.id, event.id) },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      eventId: event.id,
      buyerPhone: "+251944000004",
      buyerName: "Chala Lema",
      status: "ISSUED",
    },
  });
  // Update with QR Token
  await prisma.ticket.update({
    where: { id: ticket2.id },
    data: { qrToken: signTicketToken(ticket2.id, event.id) },
  });
  
  console.log(`Created 2 test tickets for the event.`);
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
