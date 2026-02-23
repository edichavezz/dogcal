-- CreateTable
CREATE TABLE "MeetupRSVP" (
    "id" TEXT NOT NULL,
    "meetupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetupRSVP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetupRSVP_meetupId_idx" ON "MeetupRSVP"("meetupId");

-- CreateIndex
CREATE INDEX "MeetupRSVP_userId_idx" ON "MeetupRSVP"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetupRSVP_meetupId_userId_key" ON "MeetupRSVP"("meetupId", "userId");

-- AddForeignKey
ALTER TABLE "MeetupRSVP" ADD CONSTRAINT "MeetupRSVP_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "CommunityMeetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetupRSVP" ADD CONSTRAINT "MeetupRSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
