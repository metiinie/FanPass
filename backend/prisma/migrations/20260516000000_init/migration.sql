-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SALES_CLOSED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'ISSUED', 'SCANNED', 'EXPIRED', 'CANCELLED_PENDING_REFUND', 'REFUND_CONFIRMED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING_EXTRACTION', 'EXTRACTED_HIGH_CONFIDENCE', 'EXTRACTED_LOW_CONFIDENCE', 'MANUAL_REVIEW_REQUIRED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "bio" TEXT,
    "profilePhoto" TEXT,
    "teamSupported" TEXT,
    "teamColor" TEXT,
    "tiktokUrl" TEXT,
    "instagramUrl" TEXT,
    "telegramUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalTicketsSold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "venue" TEXT NOT NULL,
    "venueMapUrl" TEXT,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "maxCapacity" INTEGER NOT NULL,
    "ticketsSold" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "refundPolicy" TEXT,
    "organizerContact" TEXT,
    "refundStatus" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "homeTeam" TEXT,
    "awayTeam" TEXT,
    "competition" TEXT,
    "matchKickoff" TIMESTAMP(3),
    "coverImage" TEXT,
    "city" TEXT,
    "paymentInstructions" TEXT,
    "paymentAccounts" JSONB,
    "expectedAmount" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerName" TEXT,
    "qrToken" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedAt" TIMESTAMP(3),
    "ticketCount" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "screenshotUrl" TEXT,
    "screenshotUploadedAt" TIMESTAMP(3),
    "imageHash" TEXT,
    "extractedAmount" DOUBLE PRECISION,
    "extractedSenderName" TEXT,
    "extractedDate" TEXT,
    "extractedRef" TEXT,
    "aiConfidenceScore" DOUBLE PRECISION,
    "aiRawText" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_EXTRACTION',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "smsStatus" "SmsStatus",
    "smsRetryCount" INTEGER NOT NULL DEFAULT 0,
    "lastSmsAttempt" TIMESTAMP(3),
    "smsError" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStaff" (
    "eventId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "EventStaff_pkey" PRIMARY KEY ("eventId","staffId")
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "staffId" TEXT,
    "scannedById" TEXT NOT NULL,
    "scannedByRole" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" TEXT,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FanFollow" (
    "id" TEXT NOT NULL,
    "fanPhone" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FanFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_email_key" ON "Organizer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_phone_key" ON "Organizer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_slug_key" ON "Organizer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_phone_key" ON "SuperAdmin"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrToken_key" ON "Ticket"("qrToken");

-- CreateIndex
CREATE INDEX "ScanLog_eventId_scannedAt_idx" ON "ScanLog"("eventId", "scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FanFollow_fanPhone_influencerId_key" ON "FanFollow"("fanPhone", "influencerId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStaff" ADD CONSTRAINT "EventStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FanFollow" ADD CONSTRAINT "FanFollow_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
