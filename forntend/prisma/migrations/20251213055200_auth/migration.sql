/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerId,accountId]` on the table `account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "account_providerId_accountId_key";

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerId_accountId_key" ON "account"("provider", "providerId", "accountId");
