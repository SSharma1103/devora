-- AlterTable
ALTER TABLE "Gitdata" ADD COLUMN     "codeReviews" INTEGER,
ADD COLUMN     "languages" JSONB,
ADD COLUMN     "osContributions" JSONB,
ADD COLUMN     "pullRequests" INTEGER,
ADD COLUMN     "topRepos" JSONB;
