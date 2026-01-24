-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'FRIEND');

-- CreateEnum
CREATE TYPE "HangoutStatus" AS ENUM ('OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressText" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "careInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PupFriendship" (
    "id" TEXT NOT NULL,
    "pupId" TEXT NOT NULL,
    "friendUserId" TEXT NOT NULL,
    "historyWithPup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PupFriendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hangout" (
    "id" TEXT NOT NULL,
    "pupId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "HangoutStatus" NOT NULL DEFAULT 'OPEN',
    "assignedFriendUserId" TEXT,
    "createdByOwnerUserId" TEXT NOT NULL,
    "ownerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hangout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangoutNote" (
    "id" TEXT NOT NULL,
    "hangoutId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "noteText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangoutNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HangoutSuggestion" (
    "id" TEXT NOT NULL,
    "pupId" TEXT NOT NULL,
    "suggestedByFriendUserId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "friendComment" TEXT,
    "ownerComment" TEXT,
    "ownerDecisionByUserId" TEXT,
    "ownerDecisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HangoutSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PupFriendship_pupId_friendUserId_key" ON "PupFriendship"("pupId", "friendUserId");

-- AddForeignKey
ALTER TABLE "Pup" ADD CONSTRAINT "Pup_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupFriendship" ADD CONSTRAINT "PupFriendship_pupId_fkey" FOREIGN KEY ("pupId") REFERENCES "Pup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupFriendship" ADD CONSTRAINT "PupFriendship_friendUserId_fkey" FOREIGN KEY ("friendUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hangout" ADD CONSTRAINT "Hangout_pupId_fkey" FOREIGN KEY ("pupId") REFERENCES "Pup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hangout" ADD CONSTRAINT "Hangout_assignedFriendUserId_fkey" FOREIGN KEY ("assignedFriendUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hangout" ADD CONSTRAINT "Hangout_createdByOwnerUserId_fkey" FOREIGN KEY ("createdByOwnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutNote" ADD CONSTRAINT "HangoutNote_hangoutId_fkey" FOREIGN KEY ("hangoutId") REFERENCES "Hangout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutNote" ADD CONSTRAINT "HangoutNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutSuggestion" ADD CONSTRAINT "HangoutSuggestion_pupId_fkey" FOREIGN KEY ("pupId") REFERENCES "Pup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutSuggestion" ADD CONSTRAINT "HangoutSuggestion_suggestedByFriendUserId_fkey" FOREIGN KEY ("suggestedByFriendUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HangoutSuggestion" ADD CONSTRAINT "HangoutSuggestion_ownerDecisionByUserId_fkey" FOREIGN KEY ("ownerDecisionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
