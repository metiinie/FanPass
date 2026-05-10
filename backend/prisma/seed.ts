import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing existing data...');
  await prisma.staff.deleteMany({});
  await prisma.influencer.deleteMany({});
  await prisma.superAdmin.deleteMany({});
  await prisma.otpCode.deleteMany({});

  console.log('🌱 Starting seeding...');

  // 1. Create Super Admin
  const superAdmin = await prisma.superAdmin.create({
    data: {
      phone: '+251918982161',
      name: 'super_awol',
    },
  });
  console.log('✅ Super Admin created:', superAdmin.name);

  // 2. Create Influencer (formerly Organizer)
  const influencer = await prisma.influencer.create({
    data: {
      phone: '+251718280155',
      name: 'org_awol',
      slug: 'org-awol',
      bio: 'Football watch party host. Big events, bigger screens.',
      teamSupported: 'Arsenal',
      teamColor: '#EF0107',
      isActive: true,
    },
  });
  console.log('✅ Influencer created:', influencer.name);

  // 3. Create Staff
  const staff = await prisma.staff.create({
    data: {
      phone: '+251918982122',
      name: 'staff_awol',
      organizerId: influencer.id,
    },
  });
  console.log('✅ Staff created:', staff.name);

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
