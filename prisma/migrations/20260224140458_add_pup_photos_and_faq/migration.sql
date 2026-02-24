-- AlterTable
ALTER TABLE "Pup" ADD COLUMN     "about" TEXT,
ADD COLUMN     "food" TEXT,
ADD COLUMN     "leash" TEXT,
ADD COLUMN     "play" TEXT,
ADD COLUMN     "socialising" TEXT,
ADD COLUMN     "treats" TEXT,
ADD COLUMN     "tricks" TEXT,
ADD COLUMN     "walks" TEXT;

-- CreateTable
CREATE TABLE "PupPhoto" (
    "id" TEXT NOT NULL,
    "pupId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PupPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PupPhoto_pupId_idx" ON "PupPhoto"("pupId");

-- AddForeignKey
ALTER TABLE "PupPhoto" ADD CONSTRAINT "PupPhoto_pupId_fkey" FOREIGN KEY ("pupId") REFERENCES "Pup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
