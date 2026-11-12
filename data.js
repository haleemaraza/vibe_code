/* =========================================================
   FICTIONAL DEMO DATA
   Every name, ID, mark, invoice and announcement below is
   invented for this prototype. None of it is a real student,
   staff member or university record.
   ========================================================= */
window.PORTAL_DATA = {
  policy: { minAttendance: 75, semesterStart: "2026-09-07", semesterWeeks: 18 },

  student: {
    name: "Zara Ahmed",
    id: "FA25-BSCS-0042",
    program: "BS Computer Science",
    faculty: "Faculty of Computing",
    semester: 3,
    section: "BSCS-3A",
    batch: "Fall 2025",
    email: "zara.ahmed@students.demo",
    phone: "+92 300 0000000",
    advisor: "Dr. Hamza Qureshi",
    totalCredits: 133,
    status: "Regular · Good Standing"
  },

  courses: [
    { code: "CS2110", title: "Data Structures & Algorithms", type: "Theory", credits: 3, instructor: "Dr. Saima Rauf", room: "C-204", held: 22, attended: 21, total: 32, hue: 214, marks: { quiz: 8.5, assign: 9, mid: 25 } },
    { code: "CS2111", title: "Data Structures Lab", type: "Lab", credits: 1, instructor: "Mr. Bilal Anwar", room: "Lab-3", held: 11, attended: 10, total: 16, hue: 196, marks: { quiz: 9, assign: 8.5, mid: 26 } },
    { code: "CS2130", title: "Database Systems", type: "Theory", credits: 3, instructor: "Dr. Faraz Ali", room: "C-108", held: 22, attended: 18, total: 32, hue: 262, marks: { quiz: 7, assign: 8, mid: 22 } },
    { code: "CS2131", title: "Database Systems Lab", type: "Lab", credits: 1, instructor: "Ms. Hira Javed", room: "Lab-5", held: 11, attended: 9, total: 16, hue: 280, marks: { quiz: 8, assign: 9, mid: 24 } },
    { code: "MT2120", title: "Linear Algebra", type: "Theory", credits: 3, instructor: "Dr. Usman Tariq", room: "C-301", held: 22, attended: 16, total: 32, hue: 4, marks: { quiz: 6, assign: 7.5, mid: 18 } },
    { code: "CS2150", title: "Digital Logic Design", type: "Theory", credits: 3, instructor: "Engr. Nida Sohail", room: "C-210", held: 22, attended: 20, total: 32, hue: 158, marks: { quiz: 8, assign: 9.5, mid: 24 } },
    { code: "SS2140", title: "Technical & Business Writing", type: "Theory", credits: 3, instructor: "Ms. Mehreen Asif", room: "B-12", held: 21, attended: 20, total: 32, hue: 34, marks: { quiz: 9, assign: 9, mid: 27 } }
  ],

  timetable: {
    Mon: [
      { code: "CS2110", start: "08:30", end: "09:50", room: "C-204" },
      { code: "MT2120", start: "10:00", end: "11:20", room: "C-301" },
      { code: "SS2140", start: "11:30", end: "12:50", room: "B-12" }
    ],
    Tue: [
      { code: "CS2130", start: "08:30", end: "09:50", room: "C-108" },
      { code: "CS2150", start: "10:00", end: "11:20", room: "C-210" },
      { code: "CS2111", start: "14:00", end: "16:50", room: "Lab-3" }
    ],
    Wed: [
      { code: "CS2110", start: "08:30", end: "09:50", room: "C-204" },
      { code: "MT2120", start: "10:00", end: "11:20", room: "C-301" },
      { code: "SS2140", start: "11:30", end: "12:50", room: "B-12" }
    ],
    Thu: [
      { code: "CS2130", start: "08:30", end: "09:50", room: "C-108" },
      { code: "CS2150", start: "10:00", end: "11:20", room: "C-210" },
      { code: "CS2131", start: "14:00", end: "16:50", room: "Lab-5" }
    ],
    Fri: [
      { code: "MT2120", start: "09:00", end: "10:20", room: "C-301" },
      { code: "CS2110", start: "10:30", end: "11:50", room: "C-204" }
    ]
  },

  results: [
    {
      term: "Fall 2025",
      courses: [
        { code: "CS1410", title: "Programming Fundamentals", credits: 3, grade: "A-" },
        { code: "CS1411", title: "Programming Fundamentals Lab", credits: 1, grade: "A" },
        { code: "CS1260", title: "Applications of ICT", credits: 2, grade: "B+" },
        { code: "CS1261", title: "Applications of ICT Lab", credits: 1, grade: "A" },
        { code: "MT1140", title: "Calculus & Analytical Geometry", credits: 3, grade: "B" },
        { code: "SS1160", title: "Functional English", credits: 3, grade: "A-" },
        { code: "SS1400", title: "Islamic Studies", credits: 2, grade: "A" }
      ]
    },
    {
      term: "Spring 2026",
      courses: [
        { code: "CS1510", title: "Object Oriented Programming", credits: 3, grade: "A" },
        { code: "CS1511", title: "OOP Lab", credits: 1, grade: "A" },
        { code: "CS1520", title: "Discrete Structures", credits: 3, grade: "B+" },
        { code: "PH1150", title: "Applied Physics", credits: 3, grade: "B+" },
        { code: "SS1170", title: "Communication & Presentation Skills", credits: 3, grade: "A-" },
        { code: "SS1410", title: "Pakistan Studies", credits: 2, grade: "A" }
      ]
    }
  ],

  exams: [
    { code: "CS2110", kind: "Final", date: "2027-01-11", start: "09:00", end: "12:00", venue: "Exam Hall A", seat: "A-117" },
    { code: "MT2120", kind: "Final", date: "2027-01-13", start: "09:00", end: "12:00", venue: "Exam Hall B", seat: "B-042" },
    { code: "CS2130", kind: "Final", date: "2027-01-15", start: "13:30", end: "16:30", venue: "Exam Hall A", seat: "A-117" },
    { code: "CS2150", kind: "Final", date: "2027-01-18", start: "09:00", end: "12:00", venue: "Exam Hall C", seat: "C-209" },
    { code: "SS2140", kind: "Final", date: "2027-01-20", start: "09:00", end: "12:00", venue: "Exam Hall B", seat: "B-042" },
    { code: "CS2111", kind: "Lab Final", date: "2027-01-06", start: "10:00", end: "12:00", venue: "Lab-3", seat: "PC-14" },
    { code: "CS2131", kind: "Lab Final", date: "2027-01-07", start: "10:00", end: "12:00", venue: "Lab-5", seat: "PC-08" },
    { code: "CS2110", kind: "Midterm", date: "2026-10-19", start: "09:00", end: "10:30", venue: "Exam Hall A", seat: "A-117" },
    { code: "MT2120", kind: "Midterm", date: "2026-10-20", start: "09:00", end: "10:30", venue: "Exam Hall B", seat: "B-042" },
    { code: "CS2130", kind: "Midterm", date: "2026-10-21", start: "11:00", end: "12:30", venue: "Exam Hall A", seat: "A-117" },
    { code: "CS2150", kind: "Midterm", date: "2026-10-22", start: "09:00", end: "10:30", venue: "Exam Hall C", seat: "C-209" },
    { code: "SS2140", kind: "Midterm", date: "2026-10-23", start: "09:00", end: "10:30", venue: "Exam Hall B", seat: "B-042" }
  ],

  fees: {
    breakdown: [
      { label: "Tuition", amount: 172000, color: "#1a3d6b" },
      { label: "Lab charges", amount: 12000, color: "#3f7fd9" },
      { label: "Examination", amount: 6000, color: "#b3261e" },
      { label: "Student activities", amount: 4000, color: "#f0b429" },
      { label: "Library", amount: 3000, color: "#0f8b7d" }
    ]
  },

  invoices: [
    { no: "INV-F26-0042-02", term: "Fall 2026", desc: "Semester fee · Installment 2 of 2", amount: 98500, due: "2026-11-30", status: "unpaid" },
    { no: "INV-F26-0042-01", term: "Fall 2026", desc: "Semester fee · Installment 1 of 2", amount: 98500, due: "2026-08-25", status: "paid", paidOn: "2026-08-20" },
    { no: "INV-S26-0042-02", term: "Spring 2026", desc: "Semester fee · Installment 2 of 2", amount: 94000, due: "2026-04-15", status: "paid", paidOn: "2026-04-09" },
    { no: "INV-S26-0042-01", term: "Spring 2026", desc: "Semester fee · Installment 1 of 2", amount: 94000, due: "2026-01-28", status: "paid", paidOn: "2026-01-26" },
    { no: "INV-F25-0042-01", term: "Fall 2025", desc: "Admission + semester fee", amount: 215000, due: "2025-08-30", status: "paid", paidOn: "2025-08-22" }
  ],

  announcements: [
    { id: 1, cat: "Exams", title: "Fall 2026 final exam datesheet published", body: "Final exams run 11–20 January 2027. Check your seat numbers on the Exam Datesheet page and report any clash to the examination office by 1 December.", date: "2026-11-10", unread: true, pinned: true },
    { id: 2, cat: "Finance", title: "Fee installment 2 due on 30 November", body: "Pay through any listed partner bank using your challan. A late fee applies after the due date. Students with an approved scholarship do not need to pay.", date: "2026-11-08", unread: true },
    { id: 3, cat: "Academic", title: "Attendance below 75% in Linear Algebra", body: "Your attendance in MT2120 is currently 72.7%. Students below 75% at the end of the semester may not be allowed to sit the final exam. Use the Attendance planner to stay on track.", date: "2026-11-06", unread: true },
    { id: 4, cat: "Events", title: "Code Sprint 2026 — registrations open", body: "A 24-hour campus hackathon on 5–6 December. Teams of 2–4. Register at the Computing Society desk in Block C.", date: "2026-11-05", unread: true },
    { id: 5, cat: "Academic", title: "Library opens until 10 PM during finals", body: "From 4 January the central library will stay open until 10 PM, Monday to Saturday.", date: "2026-11-03", unread: false },
    { id: 6, cat: "Events", title: "Convocation 2026 — student volunteers needed", body: "Volunteers get a certificate and priority seating. Sign-ups close on 20 November.", date: "2026-11-01", unread: false },
    { id: 7, cat: "Academic", title: "Course feedback forms are open", body: "Share anonymous feedback for each of your Fall 2026 courses. It takes about 5 minutes per course.", date: "2026-10-30", unread: false },
    { id: 8, cat: "Events", title: "Career fair: 25 companies on campus", body: "Bring printed CVs. Software, telecom, banking and consulting firms will be hiring interns.", date: "2026-10-25", unread: false }
  ]
};
