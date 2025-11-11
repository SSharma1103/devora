-- AlterTable
ALTER TABLE "Gitdata" ADD COLUMN     "accountAge" INTEGER,
ADD COLUMN     "commitHistory" JSONB,
ADD COLUMN     "contributionsNotOwned" INTEGER,
ADD COLUMN     "contributionsThisYear" INTEGER,
ADD COLUMN     "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "privateRepos" INTEGER,
ADD COLUMN     "totalContributions" INTEGER;
