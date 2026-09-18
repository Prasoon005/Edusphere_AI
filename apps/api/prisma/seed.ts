/* eslint-disable no-console */
import { PrismaClient, Role, Gender, AttendanceStatus, ExamType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password@123";

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log("🌱 Seeding EduSphere AI database...");

  // ---------- Permissions ----------
  const permissionCodes = [
    "students.manage",
    "teachers.manage",
    "subjects.manage",
    "exams.manage",
    "reports.generate",
    "settings.manage",
    "attendance.mark",
    "marks.enter",
  ];
  await prisma.permission.createMany({
    data: permissionCodes.map((code) => ({ code, description: `Permission: ${code}` })),
    skipDuplicates: true,
  });

  // ---------- Academic Year & Semester ----------
  const academicYear = await prisma.academicYear.create({
    data: {
      name: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-05-31"),
      isCurrent: true,
    },
  });

  const semester1 = await prisma.semester.create({
    data: {
      name: "Semester 1",
      academicYearId: academicYear.id,
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-12-20"),
      isCurrent: true,
    },
  });

  // ---------- Super Admin ----------
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@edusphere.ai",
      passwordHash: await hash(DEFAULT_PASSWORD),
      role: Role.SUPER_ADMIN,
      emailVerified: true,
      superAdmin: { create: { fullName: "Alexandra Chen", phone: "+1-555-0100" } },
    },
  });
  console.log(`✔ Super Admin: ${adminUser.email}`);

  // ---------- Subjects ----------
  const subjectDefs = [
    { name: "Data Structures & Algorithms", code: "CS201" },
    { name: "Database Systems", code: "CS202" },
    { name: "Operating Systems", code: "CS203" },
    { name: "Computer Networks", code: "CS204" },
    { name: "Web Development", code: "CS205" },
  ];
  const subjects = await Promise.all(
    subjectDefs.map((s) => prisma.subject.create({ data: { ...s, credits: 4 } }))
  );

  // ---------- Classes & Sections ----------
  const classA = await prisma.class.create({
    data: { name: "B.Tech CSE — Year 2", academicYearId: academicYear.id },
  });

  await prisma.classSubject.createMany({
    data: subjects.map((s) => ({ classId: classA.id, subjectId: s.id })),
  });

  // ---------- Teachers ----------
  const teacherDefs = [
    { name: "Dr. Priya Sharma", email: "priya.sharma@edusphere.ai", dept: "Computer Science" },
    { name: "Mr. James Okafor", email: "james.okafor@edusphere.ai", dept: "Computer Science" },
    { name: "Dr. Elena Rossi", email: "elena.rossi@edusphere.ai", dept: "Computer Science" },
  ];

  const teachers = [];
  for (let i = 0; i < teacherDefs.length; i++) {
    const t = teacherDefs[i];
    const user = await prisma.user.create({
      data: {
        email: t.email,
        passwordHash: await hash(DEFAULT_PASSWORD),
        role: Role.TEACHER,
        emailVerified: true,
        teacher: {
          create: {
            employeeId: `EMP-${1000 + i}`,
            fullName: t.name,
            gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
            department: t.dept,
            designation: "Assistant Professor",
            joiningDate: new Date("2022-06-01"),
          },
        },
      },
      include: { teacher: true },
    });
    teachers.push(user.teacher!);
  }
  console.log(`✔ Created ${teachers.length} teachers`);

  await prisma.teacherSubject.createMany({
    data: subjects.map((s, idx) => ({
      teacherId: teachers[idx % teachers.length].id,
      subjectId: s.id,
    })),
  });

  const sectionA = await prisma.section.create({
    data: { name: "A", classId: classA.id, classTeacherId: teachers[0].id, capacity: 60 },
  });

  // ---------- Students ----------
  const studentNames = [
    "Aarav Patel", "Sofia Martinez", "Liam O'Connor", "Mei Lin", "Noah Kim",
    "Isabella Rossi", "Ethan Johnson", "Amara Okonkwo", "Yusuf Demir", "Chloe Dubois",
    "Arjun Mehta", "Grace Nakamura", "Lucas Silva", "Fatima Al-Sayed", "Oliver Bennett",
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const emailSlug = name.toLowerCase().replace(/[^a-z]+/g, ".");
    const user = await prisma.user.create({
      data: {
        email: `${emailSlug}@student.edusphere.ai`,
        passwordHash: await hash(DEFAULT_PASSWORD),
        role: Role.STUDENT,
        emailVerified: true,
        student: {
          create: {
            admissionNumber: `ADM-2025-${String(i + 1).padStart(4, "0")}`,
            rollNumber: String(i + 1).padStart(3, "0"),
            fullName: name,
            gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            dateOfBirth: new Date(2005, i % 12, (i % 27) + 1),
            classId: classA.id,
            sectionId: sectionA.id,
            guardianName: `Guardian of ${name}`,
            guardianPhone: `+1-555-02${String(i).padStart(2, "0")}`,
          },
        },
      },
      include: { student: true },
    });
    students.push(user.student!);
  }
  console.log(`✔ Created ${students.length} students`);

  // ---------- Timetable ----------
  const daySlots = [1, 2, 3, 4, 5]; // Mon-Fri
  for (let i = 0; i < daySlots.length; i++) {
    await prisma.timetableSlot.create({
      data: {
        sectionId: sectionA.id,
        subjectId: subjects[i % subjects.length].id,
        teacherId: teachers[i % teachers.length].id,
        dayOfWeek: daySlots[i],
        startTime: "09:00",
        endTime: "09:50",
        room: `Room ${101 + i}`,
      },
    });
  }

  // ---------- Attendance (last 20 school days, first subject) ----------
  const attendanceSubject = subjects[0];
  const today = new Date();
  for (let dayOffset = 20; dayOffset >= 1; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    for (const student of students) {
      const roll = Number(student.rollNumber);
      // Students with higher roll numbers get slightly worse attendance, for realistic analytics.
      const presentProbability = 0.95 - roll * 0.01;
      const status =
        Math.random() < presentProbability ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          subjectId: attendanceSubject.id,
          date,
          status,
          markedById: teachers[0].id,
        },
      });
    }
  }
  console.log("✔ Seeded attendance records");

  // ---------- Exams & Marks ----------
  for (const subject of subjects) {
    const exam = await prisma.exam.create({
      data: {
        name: `${subject.name} — Midterm`,
        type: ExamType.INTERNAL,
        subjectId: subject.id,
        semesterId: semester1.id,
        teacherId: teachers[0].id,
        maxMarks: 100,
        examDate: new Date("2025-10-15"),
      },
    });

    for (const student of students) {
      const base = 55 + Math.floor(Math.random() * 40);
      await prisma.mark.create({
        data: {
          studentId: student.id,
          examId: exam.id,
          subjectId: subject.id,
          semesterId: semester1.id,
          marksObtained: base,
          grade: base >= 90 ? "A+" : base >= 80 ? "A" : base >= 70 ? "B" : base >= 60 ? "C" : "D",
          enteredById: teachers[0].id,
        },
      });
    }
  }
  console.log("✔ Seeded exams and marks");

  // ---------- Assignment ----------
  const assignment = await prisma.assignment.create({
    data: {
      title: "Binary Search Tree Implementation",
      description: "Implement a self-balancing BST with insert, delete, and traversal operations.",
      subjectId: subjects[0].id,
      semesterId: semester1.id,
      teacherId: teachers[0].id,
      status: "PUBLISHED",
      maxMarks: 50,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.assignmentSubmission.createMany({
    data: students.slice(0, 8).map((s) => ({
      assignmentId: assignment.id,
      studentId: s.id,
      status: "SUBMITTED" as const,
      submittedAt: new Date(),
    })),
  });

  // ---------- Notice ----------
  await prisma.notice.create({
    data: {
      title: "Welcome to Semester 1, 2025-2026",
      content:
        "Classes begin August 1st. Please check your timetable and reach out to your class teacher with any questions.",
      audience: "ALL",
      authorId: adminUser.id,
    },
  });

  // ---------- Study Material ----------
  await prisma.studyMaterial.create({
    data: {
      title: "DSA — Week 1 Lecture Notes",
      description: "Introduction to arrays, linked lists, and Big-O notation.",
      subjectId: subjects[0].id,
      teacherId: teachers[0].id,
      fileUrl: "/uploads/materials/sample-week1-notes.pdf",
      fileType: "application/pdf",
      fileSizeKb: 842,
    },
  });

  // ---------- Permission grant (demonstrates the feature with real data) ----------
  const studentsManagePermission = await prisma.permission.findUnique({ where: { code: "students.manage" } });
  if (studentsManagePermission) {
    await prisma.userPermission.create({
      data: { userId: teachers[0].userId, permissionId: studentsManagePermission.id },
    });
  }

  // ---------- Query & Reply ----------
  const query = await prisma.query.create({
    data: {
      studentId: students[0].id,
      subjectId: subjects[0].id,
      title: "Clarification on the BST assignment",
      message: "Should the tree self-balance after every insertion, or only on rebalance() calls?",
      status: "IN_PROGRESS",
    },
  });
  await prisma.queryReply.create({
    data: {
      queryId: query.id,
      teacherId: teachers[0].id,
      message: "Great question — self-balance after every insertion, per the assignment brief.",
    },
  });

  // ---------- Feedback ----------
  await prisma.feedback.create({
    data: {
      senderId: teachers[0].userId,
      receiverId: students[0].userId,
      subject: "Strong start this semester",
      message: "Your BST implementation showed a solid grasp of recursive traversal. Keep it up!",
      rating: 5,
    },
  });

  console.log("\n✅ Seed complete.\n");
  console.log("Login credentials (all users share the same password):");
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
  console.log(`  Super Admin: ${adminUser.email}`);
  console.log(`  Teacher:     ${teacherDefs[0].email}`);
  console.log(`  Student:     aarav.patel@student.edusphere.ai\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
