-- CreateEnum
CREATE TYPE "HangoutResponseStatus" AS ENUM ('YES', 'NO');

-- CreateTable
CREATE TABLE "HangoutResponse" (
    "id" TEXT NOT NULL,
    "hangoutId" TEXT NOT NULL,
    "responderUserId" TEXT NOT NULL,
    "status" "HangoutResponseStatus" NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangoutResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMeetup" (
    "id" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMeetup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HangoutResponse_hangoutId_idx" ON "HangoutResponse"("hangoutId");

-- CreateIndex
CREATE INDEX "HangoutResponse_responderUserId_idx" ON "HangoutResponse"("responderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "HangoutResponse_hangoutId_responderUserId_key" ON "HangoutResponse"("hangoutId", "responderUserId");

-- CreateIndex
CREATE INDEX "CommunityMeetup_startAt_idx" ON "CommunityMeetup"("startAt");

-- AddForeignKey
ALTER TABLE "HangoutResponse" ADD CONSTRAINT "HangoutResponse_hangoutId_fkey" FOREIGN KEY ("hangoutId") REFERENCES "Hangout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutResponse" ADD CONSTRAINT "HangoutResponse_responderUserId_fkey" FOREIGN KEY ("responderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
