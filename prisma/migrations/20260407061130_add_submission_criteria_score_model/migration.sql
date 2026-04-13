-- CreateTable
CREATE TABLE "SubmissionCriterionScore" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "criterionName" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "pointsMax" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "SubmissionCriterionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmissionCriterionScore_submissionId_idx" ON "SubmissionCriterionScore"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionCriterionScore_submissionId_criterionName_key" ON "SubmissionCriterionScore"("submissionId", "criterionName");

-- AddForeignKey
ALTER TABLE "SubmissionCriterionScore" ADD CONSTRAINT "SubmissionCriterionScore_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
