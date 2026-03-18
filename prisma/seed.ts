import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Course } from "../generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const COURSES = [
  { code: "CS101", name: "Introduction to Computer Science" },
  { code: "ENG201", name: "Academic Writing & Composition" },
  { code: "MATH301", name: "Linear Algebra" },
  { code: "PHY102", name: "Classical Mechanics" },
  { code: "BIO204", name: "Molecular Biology" },
];

const LECTURERS = [
  { name: "Dr. Ahmad Razif", email: "ahmad.razif@binus.edu" },
  { name: "Prof. Sarah Chen", email: "sarah.chen@binus.edu" },
  { name: "Dr. Michael Torres", email: "michael.torres@binus.edu" },
  { name: "Dr. Aisha Rahman", email: "aisha.rahman@binus.edu" },
  { name: "Prof. David Kim", email: "david.kim@binus.edu" },
];

const STUDENT_ID = "OMZqiFWIVIOdK4aSIHxGOXMyEUoIJuq1";

async function main() {
  console.log("Seeding lecturers...");
  const lecturers = await Promise.all(
    LECTURERS.map((l) =>
      prisma.user.upsert({
        where: { email: l.email },
        update: {},
        create: {
          name: l.name,
          email: l.email,
          emailVerified: true,
          role: "LECTURER",
        },
      })
    )
  );

  console.log("Seeding courses...");
  const courses: Course[] =  await Promise.all(
    COURSES.map((c, i) =>
      prisma.course.upsert({
        where: { code: c.code },
        update: {},
        create: {
          code: c.code,
          name: c.name,
          institution: "BINUS University International",
          lecturerId: lecturers[i].id,
        },
      })
    )
  );

  console.log("Enrolling student in all courses...");
  await Promise.all(
    courses.map((course) =>
      prisma.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: STUDENT_ID,
            courseId: course.id,
          },
        },
        update: {},
        create: {
          studentId: STUDENT_ID,
          courseId: course.id,
        },
      })
    )
  );

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());