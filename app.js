/* MAJU Nexus — redesign prototype. Vanilla JS, no build step. */
(() => {
  'use strict';

  const D = window.PORTAL_DATA;
  const MIN = D.policy.minAttendance;

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n, cls = 'i') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const NOW = new Date();
  const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const daysUntil = (s) => Math.round((parseDate(s) - TODAY) / 864e5);
  const fmtDate = (s, withYear = false) => { const d = parseDate(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`; };
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const nowMin = NOW.getHours() * 60 + NOW.getMinutes();
  const money = (n) => 'PKR ' + n.toLocaleString('en-US');
  const relDays = (n) => n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday' : n > 0 ? `in ${n} days` : `${-n} days ago`;

  const courseBy = (code) => D.courses.find((c) => c.code === code);
  const pct = (c) => (c.held ? (c.attended / c.held) * 100 : 100);
  const fmtPct = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%';
  const attStatus = (p) => p >= 85 ? { cls: 'ok', label: 'On track' } : p >= MIN ? { cls: 'warn', label: 'Watch' } : { cls: 'bad', label: `Below ${MIN}%` };
  const barColor = (p) => p >= 85 ? 'var(--ok)' : p >= MIN ? 'var(--warn)' : 'var(--bad)';

  const GP = { 'A': 4, 'A-': 3.67, 'B+': 3.33, 'B': 3, 'B-': 2.67, 'C+': 2.33, 'C': 2, 'D': 1, 'F': 0 };
  const gpaOf = (list) => { const cr = list.reduce((a, c) => a + c.credits, 0); return cr ? list.reduce((a, c) => a + c.credits * GP[c.grade], 0) / cr : 0; };
  const allPast = D.results.flatMap((t) => t.courses);
  const CGPA = gpaOf(allPast);
  const EARNED = allPast.reduce((a, c) => a + c.credits, 0);
  const SEM_CREDITS = D.courses.reduce((a, c) => a + c.credits, 0);
  const AVG_ATT = D.courses.reduce((a, c) => a + c.attended, 0) / D.courses.reduce((a, c) => a + c.held, 0) * 100;
  const midTotal = (c) => c.marks.quiz + c.marks.assign + c.marks.mid; // out of 50
  const estGrade = (score50) => { const p = score50 / 50 * 100; return p >= 85 ? 'A' : p >= 80 ? 'A-' : p >= 75 ? 'B+' : p >= 70 ? 'B' : p >= 65 ? 'B-' : p >= 60 ? 'C+' : 'C'; };
  const PROJ_SGPA = gpaOf(D.courses.map((c) => ({ credits: c.credits, grade: estGrade(midTotal(c)) })));

  const weekNo = Math.min(D.policy.semesterWeeks, Math.max(1, Math.floor((TODAY - parseDate(D.policy.semesterStart)) / (7 * 864e5)) + 1));
  const todayKey = DAY_KEYS[NOW.getDay()];
  const isWeekday = WEEK.includes(todayKey);

  function slotStatus(slot, isToday) {
    if (!isToday) return 'upcoming';
    if (nowMin >= toMin(slot.end)) return 'done';
    if (nowMin >= toMin(slot.start)) return 'live';
    return 'upcoming';
  }

  function nextClass() {
    for (let off = 0; off < 8; off++) {
      const d = new Date(TODAY); d.setDate(d.getDate() + off);
      const key = DAY_KEYS[d.getDay()];
      const slots = D.timetable[key] || [];
      const cand = off === 0 ? slots.filter((s) => toMin(s.end) > nowMin) : slots;
      if (cand.length) return { slot: cand[0], key, off, live: off === 0 && toMin(cand[0].start) <= nowMin };
    }
    return null;
  }

  function upcomingExams() {
    return D.exams.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => parseDate(a.date) - parseDate(b.date) || toMin(a.start) - toMin(b.start));
  }

  /* ---------------- toasts ---------------- */
  function toast(msg, ic = 'check') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
  }

  /* ---------------- shared fragments ---------------- */
  function ring(frac, display, label, color, countTo, dec) {
    const r = 42, C = 2 * Math.PI * r;
    return `<div class="ring" role="img" aria-label="${esc(label)}: ${esc(display)}">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="${r}"/>
      <circle class="ring-fg" cx="50" cy="50" r="${r}" stroke-dasharray="${C.toFixed(2)}" style="--c:${C.toFixed(2)}px;--off:${(C * (1 - Math.min(1, frac))).toFixed(2)}px;--ring:${color}"/></svg>
      <div class="ring-label" aria-hidden="true"><strong data-count="${countTo}" data-dec="${dec}" data-suffix="${display.endsWith('%') ? '%' : ''}">${esc(display)}</strong><span>${esc(label)}</span></div>
    </div>`;
  }

  function courseCard(c) {
    const p = pct(c), st = attStatus(p);
    return `<article class="card course-card" style="--hue:${c.hue}">
      <div class="cc-band"><span class="cc-code">${c.code}</span><span class="cc-type">${c.type} · ${c.credits} cr</span></div>
      <div class="cc-body">
        <h3 class="cc-title"><button type="button" data-course="${c.code}" aria-label="${esc(c.title)} — open course details">${esc(c.title)}</button></h3>
        <p class="cc-teacher">${esc(c.instructor)} · Room ${esc(c.room)}</p>
        <div class="meter" aria-hidden="true"><span style="--v:${p.toFixed(1)}%;--bar:${barColor(p)}"></span><i class="mark"></i></div>
        <div class="cc-foot"><span>Attendance <strong>${fmtPct(p)}</strong></span><span class="tag tag-${st.cls}">${st.label}</span></div>
      </div>
    </article>`;
  }

  function timeline(slots, isToday) {
    if (!slots.length) return `<div class="empty"><strong>No classes</strong>Enjoy the free day — or catch up on assignments.</div>`;
    return `<ol class="timeline">${slots.map((s) => {
      const c = courseBy(s.code), st = slotStatus(s, isToday);
      const tag = st === 'live' ? '<span class="tag tag-live">Now</span>' : st === 'done' ? `<span class="tag">${icon('check', 'i i-sm')}Done</span>` : `<span class="tag tag-info">${s.code.endsWith('1') && c.type === 'Lab' ? 'Lab' : 'Lecture'}</span>`;
      return `<li class="tl-item is-${st}" style="--hue:${c.hue}">
        <div class="tl-time"><strong>${s.start}</strong><span>${s.end}</span></div>
        <div><p class="tl-title">${esc(c.title)}</p><p class="tl-meta">${icon('pin')}${esc(s.room)} · ${esc(c.instructor)}</p></div>
        ${tag}
      </li>`;
    }).join('')}</ol>`;
  }

  const CAT_ICON = { Exams: 'calendar', Finance: 'card', Academic: 'book', Events: 'megaphone' };
  function annItem(a, compact) {
    return `<article class="ann ${a.unread ? 'unread' : ''} ${compact ? 'ann-compact' : ''}">
      <div class="ann-icon cat-${a.cat}">${icon(CAT_ICON[a.cat])}</div>
      <div>
        <p class="ann-top">${a.unread ? '<span class="unread-dot" aria-hidden="true"></span><span class="sr-only">Unread.</span>' : ''}<span>${a.cat}</span><span aria-hidden="true">·</span><time datetime="${a.date}">${fmtDate(a.date)}</time>${a.pinned ? '<span class="tag tag-bad">Pinned</span>' : ''}</p>
        <h3 class="ann-title">${esc(a.title)}</h3>
        <p class="ann-body">${esc(a.body)}</p>
        <div class="ann-actions">
          <button class="btn btn-outline btn-sm" type="button" data-read="${a.id}" aria-pressed="${!a.unread}">${icon('check')}${a.unread ? 'Mark as read' : 'Mark as unread'}</button>
          ${a.cat === 'Exams' ? '<a class="btn btn-outline btn-sm" href="#datesheet">Open datesheet</a>' : ''}
          ${a.cat === 'Finance' ? '<a class="btn btn-outline btn-sm" href="#fees">View invoice</a>' : ''}
          ${/Attendance/.test(a.title) ? '<button class="btn btn-outline btn-sm" type="button" data-plan="MT2120">Open planner</button>' : ''}
        </div>
      </div>
    </article>`;
  }

  /* ---------------- announcements state ---------------- */
  const readState = store.get('maju-read') || {};
  D.announcements.forEach((a) => { if (a.id in readState) a.unread = !readState[a.id]; });
  const unreadCount = () => D.announcements.filter((a) => a.unread).length;
  function syncBadges(bump) {
    const n = unreadCount();
    $$('[data-unread-badge]').forEach((el) => { el.textContent = n ? String(n) : ''; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } });
    $('#bell').setAttribute('aria-label', n ? `Announcements, ${n} unread` : 'Announcements, all read');
  }

  /* =================================================
     VIEWS
     ================================================= */
  function renderDashboard() {
    const s = D.student, first = s.name.split(' ')[0];
    const h = NOW.getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const nc = nextClass();
    const todaySlots = isWeekday ? D.timetable[todayKey] : [];
    const left = todaySlots.filter((x) => toMin(x.end) > nowMin).length;
    let summary;
    if (nc && nc.live) summary = `Happening now: <strong>${esc(courseBy(nc.slot.code).title)}</strong> in ${nc.slot.room}, until ${nc.slot.end}.`;
    else if (nc && nc.off === 0) summary = `You have <strong>${left} class${left > 1 ? 'es' : ''}</strong> left today. Next up: <strong>${esc(courseBy(nc.slot.code).title)}</strong> at ${nc.slot.start} in ${nc.slot.room}.`;
    else if (nc) summary = `No more classes today. Next: <strong>${esc(courseBy(nc.slot.code).title)}</strong> on ${DAY_NAMES[DAY_KEYS.indexOf(nc.key)]} at ${nc.slot.start}.`;
    else summary = 'No classes scheduled.';

    const low = D.courses.filter((c) => pct(c) < MIN);
    const inv = D.invoices.find((i) => i.status === 'unpaid');
    const exam = upcomingExams()[0];
    const tlKey = isWeekday ? todayKey : (nc ? nc.key : 'Mon');
    const tlSlots = D.timetable[tlKey] || [];
    const dateLine = `${DAY_NAMES[NOW.getDay()]}, ${NOW.getDate()} ${MONTHS[NOW.getMonth()]} ${NOW.getFullYear()}`;

    $('#view-dashboard').innerHTML = `
      <div class="hero">
        <span class="blob blob-1" aria-hidden="true"></span><span class="blob blob-2" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">${dateLine} · Fall&nbsp;2026 · Week&nbsp;${weekNo}</p>
          <h1 class="view-title" tabindex="-1">${greet}, ${esc(first)}.</h1>
          <p class="hero-sub">${summary}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#timetable">${icon('clock')}View today's schedule</a>
            <a class="btn btn-glass" href="#attendance">${icon('check-square')}Plan my attendance</a>
          </div>
        </div>
        <div class="hero-rings">
          ${ring(CGPA / 4, CGPA.toFixed(2), 'CGPA', 'var(--gold)', CGPA.toFixed(2), 2)}
          ${ring(AVG_ATT / 100, fmtPct(AVG_ATT), 'Attendance', '#5ede97', AVG_ATT.toFixed(1), 1)}
        </div>
      </div>

      ${low.map((c) => `
        <div class="alert reveal" role="note">
          <span class="alert-icon">${icon('alert')}</span>
          <p class="alert-text"><strong>${esc(c.title)} attendance is ${fmtPct(pct(c))}</strong><span>Below the ${MIN}% minimum. Find out how many classes you can still miss.</span></p>
          <button class="btn btn-primary btn-sm" type="button" data-plan="${c.code}">Plan it ${icon('arrow')}</button>
        </div>`).join('')}

      <div class="stats">
        <a class="card stat reveal" href="#results">
          <div class="stat-top"><span>Credits earned</span><span class="stat-icon">${icon('award')}</span></div>
          <p class="stat-value"><span data-count="${EARNED}">${EARNED}</span> <small>/ ${s.totalCredits}</small></p>
          <div class="meter" aria-hidden="true"><span style="--v:${(EARNED / s.totalCredits * 100).toFixed(1)}%;--bar:var(--accent)"></span></div>
          <p class="stat-foot">${Math.round(EARNED / s.totalCredits * 100)}% of degree complete</p>
        </a>
        <a class="card stat reveal" href="#courses">
          <div class="stat-top"><span>This semester</span><span class="stat-icon">${icon('book')}</span></div>
          <p class="stat-value"><span data-count="${SEM_CREDITS}">${SEM_CREDITS}</span> <small>credits</small></p>
          <p class="stat-foot">${D.courses.length} courses in progress · Semester ${s.semester}</p>
        </a>
        <a class="card stat reveal" href="#fees">
          <div class="stat-top"><span>Fee due</span><span class="stat-icon">${icon('card')}</span></div>
          ${inv ? `<p class="stat-value">${money(inv.amount)}</p><p class="stat-foot"><span class="tag ${daysUntil(inv.due) <= 7 ? 'tag-bad' : 'tag-warn'}">Due ${relDays(daysUntil(inv.due))}</span> <span class="nowrap">· ${fmtDate(inv.due)}</span></p>` : `<p class="stat-value">All clear</p><p class="stat-foot">No pending invoices</p>`}
        </a>
        <a class="card stat reveal" href="#datesheet">
          <div class="stat-top"><span>Next exam</span><span class="stat-icon">${icon('calendar')}</span></div>
          ${exam ? `<p class="stat-value"><span data-count="${daysUntil(exam.date)}">${daysUntil(exam.date)}</span> <small>days</small></p><p class="stat-foot">${esc(courseBy(exam.code).title)} · ${exam.kind} · ${fmtDate(exam.date)}</p>` : `<p class="stat-value">—</p><p class="stat-foot">No upcoming exams</p>`}
        </a>
      </div>

      <section class="block reveal" aria-labelledby="dash-courses-h">
        <div class="block-head">
          <h2 id="dash-courses-h">My courses</h2>
          <div class="carousel-ctrls">
            <button class="icon-btn" type="button" data-scroll="-1" aria-label="Scroll courses left">${icon('left')}</button>
            <button class="icon-btn" type="button" data-scroll="1" aria-label="Scroll courses right">${icon('right')}</button>
          </div>
        </div>
        <div class="carousel" id="dash-carousel" tabindex="0" role="region" aria-label="Course cards — scroll sideways for more">
          ${D.courses.map(courseCard).join('')}
        </div>
      </section>

      <div class="grid-2">
        <section class="card reveal" aria-labelledby="dash-today-h">
          <div class="card-head">
            <div><h2 class="card-title" id="dash-today-h">${isWeekday ? "Today's classes" : `${DAY_NAMES[DAY_KEYS.indexOf(tlKey)]}'s classes`}</h2>
            <p class="card-sub">${isWeekday ? `${todaySlots.length} sessions · ${DAY_NAMES[NOW.getDay()]}` : 'Weekend — showing the next class day'}</p></div>
            <a class="link-btn" href="#timetable">Full timetable ${icon('arrow')}</a>
          </div>
          ${timeline(tlSlots, isWeekday)}
        </section>
        <section class="card reveal" aria-labelledby="dash-ann-h">
          <div class="card-head">
            <div><h2 class="card-title" id="dash-ann-h">Latest announcements</h2><p class="card-sub" data-unread-text></p></div>
            <a class="link-btn" href="#announcements">See all ${icon('arrow')}</a>
          </div>
          <div class="ann-list">${D.announcements.slice(0, 3).map((a) => annItem(a, true)).join('')}</div>
        </section>
      </div>`;
    const ut = $('[data-unread-text]');
    if (ut) ut.textContent = unreadCount() ? `${unreadCount()} unread` : 'You are all caught up';
  }

  function renderProfile() {
    const s = D.student;
    $('#view-profile').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Student record · fictional</p><h1 class="view-title" tabindex="-1">Profile</h1></div></div>
      <div class="card profile-hero reveal">
        <div class="avatar avatar-xl" role="img" aria-label="Profile initials for ${esc(s.name)}">ZA</div>
        <div>
          <h2 style="font-size:24px;font-weight:800">${esc(s.name)}</h2>
          <p class="card-sub">${s.id} · ${esc(s.program)}</p>
          <p style="margin-top:8px"><span class="tag tag-ok">${esc(s.status)}</span></p>
        </div>
      </div>
      <div class="profile-grid">
        <section class="card reveal" aria-labelledby="pf-acad"><h2 class="card-title" id="pf-acad" style="margin-bottom:6px">Academic information</h2>
          <dl class="dl">
            <div><dt>Faculty</dt><dd>${esc(s.faculty)}</dd></div>
            <div><dt>Program</dt><dd>${esc(s.program)}</dd></div>
            <div><dt>Batch</dt><dd>${s.batch}</dd></div>
            <div><dt>Current semester</dt><dd>${s.semester} · ${s.section}</dd></div>
            <div><dt>Academic advisor</dt><dd>${esc(s.advisor)}</dd></div>
          </dl>
        </section>
        <section class="card reveal" aria-labelledby="pf-prog"><h2 class="card-title" id="pf-prog" style="margin-bottom:6px">Degree progress</h2>
          <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
            ${ring(EARNED / s.totalCredits, Math.round(EARNED / s.totalCredits * 100) + '%', 'Complete', 'var(--crimson)', Math.round(EARNED / s.totalCredits * 100), 0)}
            <dl class="dl" style="flex:1;min-width:180px">
              <div><dt>Earned credits</dt><dd>${EARNED}</dd></div>
              <div><dt>In progress</dt><dd>${SEM_CREDITS}</dd></div>
              <div><dt>Remaining</dt><dd>${s.totalCredits - EARNED - SEM_CREDITS}</dd></div>
              <div><dt>CGPA</dt><dd>${CGPA.toFixed(2)}</dd></div>
            </dl>
          </div>
        </section>
        <section class="card reveal" aria-labelledby="pf-contact"><h2 class="card-title" id="pf-contact" style="margin-bottom:6px">Contact (demo)</h2>
          <dl class="dl">
            <div><dt>University email</dt><dd>${esc(s.email)}</dd></div>
            <div><dt>Phone</dt><dd>${esc(s.phone)}</dd></div>
          </dl>
        </section>
        <section class="card reveal" aria-labelledby="pf-links"><h2 class="card-title" id="pf-links" style="margin-bottom:12px">Quick links</h2>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <a class="btn btn-outline btn-sm" href="#results">${icon('chart')}Transcript</a>
            <a class="btn btn-outline btn-sm" href="#fees">${icon('receipt')}Invoices</a>
            <a class="btn btn-outline btn-sm" href="#timetable">${icon('clock')}Time table</a>
            <a class="btn btn-outline btn-sm" href="#datesheet">${icon('calendar')}Datesheet</a>
          </div>
        </section>
      </div>`;
  }

  let courseFilter = 'All';
  function renderCourses() {
    const list = D.courses.filter((c) => courseFilter === 'All' || c.type === courseFilter);
    $('#view-courses').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Fall 2026 · Semester ${D.student.semester}</p><h1 class="view-title" tabindex="-1">My Courses</h1>
        <p class="lead">${D.courses.length} enrolled courses · ${SEM_CREDITS} credit hours. Open a course to see its lecture log, marks and room.</p></div></div>
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Filter courses">
          ${['All', 'Theory', 'Lab'].map((f) => `<button class="chip" type="button" data-cfilter="${f}" aria-pressed="${f === courseFilter}">${f}<span class="count">${f === 'All' ? D.courses.length : D.courses.filter((c) => c.type === f).length}</span></button>`).join('')}
        </div>
      </div>
      <div class="course-grid">${list.map(courseCard).join('')}</div>`;
  }

  /* ---------- attendance + planner ---------- */
  let planCode = [...D.courses].sort((a, b) => pct(a) - pct(b))[0].code;
  let planMiss = 0;
  function renderAttendance() {
    $('#view-attendance').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Fall 2026 · Week ${weekNo}</p><h1 class="view-title" tabindex="-1">Attendance</h1>
        <p class="lead">Overall attendance <strong>${fmtPct(AVG_ATT)}</strong>. Each course needs at least <strong>${MIN}%</strong> by the end of the semester (demo policy).</p></div></div>
      <div class="att-layout">
        <section class="card planner reveal" aria-labelledby="planner-h">
          <h2 class="card-title" id="planner-h">${icon('zap')} Attendance planner</h2>
          <p class="card-sub" style="margin-top:4px">Pick a course, then drag the slider to see where you would finish if you miss that many of the remaining classes.</p>
          <div class="field">
            <label for="plan-course">Course</label>
            <select id="plan-course">${D.courses.map((c) => `<option value="${c.code}" ${c.code === planCode ? 'selected' : ''}>${c.code} — ${esc(c.title)}</option>`).join('')}</select>
          </div>
          <div class="mini-stats" id="plan-stats"></div>
          <div class="field">
            <label for="plan-miss"><span>Classes I might miss</span><output id="plan-miss-out" for="plan-miss">0</output></label>
            <input type="range" id="plan-miss" min="0" max="10" step="1" value="0">
          </div>
          <div class="projection" id="projection" aria-live="polite"></div>
        </section>
        <section aria-labelledby="att-list-h">
          <div class="block-head"><h2 id="att-list-h">By course</h2><span class="card-sub">Sorted lowest first</span></div>
          <div class="att-rows" id="att-rows"></div>
        </section>
      </div>`;
    renderAttRows();
    updatePlanner(true);
    $('#plan-course').addEventListener('change', (e) => { planCode = e.target.value; planMiss = 0; updatePlanner(true); renderAttRows(); });
    $('#plan-miss').addEventListener('input', (e) => { planMiss = Number(e.target.value); updatePlanner(false); });
  }

  function renderAttRows() {
    const rows = [...D.courses].sort((a, b) => pct(a) - pct(b));
    $('#att-rows').innerHTML = rows.map((c) => {
      const p = pct(c), st = attStatus(p);
      return `<div class="att-row ${c.code === planCode ? 'selected' : ''}">
        <p class="att-name">${esc(c.title)}<span>${c.code} · ${esc(c.instructor)}</span></p>
        <p class="att-pct" style="color:${barColor(p)}">${fmtPct(p)}</p>
        <div class="meter" role="img" aria-label="${fmtPct(p)} attended"><span style="--v:${p.toFixed(1)}%;--bar:${barColor(p)}"></span><i class="mark"></i></div>
        <div class="row-foot"><span>${c.attended} of ${c.held} classes attended · <span class="tag tag-${st.cls}">${st.label}</span></span>
          <span style="display:flex;gap:6px"><button class="btn btn-outline btn-sm" type="button" data-course="${c.code}">Log</button><button class="btn btn-outline btn-sm" type="button" data-plan="${c.code}" aria-label="Plan attendance for ${esc(c.title)}">Plan</button></span></div>
      </div>`;
    }).join('');
    const view = $('#view-attendance');
    if (view.classList.contains('is-in')) { view.classList.remove('is-in'); void view.offsetWidth; view.classList.add('is-in'); }
  }

  function updatePlanner(resetSlider) {
    const c = courseBy(planCode);
    const remaining = c.total - c.held;
    const slider = $('#plan-miss');
    if (resetSlider) { slider.max = String(remaining); slider.value = String(planMiss); }
    const best = (c.attended + remaining) / c.total * 100;
    const finalPct = (c.attended + remaining - planMiss) / c.total * 100;
    const safe = Math.max(0, Math.floor(c.attended + remaining - (MIN / 100) * c.total));
    $('#plan-miss-out').textContent = `${planMiss} of ${remaining}`;
    slider.setAttribute('aria-valuetext', `${planMiss} of ${remaining} remaining classes missed`);
    $('#plan-stats').innerHTML = `
      <div class="mini"><span>Now</span><strong style="color:${barColor(pct(c))}">${fmtPct(pct(c))}</strong></div>
      <div class="mini"><span>Held</span><strong>${c.attended}/${c.held}</strong></div>
      <div class="mini"><span>Remaining</span><strong>${remaining}</strong></div>`;
    const ok = finalPct >= MIN;
    let msg;
    if (best < MIN) msg = `Even with full attendance you can only reach <strong>${fmtPct(best)}</strong>. Please speak to your advisor about options.`;
    else if (ok) msg = planMiss === safe
      ? `You would finish at exactly the limit. <strong>Don't miss any more</strong> after this.`
      : `You're safe. You can miss <strong>${safe - planMiss} more</strong> class${safe - planMiss === 1 ? '' : 'es'} on top of this and still stay above ${MIN}%.`;
    else msg = `That drops you below ${MIN}%. Miss <strong>no more than ${safe}</strong> of the remaining ${remaining} classes.`;
    const box = $('#projection');
    box.className = 'projection ' + (ok ? 'ok' : 'bad');
    box.innerHTML = `
      <div class="proj-top"><span class="proj-value">${fmtPct(finalPct)}</span><span class="tag tag-${ok ? 'ok' : 'bad'}">${ok ? icon('check', 'i i-sm') + 'Safe' : icon('alert', 'i i-sm') + 'At risk'}</span></div>
      <p class="card-sub">Projected end-of-semester attendance for ${esc(c.title)}</p>
      <div class="meter gauge" aria-hidden="true"><span style="--v:${finalPct.toFixed(1)}%;--bar:${ok ? 'var(--ok)' : 'var(--bad)'}"></span><i class="mark"></i></div>
      <div class="gauge-legend" aria-hidden="true"><span>0%</span><span>${MIN}% min</span><span>100%</span></div>
      <p class="proj-msg">${msg}</p>`;
  }

  /* ---------- results ---------- */
  let resultsTab = 0;
  function renderResults() {
    const terms = [{ term: 'Fall 2026', current: true }, ...D.results.slice().reverse()];
    const allBars = [...D.results.map((t) => ({ label: t.term, v: gpaOf(t.courses) })), { label: 'Fall 2026 (proj.)', v: PROJ_SGPA, proj: true }];
    $('#view-results').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Transcript · fictional</p><h1 class="view-title" tabindex="-1">Results &amp; Exams</h1>
        <p class="lead">Grades for completed semesters and live mid-term marks for the current one.</p></div></div>
      <div class="kpis">
        <div class="card stat reveal"><div class="stat-top"><span>CGPA</span><span class="stat-icon">${icon('award')}</span></div><p class="stat-value"><span data-count="${CGPA.toFixed(2)}" data-dec="2">${CGPA.toFixed(2)}</span> <small>/ 4.00</small></p><p class="stat-foot">Across ${D.results.length} completed semesters</p></div>
        <div class="card stat reveal"><div class="stat-top"><span>Credits earned</span><span class="stat-icon">${icon('book')}</span></div><p class="stat-value"><span data-count="${EARNED}">${EARNED}</span> <small>/ ${D.student.totalCredits}</small></p><p class="stat-foot">${SEM_CREDITS} more in progress</p></div>
        <div class="card stat reveal"><div class="stat-top"><span>Projected SGPA</span><span class="stat-icon">${icon('chart')}</span></div><p class="stat-value"><span data-count="${PROJ_SGPA.toFixed(2)}" data-dec="2">${PROJ_SGPA.toFixed(2)}</span></p><p class="stat-foot">Estimate from Fall 2026 mid-term marks</p></div>
      </div>
      <div class="results-layout">
        <section class="card reveal" aria-labelledby="res-h">
          <h2 class="card-title" id="res-h" style="margin-bottom:12px">Semester results</h2>
          <div class="chips" role="tablist" aria-label="Choose semester">
            ${terms.map((t, i) => `<button class="chip" role="tab" type="button" id="rtab-${i}" aria-controls="rpanel" aria-selected="${i === resultsTab}" tabindex="${i === resultsTab ? 0 : -1}" data-rtab="${i}">${t.term}${t.current ? ' · live' : ''}</button>`).join('')}
          </div>
          <div class="tabpanel" id="rpanel" role="tabpanel" aria-labelledby="rtab-${resultsTab}" tabindex="0">${resultsPanel(terms[resultsTab])}</div>
        </section>
        <section class="card chart-card reveal" aria-labelledby="gpa-h">
          <h2 class="card-title" id="gpa-h">SGPA by semester</h2>
          <p class="card-sub">Dashed line shows your CGPA (${CGPA.toFixed(2)}).</p>
          <div class="bars" role="img" aria-label="SGPA by semester: ${allBars.map((b) => `${b.label} ${b.v.toFixed(2)}`).join(', ')}">
            ${allBars.map((b) => `<div class="bar-col"><div class="bar ${b.proj ? 'projected' : ''}" style="--h:${(b.v / 4 * 85).toFixed(1)}%"><span class="bar-val" aria-hidden="true">${b.v.toFixed(2)}</span></div></div>`).join('')}
            <div class="ref-line" style="bottom:${(CGPA / 4 * 85).toFixed(1)}%" aria-hidden="true"><span>CGPA</span></div>
          </div>
          <div class="bar-labels" aria-hidden="true">${allBars.map((b) => `<span>${b.label}</span>`).join('')}</div>
          <div class="legend" aria-hidden="true"><span><i class="sw-final"></i>Final SGPA</span><span><i style="background:var(--gold)"></i>Projected</span></div>
        </section>
      </div>`;
  }

  function gradeCls(g) { return 'g-' + g[0]; }
  function resultsPanel(t) {
    if (t.current) {
      return `<div class="table-wrap"><table>
        <caption class="sr-only">Fall 2026 mid-term marks</caption>
        <thead><tr><th scope="col">Course</th><th scope="col" class="num" title="Quizzes + assignments">Sessional /20</th><th scope="col" class="num">Mid /30</th><th scope="col" class="num">Total /50</th><th scope="col">Est. grade</th></tr></thead>
        <tbody>${D.courses.map((c) => { const tot = midTotal(c); const g = estGrade(tot); return `<tr>
          <td><strong>${esc(c.title)}</strong><br><span class="card-sub">${c.code}</span></td>
          <td class="num">${c.marks.quiz + c.marks.assign}<br><span class="card-sub">Q ${c.marks.quiz} · A ${c.marks.assign}</span></td><td class="num">${c.marks.mid}</td><td class="num"><strong>${tot}</strong></td>
          <td><span class="grade ${gradeCls(g)}">${g}</span></td></tr>`; }).join('')}</tbody>
      </table></div>`;
    }
    const sg = gpaOf(t.courses), cr = t.courses.reduce((a, c) => a + c.credits, 0);
    return `<div class="table-wrap"><table>
      <caption class="sr-only">${t.term} final grades</caption>
      <thead><tr><th scope="col">Code</th><th scope="col">Course</th><th scope="col" class="num">Credits</th><th scope="col">Grade</th><th scope="col" class="num">Points</th></tr></thead>
      <tbody>${t.courses.map((c) => `<tr><td>${c.code}</td><td>${esc(c.title)}</td><td class="num">${c.credits}</td><td><span class="grade ${gradeCls(c.grade)}">${c.grade}</span></td><td class="num">${(GP[c.grade] * c.credits).toFixed(2)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">SGPA</td><td class="num">${cr}</td><td colspan="2" class="num">${sg.toFixed(2)}</td></tr></tfoot>
    </table></div>`;
  }

  /* ---------- datesheet ---------- */
  let examFilter = 'Upcoming';
  function renderDatesheet() {
    const up = upcomingExams();
    const next = up[0];
    const list = examFilter === 'Upcoming' ? up : D.exams.filter((e) => daysUntil(e.date) < 0).sort((a, b) => parseDate(a.date) - parseDate(b.date));
    $('#view-datesheet').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Examinations · Fall 2026</p><h1 class="view-title" tabindex="-1">Exam Datesheet</h1>
        <p class="lead">Your personal schedule with venue and seat number. Add any paper to your phone calendar in one tap.</p></div></div>
      ${next ? `<div class="card countdown-hero reveal">
        <div><p class="card-sub">Next paper</p><h2 style="font-size:20px;font-weight:800">${esc(courseBy(next.code).title)} · ${next.kind}</h2><p class="card-sub">${fmtDate(next.date, true)} · ${next.start}–${next.end} · ${next.venue}</p></div>
        <div class="cd-units" id="countdown" data-at="${next.date}T${next.start}" role="timer" aria-label="Time until next exam"></div>
      </div>` : ''}
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Filter exams">
          ${[['Upcoming', up.length], ['Completed', D.exams.length - up.length]].map(([f, n]) => `<button class="chip" type="button" data-efilter="${f}" aria-pressed="${f === examFilter}">${f}<span class="count">${n}</span></button>`).join('')}
        </div>
      </div>
      <div class="exam-list">
        ${list.length ? list.map((e) => { const d = parseDate(e.date), c = courseBy(e.code), n = daysUntil(e.date); return `
          <article class="card exam">
            <div class="date-tile" aria-hidden="true"><div class="m">${MONTHS[d.getMonth()].toUpperCase()}</div><div class="d">${d.getDate()}</div><div class="w">${DAY_KEYS[d.getDay()]}</div></div>
            <div>
              <p class="ann-top"><span>${c.code}</span><span aria-hidden="true">·</span><span>${e.kind}</span></p>
              <h3 class="exam-title">${esc(c.title)}</h3>
              <div class="exam-meta">
                <span>${icon('clock')}${DAY_NAMES[d.getDay()]}, ${fmtDate(e.date, true)} · ${e.start}–${e.end}</span>
                <span>${icon('pin')}${esc(e.venue)} · Seat ${e.seat}</span>
              </div>
              <div class="exam-foot">
                <span class="tag ${n < 0 ? 'tag-ok' : n <= 7 ? 'tag-bad' : 'tag-info'}">${n < 0 ? 'Completed' : relDays(n)}</span>
                ${n >= 0 ? `<button class="btn btn-outline btn-sm" type="button" data-ics="${D.exams.indexOf(e)}">${icon('download')}Add to calendar</button>` : ''}
              </div>
            </div>
          </article>`; }).join('') : '<div class="empty"><strong>Nothing here</strong>No exams in this list.</div>'}
      </div>`;
    tickCountdown();
  }

  function tickCountdown() {
    const el = $('#countdown');
    if (!el) return;
    const [ds, ts] = el.dataset.at.split('T');
    const target = parseDate(ds); target.setMinutes(toMin(ts));
    let diff = Math.max(0, target - new Date());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);
    const s = Math.floor((diff - m * 6e4) / 1000);
    el.innerHTML = [['Days', d], ['Hours', h], ['Min', m], ['Sec', s]].map(([l, v]) => `<div class="cd-unit"><strong>${String(v).padStart(2, '0')}</strong><span>${l}</span></div>`).join('');
    el.setAttribute('aria-label', `${d} days, ${h} hours and ${m} minutes until the next exam`);
  }
  setInterval(tickCountdown, 1000);

  function downloadICS(i) {
    const e = D.exams[i], c = courseBy(e.code);
    const dt = (date, t) => date.replace(/-/g, '') + 'T' + t.replace(':', '') + '00';
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MAJU Nexus Prototype//EN', 'BEGIN:VEVENT',
      `UID:${e.code}-${e.date}@maju-nexus.demo`, `DTSTAMP:${stamp}`,
      `DTSTART:${dt(e.date, e.start)}`, `DTEND:${dt(e.date, e.end)}`,
      `SUMMARY:${e.kind} exam - ${c.title}`, `LOCATION:${e.venue} (Seat ${e.seat})`,
      'DESCRIPTION:Demo event from the MAJU Nexus redesign prototype.',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Exam tomorrow', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${e.code}-${e.kind.replace(/\s/g, '')}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`${c.title} added — open the .ics file to save it`, 'calendar');
  }

  /* ---------- timetable ---------- */
  let ttDay = isWeekday ? todayKey : 'Mon';
  function renderTimetable() {
    const starts = [...new Set(WEEK.flatMap((k) => D.timetable[k].map((s) => s.start)))].sort((a, b) => toMin(a) - toMin(b));
    $('#view-timetable').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Fall 2026 · Section ${D.student.section}</p><h1 class="view-title" tabindex="-1">Time Table</h1>
        <p class="lead">Swipe through the days, or check the full week grid below.</p></div></div>
      <div class="chips" role="tablist" aria-label="Choose a day">
        ${WEEK.map((k) => `<button class="chip day-chip" role="tab" type="button" id="dtab-${k}" aria-controls="day-panel" aria-selected="${k === ttDay}" tabindex="${k === ttDay ? 0 : -1}" data-day="${k}">${k}<small>${D.timetable[k].length} class${D.timetable[k].length > 1 ? 'es' : ''}${k === todayKey ? ' · today' : ''}</small></button>`).join('')}
      </div>
      <div class="tt-layout">
        <section class="card" id="day-panel" role="tabpanel" aria-labelledby="dtab-${ttDay}">
          <div class="card-head"><h2 class="card-title">${DAY_NAMES[DAY_KEYS.indexOf(ttDay)]}${ttDay === todayKey ? ' · Today' : ''}</h2><span class="card-sub">${D.timetable[ttDay].length} sessions</span></div>
          ${timeline(D.timetable[ttDay], ttDay === todayKey)}
        </section>
        <section class="card reveal" aria-labelledby="week-h">
          <div class="card-head"><h2 class="card-title" id="week-h">Week at a glance</h2><span class="card-sub">Scroll sideways on small screens</span></div>
          <div class="table-wrap" tabindex="0" role="region" aria-label="Weekly timetable grid">
            <table class="week-grid">
              <caption class="sr-only">Weekly timetable, rows are start times, columns are days</caption>
              <thead><tr><th scope="col">Time</th>${WEEK.map((k) => `<th scope="col" class="${k === todayKey ? 'today-col' : ''}">${k}${k === todayKey ? ' · today' : ''}</th>`).join('')}</tr></thead>
              <tbody>${starts.map((t) => `<tr><th scope="row">${t}</th>${WEEK.map((k) => { const s = D.timetable[k].find((x) => x.start === t); if (!s) return `<td class="${k === todayKey ? 'today-col' : ''}"></td>`; const c = courseBy(s.code); return `<td class="${k === todayKey ? 'today-col' : ''}"><span class="slot-pill" style="--hue:${c.hue}"><strong>${esc(c.title)}</strong>${s.start}–${s.end} · ${s.room}</span></td>`; }).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  /* ---------- fees ---------- */
  function renderFees() {
    const total = D.fees.breakdown.reduce((a, b) => a + b.amount, 0);
    const cur = D.invoices.filter((i) => i.term === 'Fall 2026');
    const paid = cur.filter((i) => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
    const due = cur.filter((i) => i.status === 'unpaid');
    const dueAmt = due.reduce((a, i) => a + i.amount, 0);
    const statusTag = (i) => i.status === 'paid' ? `<span class="tag tag-ok">${icon('check', 'i i-sm')}Paid ${fmtDate(i.paidOn)}</span>` : `<span class="tag ${daysUntil(i.due) <= 7 ? 'tag-bad' : 'tag-warn'}">Unpaid · due ${relDays(daysUntil(i.due))}</span>`;
    $('#view-fees').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Finance · fictional amounts</p><h1 class="view-title" tabindex="-1">Fees &amp; Invoices</h1>
        <p class="lead">See what you owe, what's paid and where the money goes. This prototype does not take payments.</p></div></div>
      <div class="kpis">
        <div class="card stat reveal"><div class="stat-top"><span>Fall 2026 total</span><span class="stat-icon">${icon('receipt')}</span></div><p class="stat-value">${money(total)}</p><p class="stat-foot">2 installments</p></div>
        <div class="card stat reveal"><div class="stat-top"><span>Paid</span><span class="stat-icon">${icon('check')}</span></div><p class="stat-value">${money(paid)}</p><div class="meter" aria-hidden="true"><span style="--v:${(paid / total * 100).toFixed(1)}%;--bar:var(--ok)"></span></div><p class="stat-foot">${Math.round(paid / total * 100)}% of semester fee</p></div>
        <div class="card stat reveal"><div class="stat-top"><span>Outstanding</span><span class="stat-icon">${icon('card')}</span></div><p class="stat-value" style="color:${dueAmt ? 'var(--bad)' : 'var(--ok)'}">${money(dueAmt)}</p><p class="stat-foot">${due.length ? `Due ${fmtDate(due[0].due, true)} · ${relDays(daysUntil(due[0].due))}` : 'Nothing pending'}</p></div>
      </div>
      <div class="fees-layout">
        <section class="card reveal" aria-labelledby="fee-bd-h">
          <h2 class="card-title" id="fee-bd-h">Where your fee goes</h2>
          <p class="card-sub">Fall 2026 semester breakdown</p>
          <div class="fee-bar" role="img" aria-label="${D.fees.breakdown.map((b) => `${b.label} ${Math.round(b.amount / total * 100)}%`).join(', ')}">
            ${D.fees.breakdown.map((b) => `<span style="--w:${(b.amount / total * 100).toFixed(2)}%;background:${b.color}"></span>`).join('')}
          </div>
          <ul class="fee-legend">${D.fees.breakdown.map((b) => `<li><i style="background:${b.color}"></i>${b.label}<b>${money(b.amount)}</b></li>`).join('')}</ul>
        </section>
        <section class="card reveal" aria-labelledby="inv-h">
          <div class="card-head"><h2 class="card-title" id="inv-h">Invoices</h2><span class="card-sub">${D.invoices.length} total</span></div>
          <div class="table-wrap inv-table"><table>
            <caption class="sr-only">All invoices</caption>
            <thead><tr><th scope="col">Invoice</th><th scope="col">Term</th><th scope="col" class="num">Amount</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>${D.invoices.map((i) => `<tr><td class="wrap"><strong>${i.no}</strong><br><span class="card-sub">${esc(i.desc)}</span></td><td>${i.term}</td><td class="num">${money(i.amount)}</td><td>${statusTag(i)}</td><td><button class="btn btn-outline btn-sm" type="button" data-challan="${i.no}">View</button></td></tr>`).join('')}</tbody>
          </table></div>
          <div class="inv-cards">${D.invoices.map((i) => `<div class="att-row" style="grid-template-columns:minmax(0,1fr) auto">
            <p class="att-name">${i.term}<span>${i.no} · ${esc(i.desc)}</span></p><p class="att-pct" style="font-size:15px">${money(i.amount)}</p>
            <div class="row-foot">${statusTag(i)}<button class="btn btn-outline btn-sm" type="button" data-challan="${i.no}">View challan</button></div></div>`).join('')}</div>
        </section>
      </div>`;
  }

  function openChallan(no) {
    const i = D.invoices.find((x) => x.no === no), s = D.student;
    $('#challan-body').innerHTML = `
      <div class="sheet-head" style="--hue:214">
        <h2 id="challan-title" tabindex="-1">Fee challan</h2><p>${i.no} · ${i.term}</p>
        <button class="icon-btn no-print" type="button" data-dialog-close aria-label="Close challan">${icon('x')}</button>
      </div>
      <div class="sheet-body">
        <div class="challan">
          <dl class="dl">
            <div><dt>Student</dt><dd>${esc(s.name)} (${s.id})</dd></div>
            <div><dt>Program</dt><dd>${esc(s.program)}</dd></div>
            <div><dt>Description</dt><dd>${esc(i.desc)}</dd></div>
            <div><dt>Due date</dt><dd>${fmtDate(i.due, true)}</dd></div>
            <div><dt>Amount</dt><dd style="font-size:18px">${money(i.amount)}</dd></div>
            <div><dt>Status</dt><dd>${i.status === 'paid' ? `Paid on ${fmtDate(i.paidOn, true)}` : 'Unpaid'}</dd></div>
          </dl>
        </div>
        <p class="card-sub">Demo only — this prototype does not process payments and this challan is not valid at any bank.</p>
        <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" type="button" data-print>${icon('printer')}Print challan</button>
          <button class="btn btn-outline" type="button" data-dialog-close>Close</button>
        </div>
      </div>`;
    openDialog($('#challan-dialog'));
  }

  /* ---------- announcements ---------- */
  let annFilter = 'All', annQuery = '';
  function renderAnnouncements() {
    const cats = ['All', 'Academic', 'Exams', 'Finance', 'Events'];
    $('#view-announcements').innerHTML = `
      <div class="view-head"><div><p class="eyebrow">Notifications</p><h1 class="view-title" tabindex="-1">Announcements</h1>
        <p class="lead" id="ann-lead"></p></div>
        <button class="btn btn-outline" type="button" id="mark-all">${icon('check')}Mark all as read</button></div>
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Filter by category">
          ${cats.map((c) => `<button class="chip" type="button" data-afilter="${c}" aria-pressed="${c === annFilter}">${c}<span class="count">${c === 'All' ? D.announcements.length : D.announcements.filter((a) => a.cat === c).length}</span></button>`).join('')}
        </div>
        <div style="flex:1;max-width:320px;min-width:200px">
          <label for="ann-search" class="sr-only">Search announcements</label>
          <input id="ann-search" class="input" type="search" placeholder="Search announcements…" value="${esc(annQuery)}">
        </div>
      </div>
      <div class="ann-list" id="ann-list"></div>`;
    $('#ann-search').addEventListener('input', (e) => { annQuery = e.target.value; renderAnnList(); });
    $('#mark-all').addEventListener('click', () => {
      const n = unreadCount();
      D.announcements.forEach((a) => { a.unread = false; readState[a.id] = true; });
      store.set('maju-read', readState);
      renderAnnList(); syncBadges(true); renderDashboard();
      toast(n ? `${n} announcement${n > 1 ? 's' : ''} marked as read` : 'Already all caught up');
    });
    renderAnnList();
  }
  function renderAnnList() {
    const q = annQuery.trim().toLowerCase();
    const list = D.announcements.filter((a) => (annFilter === 'All' || a.cat === annFilter) && (!q || (a.title + ' ' + a.body).toLowerCase().includes(q)));
    $('#ann-list').innerHTML = list.length ? list.map((a) => annItem(a, false)).join('') : '<div class="empty"><strong>No matches</strong>Try another category or search term.</div>';
    const n = unreadCount();
    $('#ann-lead').textContent = n ? `${n} unread · ${D.announcements.length} total` : `You're all caught up · ${D.announcements.length} total`;
  }
  function toggleRead(id) {
    const a = D.announcements.find((x) => x.id === id);
    a.unread = !a.unread; readState[id] = !a.unread; store.set('maju-read', readState);
    syncBadges(true);
    if (!$('#view-announcements').hidden) {
      renderAnnList();
      const btn = $(`[data-read="${id}"]`); if (btn) btn.focus();
    }
    renderDashboard();
    toast(a.unread ? 'Marked as unread' : 'Marked as read');
  }

  /* ---------- course dialog ---------- */
  function lectureLog(c) {
    const absent = c.held - c.attended, set = new Set();
    let seed = [...c.code].reduce((a, ch) => a + ch.charCodeAt(0), 0), k = 0;
    while (set.size < absent && k++ < 999) { seed = (seed * 9301 + 49297) % 233280; set.add(Math.floor(seed / 233280 * c.held)); }
    return Array.from({ length: c.total }, (_, i) => (i >= c.held ? 'u' : set.has(i) ? 'a' : 'p'));
  }
  function openCourse(code) {
    const c = courseBy(code), p = pct(c), st = attStatus(p);
    const slots = WEEK.flatMap((k) => D.timetable[k].filter((s) => s.code === code).map((s) => `${k} ${s.start}–${s.end}`));
    const log = lectureLog(c);
    const tot = midTotal(c);
    $('#course-dialog-body').innerHTML = `
      <div class="sheet-head" style="--hue:${c.hue}">
        <h2 id="course-dialog-title" tabindex="-1">${esc(c.title)}</h2>
        <p>${c.code} · ${c.type} · ${c.credits} credit hour${c.credits > 1 ? 's' : ''}</p>
        <button class="icon-btn" type="button" data-dialog-close aria-label="Close course details">${icon('x')}</button>
      </div>
      <div class="sheet-body">
        <dl class="dl">
          <div><dt>Instructor</dt><dd>${esc(c.instructor)}</dd></div>
          <div><dt>Room</dt><dd>${esc(c.room)}</dd></div>
          <div><dt>Schedule</dt><dd>${slots.join(', ')}</dd></div>
          <div><dt>Attendance</dt><dd><span class="tag tag-${st.cls}">${fmtPct(p)} · ${st.label}</span></dd></div>
          <div><dt>Mid-term total</dt><dd>${tot} / 50 · est. ${estGrade(tot)}</dd></div>
        </dl>
        <div>
          <h3>Lecture log</h3>
          <div class="log" role="list" aria-label="Lecture log: ${c.attended} present, ${c.held - c.attended} absent, ${c.total - c.held} upcoming">
            ${log.map((x, i) => `<span role="listitem" class="${x}" title="Lecture ${i + 1}: ${x === 'p' ? 'Present' : x === 'a' ? 'Absent' : 'Upcoming'}" aria-label="Lecture ${i + 1}: ${x === 'p' ? 'present' : x === 'a' ? 'absent' : 'upcoming'}">${x === 'p' ? 'P' : x === 'a' ? 'A' : i + 1}</span>`).join('')}
          </div>
          <div class="legend"><span><i style="background:var(--ok-soft);border:1px solid var(--ok)"></i>Present</span><span><i style="background:var(--bad)"></i>Absent</span><span><i style="border:1px dashed var(--muted)"></i>Upcoming</span></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" type="button" data-plan="${c.code}">${icon('zap')}Plan attendance</button>
          <button class="btn btn-outline" type="button" data-dialog-close>Close</button>
        </div>
      </div>`;
    openDialog($('#course-dialog'));
  }

  let lastFocus = null;
  function openDialog(dlg) {
    lastFocus = document.activeElement;
    dlg.showModal();
    const h = dlg.querySelector('h2[tabindex]'); if (h) h.focus();
  }
  ['course-dialog', 'challan-dialog'].forEach((id) => {
    const dlg = document.getElementById(id);
    dlg.addEventListener('close', () => { if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // backdrop click
  });

  /* =================================================
     ROUTER
     ================================================= */
  const VIEWS = {
    dashboard: renderDashboard, profile: renderProfile, courses: renderCourses, attendance: renderAttendance,
    results: renderResults, datesheet: renderDatesheet, timetable: renderTimetable, fees: renderFees, announcements: renderAnnouncements
  };
  let current = null;

  function animateCounters(root) {
    $$('[data-count]', root).forEach((el) => {
      const to = parseFloat(el.dataset.count), dec = Number(el.dataset.dec || 0), suf = el.dataset.suffix || '';
      if (reduceMotion || isNaN(to)) return;
      const t0 = performance.now(), dur = 1000;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (to * e).toFixed(dec) + suf;
        if (k < 1) requestAnimationFrame(step); else el.textContent = (dec === 1 ? fmtPct(to).replace('%', '') : to.toFixed(dec)) + suf;
      };
      requestAnimationFrame(step);
    });
  }

  const revealObs = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('shown'); revealObs.unobserve(en.target); } }), { threshold: 0.08 })
    : null;
  function setupReveals(root) {
    $$('.reveal', root).forEach((el, i) => {
      if (!revealObs) { el.classList.add('shown'); return; }
      el.style.transitionDelay = Math.min(i * 60, 360) + 'ms';
      revealObs.observe(el);
    });
  }

  function go(route, userNav) {
    if (!VIEWS[route]) route = 'dashboard';
    VIEWS[route]();
    $$('.view').forEach((v) => { v.hidden = v.id !== 'view-' + route; v.classList.remove('is-in'); });
    const view = $('#view-' + route);
    // restart the entrance animation
    view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
    requestAnimationFrame(() => requestAnimationFrame(() => view.classList.add('is-in')));
    setupReveals(view);
    animateCounters(view);
    $$('[data-route]').forEach((a) => { if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const title = view.dataset.title;
    $('#crumb-current').textContent = title;
    document.title = `${title} · MAJU Nexus`;
    current = route;
    closeMenu(false);
    if (userNav) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      const h = view.querySelector('.view-title'); if (h) h.focus({ preventScroll: true });
    }
  }
  window.addEventListener('hashchange', () => {
    const r = location.hash.slice(1);
    if (VIEWS[r]) go(r, true); // ignore in-page anchors such as the skip link (#main)
  });

  function planFor(code) {
    planCode = code; planMiss = 0;
    if ($('#course-dialog').open) $('#course-dialog').close();
    if (location.hash === '#attendance') go('attendance', true);
    else location.hash = '#attendance';
    setTimeout(() => { const sel = $('#plan-course'); if (sel) sel.focus(); }, 60);
    toast(`Planner set to ${courseBy(code).title}`, 'zap');
  }

  /* =================================================
     MENU, THEME, PALETTE
     ================================================= */
  const sidebar = $('#sidebar'), scrim = $('.scrim'), menuBtn = $('#menu-btn');
  function openMenu() {
    sidebar.classList.add('open'); scrim.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => { const a = $('.nav a[aria-current]', sidebar) || $('.nav a', sidebar); a.focus(); }, 50);
  }
  function closeMenu(restoreFocus = true) {
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open'); scrim.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuBtn.focus();
  }
  menuBtn.addEventListener('click', openMenu);
  scrim.addEventListener('click', () => closeMenu());

  const themeBtn = $('#theme-btn');
  const effectiveTheme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function syncThemeBtn() {
    const dark = effectiveTheme() === 'dark';
    themeBtn.innerHTML = icon(dark ? 'sun' : 'moon');
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('meta[name="theme-color"]').setAttribute('content', dark ? '#0a1120' : '#0b1f3a');
  }
  themeBtn.addEventListener('click', () => {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('maju-theme', next); } catch (e) { /* ignore */ }
    syncThemeBtn();
    toast(next === 'dark' ? 'Dark mode on' : 'Light mode on', next === 'dark' ? 'moon' : 'sun');
  });

  // Command palette
  const palette = $('#palette'), pInput = $('#palette-input'), pList = $('#palette-list');
  const ROUTE_ICONS = { dashboard: 'grid', profile: 'user', courses: 'book', attendance: 'check-square', results: 'chart', datesheet: 'calendar', timetable: 'clock', fees: 'receipt', announcements: 'megaphone' };
  const paletteItems = [
    ...Object.keys(VIEWS).map((r) => ({ label: $('#view-' + r).dataset.title, kind: 'Page', icon: ROUTE_ICONS[r], run: () => { location.hash = '#' + r; } })),
    ...D.courses.map((c) => ({ label: `${c.title} (${c.code})`, kind: 'Course', icon: 'book', run: () => openCourse(c.code) })),
    ...upcomingExams().map((e) => ({ label: `${courseBy(e.code).title} — ${e.kind}, ${fmtDate(e.date)}`, kind: 'Exam', icon: 'calendar', run: () => { location.hash = '#datesheet'; } })),
    { label: 'Toggle dark / light theme', kind: 'Action', icon: 'moon', run: () => themeBtn.click() },
    { label: 'Plan attendance for my lowest course', kind: 'Action', icon: 'zap', run: () => planFor([...D.courses].sort((a, b) => pct(a) - pct(b))[0].code) }
  ];
  let pResults = [], pIndex = 0;
  function renderPalette() {
    const q = pInput.value.trim().toLowerCase();
    pResults = paletteItems.filter((it) => !q || it.label.toLowerCase().includes(q) || it.kind.toLowerCase().includes(q)).slice(0, 12);
    pIndex = Math.min(pIndex, Math.max(0, pResults.length - 1));
    pList.innerHTML = pResults.length
      ? pResults.map((it, i) => `<li role="option" id="pi-${i}" aria-selected="${i === pIndex}" data-pi="${i}">${icon(it.icon)}<span>${esc(it.label)}</span><span class="kind">${it.kind}</span></li>`).join('')
      : '<li class="none" role="option" aria-disabled="true">No results</li>';
    pInput.setAttribute('aria-activedescendant', pResults.length ? 'pi-' + pIndex : '');
    const sel = $('#pi-' + pIndex); if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
  function openPalette() { lastFocus = document.activeElement; pInput.value = ''; pIndex = 0; renderPalette(); palette.showModal(); pInput.focus(); }
  function runPalette(i) { const it = pResults[i]; if (!it) return; palette.close(); it.run(); }
  $('#open-palette').addEventListener('click', openPalette);
  pInput.addEventListener('input', () => { pIndex = 0; renderPalette(); });
  pInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); pIndex = (pIndex + 1) % Math.max(1, pResults.length); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); pIndex = (pIndex - 1 + pResults.length) % Math.max(1, pResults.length); renderPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPalette(pIndex); }
  });
  pList.addEventListener('click', (e) => { const li = e.target.closest('[data-pi]'); if (li) runPalette(Number(li.dataset.pi)); });
  palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });

  /* =================================================
     GLOBAL EVENTS (delegation)
     ================================================= */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    const ds = t.dataset;
    if (ds.course) openCourse(ds.course);
    else if (ds.plan) planFor(ds.plan);
    else if ('closeMenu' in ds) closeMenu();
    else if ('openMenu' in ds) openMenu();
    else if (ds.ics) downloadICS(Number(ds.ics));
    else if (ds.challan) openChallan(ds.challan);
    else if (ds.read) toggleRead(Number(ds.read));
    else if ('dialogClose' in ds) t.closest('dialog').close();
    else if ('print' in ds) window.print();
    else if (ds.scroll) { const c = $('#dash-carousel'); c.scrollBy({ left: Number(ds.scroll) * (c.clientWidth * 0.8), behavior: reduceMotion ? 'auto' : 'smooth' }); }
    else if (ds.cfilter) { courseFilter = ds.cfilter; renderCourses(); refreshIn('#view-courses'); $(`[data-cfilter="${courseFilter}"]`).focus(); }
    else if (ds.efilter) { examFilter = ds.efilter; renderDatesheet(); refreshIn('#view-datesheet'); $(`[data-efilter="${examFilter}"]`).focus(); }
    else if (ds.afilter) { annFilter = ds.afilter; $$('[data-afilter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.afilter === annFilter))); renderAnnList(); }
    else if (ds.rtab) selectResultsTab(Number(ds.rtab));
    else if (ds.day) selectDay(ds.day);
    else if (t.matches('.sidebar a')) closeMenu(false);
  });

  function refreshIn(sel) { const v = $(sel); $$('.reveal', v).forEach((el) => el.classList.add('shown')); v.classList.remove('is-in'); void v.offsetWidth; v.classList.add('is-in'); }
  function selectResultsTab(i) { resultsTab = i; renderResults(); refreshIn('#view-results'); $('#rtab-' + i).focus(); }
  function selectDay(k) { ttDay = k; renderTimetable(); refreshIn('#view-timetable'); $('#dtab-' + k).focus(); }

  // Arrow-key navigation inside tablists
  document.addEventListener('keydown', (e) => {
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const tabs = $$('[role="tab"]', tab.parentElement);
      const i = tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1);
      const nxt = tabs[(i + tabs.length) % tabs.length];
      e.preventDefault(); nxt.click();
    }
    const typing = /input|textarea|select/i.test(document.activeElement.tagName);
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
      if (!palette.open) { e.preventDefault(); openPalette(); }
    }
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeMenu();
  });

  // Close the drawer if the screen grows past the mobile breakpoint
  matchMedia('(min-width: 961px)').addEventListener('change', (m) => { if (m.matches) closeMenu(false); });

  /* ---------------- init ---------------- */
  $('#side-name').textContent = D.student.name;
  $('#side-id').textContent = D.student.id;
  syncThemeBtn();
  syncBadges(false);
  go(location.hash.slice(1) || 'dashboard', false);
})();
