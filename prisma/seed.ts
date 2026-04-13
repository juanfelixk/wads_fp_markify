import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const INSTITUTION = "BINUS University International";
const ACADEMIC_YEAR = "2024/2025";
const CLASS_CODE = "L1CC";

const COURSES = [
  { code: "CS101",   name: "Introduction to Computer Science" },
  { code: "ENG201",  name: "Academic Writing & Composition"   },
  { code: "MATH301", name: "Linear Algebra"                   },
  { code: "PHY102",  name: "Classical Mechanics"              },
  { code: "BIO204",  name: "Molecular Biology"                },
];

const LECTURERS = [
  { name: "Dr. Ahmad Razif",    email: "ahmad.razif@binus.edu"    },
  { name: "Prof. Sarah Chen",   email: "sarah.chen@binus.edu"     },
  { name: "Dr. Michael Torres", email: "michael.torres@binus.edu" },
  { name: "Dr. Aisha Rahman",   email: "aisha.rahman@binus.edu"   },
  { name: "Prof. David Kim",    email: "david.kim@binus.edu"      },
];

const now = new Date();
const d = (offsetDays: number) => new Date(now.getTime() + offsetDays * 86_400_000);

const ASSIGNMENTS = (courseCode: string) => [
  {
    title: "Reflection Journal",
    instructions: `Submit a reflection journal related to ${courseCode}. Minimum 500 words.`,
    maxPoints: 100,
    startDate: d(-14),
    endDate: d(-7),
    lateAllowed: true,
  },
  {
    title: "Core Concepts",
    instructions: `Demonstrate understanding of core concepts in ${courseCode}. Include examples.`,
    maxPoints: 100,
    startDate: d(-5),
    endDate: d(-2),
    lateAllowed: false,
  },
  {
    title: "Final Project",
    instructions: `Final project for ${courseCode}. Present your findings with supporting evidence.`,
    maxPoints: 100,
    startDate: d(3),
    endDate: d(21),
    lateAllowed: false,
  },
];

async function main() {
  console.log("Seeding lecturers...");
  const lecturers = await Promise.all(
    LECTURERS.map((l) =>
      prisma.user.upsert({
        where: { email: l.email },
        update: { name: l.name },
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
  const courses = await Promise.all(
    COURSES.map((c) =>
      prisma.course.upsert({
        where: { code: c.code },
        update: { name: c.name, institution: INSTITUTION },
        create: {
          code: c.code,
          name: c.name,
          institution: INSTITUTION,
        },
      })
    )
  );

  console.log("Seeding classes...");
  const classes = await Promise.all(
    courses.map((course, i) =>
      prisma.class.upsert({
        where: {
          courseId_code_academicYear: {
            courseId: course.id,
            code: CLASS_CODE,
            academicYear: ACADEMIC_YEAR,
          },
        },
        update: {
          enrollmentKey: `${course.code.toLowerCase()}-${CLASS_CODE.toLowerCase()}-key`,
          lecturerId: lecturers[i].id,
        },
        create: {
          code: CLASS_CODE,
          academicYear: ACADEMIC_YEAR,
          enrollmentKey: `${course.code.toLowerCase()}-${CLASS_CODE.toLowerCase()}-key`,
          courseId: course.id,
          lecturerId: lecturers[i].id,
        },
      })
    )
  );

  console.log("Seeding assignments...");
  await Promise.all(
    classes.map(async (cls, i) => {
      await prisma.assignment.deleteMany({ where: { classId: cls.id } });
      await prisma.assignment.createMany({
        data: ASSIGNMENTS(COURSES[i].code).map((a) => ({
          ...a,
          classId: cls.id,
        })),
      });
    })
  );

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());