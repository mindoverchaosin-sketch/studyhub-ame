CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');

CREATE TYPE "SuspensionType" AS ENUM ('TEMPORARY', 'INDEFINITE');

ALTER TABLE "User"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "lastAccountStatusUpdatedAt" TIMESTAMP(3),
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "suspensionEndsAt" TIMESTAMP(3),
ADD COLUMN "suspensionReason" TEXT,
ADD COLUMN "suspensionType" "SuspensionType",
ADD COLUMN "terminationReason" TEXT;