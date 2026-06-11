-- CreateTable
CREATE TABLE "BranchMember" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchMember_organizationId_idx" ON "BranchMember"("organizationId");

-- CreateIndex
CREATE INDEX "BranchMember_branchId_idx" ON "BranchMember"("branchId");

-- CreateIndex
CREATE INDEX "BranchMember_userId_idx" ON "BranchMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchMember_branchId_userId_key" ON "BranchMember"("branchId", "userId");

-- AddForeignKey
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMember" ADD CONSTRAINT "BranchMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
