-- AlterTable: Add missing User columns
ALTER TABLE "User" ADD COLUMN "profilePhotoUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "calendarColor" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "loginToken" TEXT;

-- AlterTable: Add missing Pup columns
ALTER TABLE "Pup" ADD COLUMN "profilePhotoUrl" TEXT;
ALTER TABLE "Pup" ADD COLUMN "breed" TEXT;

-- AlterTable: Add missing Hangout columns (series support)
ALTER TABLE "Hangout" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Hangout" ADD COLUMN "seriesIndex" INTEGER;

-- AlterTable: Add missing HangoutSuggestion columns
ALTER TABLE "HangoutSuggestion" ADD COLUMN "eventName" TEXT;
ALTER TABLE "HangoutSuggestion" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "HangoutSuggestion" ADD COLUMN "seriesIndex" INTEGER;

-- CreateIndex: User
CREATE UNIQUE INDEX "User_loginToken_key" ON "User"("loginToken");

-- CreateIndex: Pup
CREATE INDEX "Pup_ownerUserId_idx" ON "Pup"("ownerUserId");

-- CreateIndex: PupFriendship
CREATE INDEX "PupFriendship_pupId_idx" ON "PupFriendship"("pupId");
CREATE INDEX "PupFriendship_friendUserId_idx" ON "PupFriendship"("friendUserId");

-- CreateIndex: Hangout
CREATE INDEX "Hangout_pupId_idx" ON "Hangout"("pupId");
CREATE INDEX "Hangout_status_idx" ON "Hangout"("status");
CREATE INDEX "Hangout_assignedFriendUserId_idx" ON "Hangout"("assignedFriendUserId");
CREATE INDEX "Hangout_pupId_status_idx" ON "Hangout"("pupId", "status");
CREATE INDEX "Hangout_startAt_idx" ON "Hangout"("startAt");

-- CreateIndex: HangoutNote
CREATE INDEX "HangoutNote_hangoutId_idx" ON "HangoutNote"("hangoutId");

-- CreateIndex: HangoutSuggestion
CREATE INDEX "HangoutSuggestion_pupId_idx" ON "HangoutSuggestion"("pupId");
CREATE INDEX "HangoutSuggestion_status_idx" ON "HangoutSuggestion"("status");
CREATE INDEX "HangoutSuggestion_pupId_status_idx" ON "HangoutSuggestion"("pupId", "status");
