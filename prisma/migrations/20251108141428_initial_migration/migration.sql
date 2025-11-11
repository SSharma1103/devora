-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "pfp" TEXT,
    "banner" TEXT,
    "email" TEXT,
    "github" TEXT,
    "leetcode" TEXT,
    "googleId" TEXT,
    "githubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gitdata" (
    "id" SERIAL NOT NULL,
    "repos" INTEGER,
    "commits" INTEGER,
    "followers" INTEGER,
    "following" INTEGER,
    "stars" INTEGER,
    "userId" INTEGER,

    CONSTRAINT "Gitdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pdata" (
    "id" SERIAL NOT NULL,
    "about" TEXT,
    "devstats" TEXT,
    "stack" TEXT,
    "socials" JSONB,
    "userId" INTEGER,

    CONSTRAINT "Pdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkExp" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT,
    "description" TEXT,
    "companyName" TEXT,
    "image" TEXT,
    "userId" INTEGER,

    CONSTRAINT "WorkExp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "description" TEXT,
    "gitlink" TEXT,
    "userId" INTEGER,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Gitdata_userId_key" ON "Gitdata"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pdata_userId_key" ON "Pdata"("userId");

-- AddForeignKey
ALTER TABLE "Gitdata" ADD CONSTRAINT "Gitdata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdata" ADD CONSTRAINT "Pdata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkExp" ADD CONSTRAINT "WorkExp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
