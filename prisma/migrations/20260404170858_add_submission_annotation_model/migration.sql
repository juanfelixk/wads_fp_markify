-- CreateEnum
CREATE TYPE "AnnotationType" AS ENUM ('PRAISE', 'SUGGESTION', 'ISSUE');

-- CreateEnum
CREATE TYPE "AnnotationSource" AS ENUM ('AI', 'LECTURER');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "aiGrammarFeedback" JSONB,
ADD COLUMN     "aiStructureFeedback" JSONB;

-- CreateTable
CREATE TABLE "SubmissionAnnotation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "content" TEXT NOT NULL,
    "type" "AnnotationType" NOT NULL,
    "quote" TEXT,
    "source" "AnnotationSource" NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionAnnotation_submissionId_idx" ON "SubmissionAnnotation"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionAnnotation" ADD CONSTRAINT "SubmissionAnnotation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
