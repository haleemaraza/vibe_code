# MAJU Nexus — Student Portal Redesign

A frontend prototype that redesigns the Muhammad Ali Jinnah University (MAJU) student portal so it is cleaner, better organised and works well on a phone.

> **Unofficial student project.** Made for a vibe-coding competition. Not affiliated with or endorsed by MAJU. **Every student record in it is fictional demo data.**

**Team:** Zainab Arif & Adan Shifa
**Live link:** _[Vercel URL, once approved]_

---

## Audience and primary task

- **Audience:** MAJU undergraduate students.
- **Primary task:** open the portal and see, at a glance, *where I need to be today and whether I'm on track* (classes, attendance, fees, exams).
- **Primary action:** **View today's schedule** (the red button on the dashboard).
- **Main interaction:** the **Attendance planner**. Pick a course, drag the slider for how many classes you might miss, and it instantly shows your projected end-of-semester attendance. It turns green or red and tells you how many more classes you can miss and still stay above 75%.

## What's in it

| Section | What you can do |
|---|---|
| Dashboard | Greeting with the live "happening now / next class", CGPA and attendance rings, low-attendance alert, credits, fee due, next exam, a side-scrolling course carousel, today's timeline, latest announcements |
| My Courses | Filter theory and lab courses; open any course for its lecture-by-lecture attendance log, room, schedule and mid-term marks |
| Attendance | Planner (above) plus every course ranked lowest-first |
| Results & Exams | CGPA, credits, projected SGPA; semester tabs (live mid-terms, past transcripts); SGPA chart |
| Exam Datesheet | Live countdown to the next paper, venue and seat, **Add to calendar** (.ics download), upcoming/completed filter |
| Time Table | Swipeable day picker with Now/Done status, plus a full week grid |
| Fees & Invoices | Paid vs outstanding, fee breakdown bar, invoices, printable demo challan (no payments) |
| Announcements | Category filters, search, mark read/unread (unread badge updates everywhere) |
| Profile | Academic info, degree-progress ring, quick links |

Extras: dark/light theme (remembered), **Ctrl + K** or **/** search palette, toasts for feedback, a phone layout with bottom tab bar and slide-out menu, and animations that switch off when the system asks for reduced motion.

## Run it

No build step and no backend. Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

**Deploy on Vercel:** import the GitHub repo, choose Framework Preset **Other**, leave Build Command empty and set Output Directory to `.`.

Files: `index.html` (page shell and icons) · `styles.css` · `app.js` (rendering and interactions) · `data.js` (all fictional data in one place).

## AI tools and what we checked

- **AI assistance:** we used an AI coding assistant to help write and debug the code from our brief and photos of the current portal, then reviewed and tested the result in Chrome.
- **Automated checks (126, all passing):**
  - No sideways scrolling in any of the 9 sections at 320, 390, 768, 1024, 1366 and 1440 px.
  - Tables fit without scrolling at 1024 px and wider.
  - The planner maths gives the right answers (for example, 5 missed classes in Linear Algebra gives 65.6%, at risk).
  - Dialogs move focus in and give it back on Escape.
  - Search palette, tab arrow keys, mobile menu, theme persistence and the `.ics` file contents all work.
  - No JavaScript errors.
- **Problems found during review and fixed:**
  - Hamburger and close buttons showed on desktop (CSS order bug).
  - A hidden screen-reader label widened the Fees page by 6 px.
  - Course-card headers lost their full-bleed colour on phones.
  - White text on teal and yellow course cards was below 4.5:1 contrast. Labels now sit on a dark pill.
  - Red text was too dim in dark mode (about 2.6:1).
  - SGPA chart labels collided with the CGPA line.
  - The mid-term table was clipped on laptops.
- **Accessibility built in:**
  - Skip link and visible keyboard focus.
  - Every form control has a label.
  - `aria-live` feedback for the planner and toasts.
  - Text alternatives for the rings, bars and lecture log.
  - The fictional profile picture is an initials avatar with an `aria-label`, and the logo is an original "M" monogram, not the official crest. No photos are used.
- _Team: add anything you changed or tested by hand here, including your check of the live link in a fresh browser._

## Credits

- **Sample data:** fictional. All names, IDs, marks, fees and announcements were invented for this prototype. Course titles follow a typical BS Computer Science plan. No real student, staff or payment data is used.
- **Font:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) via Google Fonts (SIL Open Font License).
- **Icons:** inline SVG; most shapes are from [Feather Icons](https://feathericons.com) (MIT License).
- **Inspiration:** the layout and section list of the current MAJU student portal, redesigned from scratch.
