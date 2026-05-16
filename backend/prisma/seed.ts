import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing existing data...');
  // Delete in order to avoid FK constraints
  await prisma.scanLog.deleteMany({});
  await prisma.eventStaff.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.influencer.deleteMany({});
  await prisma.superAdmin.deleteMany({});

  console.log('🌱 Starting seeding...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. Create Super Admin
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: 'supermehal@mehal.com',
      password: hashedPassword,
      phone: '+251918982161',
      name: 'super_mehal',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.name);

  // 2. Create Influencer (formerly Organizer)
  const influencer = await prisma.influencer.create({
    data: {
      email: 'Influencer@mehal.com',
      password: hashedPassword,
      phone: '+251718280155',
      name: 'org_mehal',
      slug: 'org-mehal',
      bio: 'Football watch party host. Big events, bigger screens.',
      teamSupported: 'Arsenal',
      teamColor: '#EF0107',
      isActive: true,
    },
  });
  
  const ghost = await prisma.influencer.create({
    data: {
      email: 'ghost@gmail.com',
      password: hashedPassword,
      phone: '+251911223344',
      name: 'Ghost',
      slug: 'ghost-test',
      bio: 'Test Influencer for development flow.',
      teamSupported: 'Development FC',
      teamColor: '#111827',
      isActive: true,
    },
  });
  console.log('✅ Influencer created:', influencer.name, ghost.name);

  // 3. Create Staff
  const staff = await prisma.staff.create({
    data: {
      email: 'staff@mehal.com',
      password: hashedPassword,
      phone: '+251918982122',
      name: 'staff_mehal',
      organizerId: influencer.id,
    },
  });

  const abela = await prisma.staff.create({
    data: {
      email: 'abela@gmail.com',
      password: hashedPassword,
      phone: '+251955667788',
      name: 'Abela',
      organizerId: ghost.id,
    },
  });
  console.log('✅ Staff created:', staff.name, abela.name);

  // 4. Create a sample event
  const sampleEvent = await prisma.event.create({
    data: {
      organizerId: influencer.id,
      title: 'Arsenal vs Man City — Watch Party',
      description: 'Join us for the biggest match of the season! Big screen, great atmosphere.',
      venue: 'Capital Hotel Rooftop',
      city: 'Addis Ababa',
      dateTime: new Date('2026-05-25T18:00:00Z'),
      ticketPrice: 15000,
      currency: 'ETB',
      maxCapacity: 100,
      status: 'ACTIVE',
      slug: 'arsenal-vs-man-city-watch-party',
      homeTeam: 'Arsenal',
      awayTeam: 'Man City',
      competition: 'Premier League',
      matchKickoff: new Date('2026-05-25T19:00:00Z'),
      paymentInstructions: 'Send the exact amount to any of the accounts below, then upload your receipt screenshot.',
      paymentAccounts: [
        { type: 'Telebirr', number: '0911 234 567', name: 'Dawit Haile' },
        { type: 'CBE Birr', number: '1000 0123 456', name: 'Dawit Haile' },
        { type: 'Bank Transfer', number: 'CBE — 1000012345678', name: 'Dawit Haile' },
      ],
      expectedAmount: 150,
    },
  });
  console.log('✅ Sample event created:', sampleEvent.title);

  console.log('✨ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
