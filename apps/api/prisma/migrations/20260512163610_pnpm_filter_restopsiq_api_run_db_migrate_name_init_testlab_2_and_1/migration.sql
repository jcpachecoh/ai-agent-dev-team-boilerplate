-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('ADMIN', 'LEAD', 'TESTER', 'READONLY');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('FUNCTIONAL', 'REGRESSION', 'SMOKE', 'EXPLORATORY', 'AUTOMATED', 'ACCEPTANCE');

-- CreateEnum
CREATE TYPE "CaseTemplate" AS ENUM ('STEPS', 'BDD', 'EXPLORATORY');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('UNTESTED', 'PASS', 'FAIL', 'BLOCKED', 'RETEST', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'TESTER',

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_suites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_suites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "suiteId" TEXT NOT NULL,

    CONSTRAINT "test_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preconditions" TEXT,
    "steps" JSONB,
    "expectedResult" TEXT,
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "type" "CaseType" NOT NULL DEFAULT 'FUNCTIONAL',
    "template" "CaseTemplate" NOT NULL DEFAULT 'STEPS',
    "sectionId" TEXT,
    "suiteId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plan_entries" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,

    CONSTRAINT "test_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planId" TEXT,
    "assignedToId" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "ResultStatus" NOT NULL DEFAULT 'UNTESTED',
    "comment" TEXT,
    "assignedToId" TEXT,
    "executedById" TEXT,
    "executedAt" TIMESTAMP(3),
    "elapsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "externalId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_cases" (
    "requirementId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "requirement_cases_pkey" PRIMARY KEY ("requirementId","caseId")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "test_plan_entries_planId_suiteId_key" ON "test_plan_entries"("planId", "suiteId");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_runId_caseId_key" ON "test_results"("runId", "caseId");

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_sections" ADD CONSTRAINT "test_sections_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "test_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_sections" ADD CONSTRAINT "test_sections_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "test_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_entries" ADD CONSTRAINT "test_plan_entries_planId_fkey" FOREIGN KEY ("planId") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_entries" ADD CONSTRAINT "test_plan_entries_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "test_suites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "test_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_cases" ADD CONSTRAINT "requirement_cases_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_cases" ADD CONSTRAINT "requirement_cases_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "test_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
