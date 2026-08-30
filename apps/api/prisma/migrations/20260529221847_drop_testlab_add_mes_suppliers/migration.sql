/*
  Warnings:

  - You are about to drop the `attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_milestones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jira_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `milestones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `requirement_cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `requirements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_plan_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_sections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_suites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_resultId_fkey";

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "case_milestones" DROP CONSTRAINT "case_milestones_caseId_fkey";

-- DropForeignKey
ALTER TABLE "case_milestones" DROP CONSTRAINT "case_milestones_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "jira_links" DROP CONSTRAINT "jira_links_projectId_fkey";

-- DropForeignKey
ALTER TABLE "milestones" DROP CONSTRAINT "milestones_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "requirement_cases" DROP CONSTRAINT "requirement_cases_caseId_fkey";

-- DropForeignKey
ALTER TABLE "requirement_cases" DROP CONSTRAINT "requirement_cases_requirementId_fkey";

-- DropForeignKey
ALTER TABLE "requirements" DROP CONSTRAINT "requirements_projectId_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_createdById_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_suiteId_fkey";

-- DropForeignKey
ALTER TABLE "test_plan_entries" DROP CONSTRAINT "test_plan_entries_planId_fkey";

-- DropForeignKey
ALTER TABLE "test_plan_entries" DROP CONSTRAINT "test_plan_entries_suiteId_fkey";

-- DropForeignKey
ALTER TABLE "test_plans" DROP CONSTRAINT "test_plans_createdById_fkey";

-- DropForeignKey
ALTER TABLE "test_plans" DROP CONSTRAINT "test_plans_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "test_plans" DROP CONSTRAINT "test_plans_projectId_fkey";

-- DropForeignKey
ALTER TABLE "test_results" DROP CONSTRAINT "test_results_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "test_results" DROP CONSTRAINT "test_results_caseId_fkey";

-- DropForeignKey
ALTER TABLE "test_results" DROP CONSTRAINT "test_results_executedById_fkey";

-- DropForeignKey
ALTER TABLE "test_results" DROP CONSTRAINT "test_results_runId_fkey";

-- DropForeignKey
ALTER TABLE "test_runs" DROP CONSTRAINT "test_runs_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "test_runs" DROP CONSTRAINT "test_runs_createdById_fkey";

-- DropForeignKey
ALTER TABLE "test_runs" DROP CONSTRAINT "test_runs_planId_fkey";

-- DropForeignKey
ALTER TABLE "test_sections" DROP CONSTRAINT "test_sections_parentId_fkey";

-- DropForeignKey
ALTER TABLE "test_sections" DROP CONSTRAINT "test_sections_suiteId_fkey";

-- DropForeignKey
ALTER TABLE "test_suites" DROP CONSTRAINT "test_suites_projectId_fkey";

-- DropTable
DROP TABLE "attachments";

-- DropTable
DROP TABLE "case_milestones";

-- DropTable
DROP TABLE "jira_links";

-- DropTable
DROP TABLE "milestones";

-- DropTable
DROP TABLE "project_members";

-- DropTable
DROP TABLE "projects";

-- DropTable
DROP TABLE "requirement_cases";

-- DropTable
DROP TABLE "requirements";

-- DropTable
DROP TABLE "test_cases";

-- DropTable
DROP TABLE "test_plan_entries";

-- DropTable
DROP TABLE "test_plans";

-- DropTable
DROP TABLE "test_results";

-- DropTable
DROP TABLE "test_runs";

-- DropTable
DROP TABLE "test_sections";

-- DropTable
DROP TABLE "test_suites";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "CasePriority";

-- DropEnum
DROP TYPE "CaseTemplate";

-- DropEnum
DROP TYPE "CaseType";

-- DropEnum
DROP TYPE "JiraEntityType";

-- DropEnum
DROP TYPE "ProjectRole";

-- DropEnum
DROP TYPE "ResultStatus";

-- DropEnum
DROP TYPE "RunStatus";
