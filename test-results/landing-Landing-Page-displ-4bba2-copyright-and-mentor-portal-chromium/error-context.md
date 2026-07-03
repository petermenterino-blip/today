# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing Page >> displays footer with copyright and mentor portal
- Location: e2e\landing.spec.ts:36:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('footer').getByText(/Mentorino Trajectory Coaching/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('footer').getByText(/Mentorino Trajectory Coaching/i)

```

```yaml
- region "Notifications alt+T"
- main:
  - link "M Mentorino":
    - /url: "#/"
  - navigation:
    - link "About Mentor":
      - /url: "#/about"
    - link "Programs":
      - /url: "#/programs"
    - link "Consultation":
      - /url: "#/consultation"
    - link "FAQ":
      - /url: "#/faq"
    - link "Contact":
      - /url: "#/contact"
    - link "Gallery":
      - /url: "#/gallery"
    - link "MEMBERS PORTAL":
      - /url: "#/auth"
  - img "Architecture"
  - heading "CONFUSED ABOUT DIRECTION?" [level=1]
  - heading "Let’s Figure It Out Together." [level=2]
  - paragraph: For college students, recent grads, or anyone stuck choosing their next step. 1-on-1 mentoring with a clear step-by-step plan.
  - link "START APPLICATION":
    - /url: "#/apply"
  - link "EXPLORE SESSIONS":
    - /url: "#/consultation"
  - img
  - text: GUIDANCE PILLARS CAREER STRATEGY ACADEMIC PLANNING LIFE ARCHITECTURE PERSONAL GROWTH DECISION MASTERY MENTAL FRAMEWORKS SKILL ACQUISITION GOAL ALIGNMENT CAREER STRATEGY ACADEMIC PLANNING LIFE ARCHITECTURE PERSONAL GROWTH DECISION MASTERY MENTAL FRAMEWORKS SKILL ACQUISITION GOAL ALIGNMENT The Journey
  - heading "OUR STRATEGIC PROCESS." [level=2]
  - paragraph: We've refined a results-driven methodology to ensure every student finds their ideal trajectory through structured introspection and action.
  - img
  - paragraph: Phase 01
  - heading "Apply" [level=3]
  - paragraph: The Intent
  - paragraph: Complete the 2-minute application. We look for seriousness and readiness for guidance.
  - img
  - paragraph: Phase 02
  - heading "Review" [level=3]
  - paragraph: The Audit
  - paragraph: We review your current goal. Your application is approved within 48 hours.
  - img
  - paragraph: Phase 03
  - heading "Consult" [level=3]
  - paragraph: The Clarity
  - paragraph: A 1-on-1 session to verify goals and identify the exact hurdles in your way.
  - img
  - paragraph: Phase 04
  - heading "Roadmap" [level=3]
  - paragraph: The Growth
  - paragraph: Get your custom trajectory plan. Weekly audits, tasks, and real-time support.
  - img "Peter Mannarino"
  - text: Lead Strategist
  - heading "Mentorino" [level=3]
  - paragraph: 1k+
  - paragraph: People Guided
  - text: Since 2010
  - heading "GUIDANCE FROM EXPERIENCE." [level=1]
  - paragraph: Leveraging over 25 years of professional experience, I have been guiding college students, recent grads, and people in the game of life for 15 years.
  - paragraph: I help people make better decisions through calm, structured, and practical guidance — not pressure or motivation talk.
  - paragraph: Career
  - paragraph: Strategic Paths
  - paragraph: Life
  - paragraph: Decision Mastery
  - paragraph: Academic
  - paragraph: Future Clarity
  - paragraph: Growth
  - paragraph: Discipline Systems
  - link "Read the backstory":
    - /url: "#/about"
    - text: Read the backstory
    - img
  - heading "MOST PEOPLE FEEL LOST." [level=2]
  - paragraph: It's normal, but it's a guidance gap. You might be unsure which career path to choose, feeling family pressure, or stuck without direction.
  - list:
    - listitem: Unsure which career path to choose
    - listitem: Confused about education path
    - listitem: Feeling pressure from family & society
    - listitem: Overthinking your future
  - heading "PROGRAMS THAT BRING CLARITY." [level=2]
  - paragraph: No hype. No shortcuts. Just clear guidance to help you understand yourself and move forward with a realistic plan.
  - list:
    - listitem:
      - img
      - text: Understand yourself better
    - listitem:
      - img
      - text: Make confident decisions
    - listitem:
      - img
      - text: Build a realistic plan
    - listitem:
      - img
      - text: Reduce stress and confusion
  - heading "THE 3 PILLARS." [level=1]
  - paragraph: Focused guidance for every aspect of your growth.
  - img
  - heading "Life" [level=2]
  - paragraph: Decision clarity, confidence, stress management, and personal direction.
  - img
  - heading "Schooling" [level=2]
  - paragraph: Education choices, course decisions, study planning, and academic confidence.
  - img
  - heading "Career" [level=2]
  - paragraph: Career clarity, skill roadmap, job preparation, and long-term planning.
  - text: CONDUCTED EVENTS
  - heading "SEE COHORTS IN ACTION." [level=2]
  - paragraph: From CompTIA celebration meetups and career bootcamps to hybrid virtual roundtables, explore how our students elevate their professional presence.
  - link "Browse Event Gallery":
    - /url: "#/gallery"
    - text: Browse Event Gallery
    - img
  - img "CompTIA celebration meetup"
  - img "Career bootcamp session"
  - img "Hybrid virtual roundtable"
  - img "Student professional presence event"
  - text: The Sessions
  - heading "STRATEGIC CONSULTATION." [level=1]
  - paragraph: High-intensity, hyper-focused coaching calls. We strip away the theories and solve real bottlenecks with practical logic.
  - img
  - heading "1:1 Program Intro Call" [level=3]
  - text: Free
  - paragraph: Not sure where to start? Book a no-pressure introductory call. We will examine where you are, where you want to go, and whether our cohort is a perfect match — zero commitment, total clarity.
  - list:
    - listitem:
      - img
      - text: 30-minute personal discovery call
    - listitem:
      - img
      - text: Custom trajectory analysis
    - listitem:
      - img
      - text: Zero pressure - alignment check only
  - link "Book Free Call":
    - /url: "#/book-call?type=intro"
  - img
  - img
  - heading "Rapid Response Call" [level=3]
  - text: $25 Per Session
  - paragraph: Facing an immediate tactical bottleneck? Book a high-intensity session to resolve critical certification roadblocks, career decisions, study planning crises, or life trajectory doubts with Peter.
  - list:
    - listitem:
      - img
      - text: 60-minute 1:1 strategy session
    - listitem:
      - img
      - text: Custom-built step-by-step action PDF
    - listitem:
      - img
      - text: Follow-up email feedback loop
    - listitem:
      - img
      - text: Priority scheduling support
  - link "Schedule Response Call":
    - /url: "#/book-call?type=rapid"
  - heading "WHAT IS INCLUDED IN EVERY CALL" [level=2]
  - img
  - heading "Secure Video Meeting" [level=4]
  - paragraph: Private, end-to-end encrypted 1:1 video session with Peter.
  - img
  - heading "Trajectory Blueprint" [level=4]
  - paragraph: A custom step-by-step checklist of what to execute next.
  - img
  - heading "Post-Call Email Support" [level=4]
  - paragraph: Access for up to 2 direct clarification questions after.
  - img
  - heading "Resource Checklist" [level=4]
  - paragraph: Links to specific guides, tools, and downloads.
  - heading "SUCCESS STORIES." [level=2]
  - paragraph: Real outcomes from our dedicated mentees.
  - paragraph: "\"Working with Peter has had a huge impact on my growth. He has been an amazing role model and mentor, pushing me to improve while trusting me with real responsibilities. I’m now on track to obtain my CompTIA A+ certification and I'm currently interviewing for IT positions all before my graduation in May 2026. None of this would have been possible without his mentorship.\""
  - text: M
  - paragraph: Mauricio L.
  - paragraph: Information Technology Major
  - paragraph: "\"Peter has played a key role in helping me bring structure and focus to my career. Under his mentorship, I’ve developed the habit of setting three specific goals each day, which has significantly improved my productivity and overall direction. Previously, I approached challenges without a clear plan, often taking on tasks reactively.\""
  - text: D
  - paragraph: David C.
  - paragraph: Cybersecurity Professional
  - paragraph: "\"Peter’s mentorship gave me clarity and direction when I needed it most. Over the past couple of years, I’ve grown not just technically, but in how I think, plan, and approach challenges. His guidance helped me stay focused, build discipline, and make smarter decisions about my future. It's pushed me to level up my career.\""
  - text: M
  - paragraph: Mohamed R.
  - paragraph: MS Cybersecurity | PC Support Specialist
  - paragraph: "\"Pete has supported me in countless meaningful ways. Whether it has been through direct instruction, sharing his resources, or pointing me toward the exact tools and information I need to reach my goals. He consistently demonstrates a genuine investment in my success, checking in regularly to see how I’m progressing and making sure I stay on track.\""
  - text: C
  - paragraph: Connor C.
  - paragraph: IT Graduate | Future Masters CS
  - text: The Answers
  - heading "COMMON QUESTIONS." [level=1]
  - paragraph: Everything you need to know about starting your coaching journey, booking consultation calls, and unlocking consistent direction.
  - heading "General Program" [level=2]
  - button "Is this program only for IT people?":
    - text: Is this program only for IT people?
    - img
  - button "Do I need to know my goals before applying?":
    - text: Do I need to know my goals before applying?
    - img
  - button "Do you accept everyone who applies?":
    - text: Do you accept everyone who applies?
    - img
  - heading "Consultations & Coaching" [level=2]
  - button "Is this mentoring paid?":
    - text: Is this mentoring paid?
    - img
  - button "How are mentoring sessions conducted?":
    - text: How are mentoring sessions conducted?
    - img
  - button "What is the Rapid Response call?":
    - text: What is the Rapid Response call?
    - img
  - heading "Methodology & Platform" [level=2]
  - button "What is the 3-Daily-Goals system?":
    - text: What is the 3-Daily-Goals system?
    - img
  - button "Can I access resources on my dashboard?":
    - text: Can I access resources on my dashboard?
    - img
  - text: Get In Touch
  - heading "CONTACT PETER." [level=1]
  - paragraph: Have a question about the cohorts, pricing, or custom options? Drop a message and Peter will get back to you within 24 hours.
  - heading "Direct Channels" [level=3]
  - paragraph: Skip the contact form if you prefer direct corporate messaging channels.
  - img
  - paragraph: Email Us
  - paragraph: peter.mannarino@coaching.com
  - img
  - paragraph: Call/Text
  - paragraph: +1 (201) 555-0192
  - img
  - paragraph: Location
  - paragraph: New York Metropolitan Area
  - img
  - text: Strict Confidentiality Guaranteed Full Name *
  - textbox "e.g. John Doe"
  - text: Email Address *
  - textbox "e.g. john@example.com"
  - text: Your Discipline / Area
  - combobox:
    - option "IT & Tech" [selected]
    - option "Cybersecurity"
    - option "Business & Finance"
    - option "Liberal Arts"
    - option "Undecided"
    - option "Other"
  - text: Subject / Goal
  - combobox:
    - option "Career Guidance" [selected]
    - option "Schooling Advice"
    - option "Life Strategy"
    - option "General Inquiry"
  - text: Your Message *
  - textbox "Tell Peter about where you are currently stuck, and what you'd like to achieve..."
  - button "Send Message":
    - text: Send Message
    - img
  - heading "READY FOR CLARITY?" [level=2]
  - paragraph: Take control of your trajectory today. Submit an application for structured long-term cohorts or schedule a strategy consultation call with Peter.
  - link "Apply for Programs":
    - /url: "#/apply"
  - link "Book Strategy Session":
    - /url: "#/consultation"
  - text: M Mentorino.
  - paragraph: Clarity in career, schooling, and life. We build the trajectory you were meant to follow.
  - heading "Navigate" [level=4]
  - list:
    - listitem:
      - link "About Mentor":
        - /url: "#/about"
    - listitem:
      - link "Programs":
        - /url: "#/programs"
    - listitem:
      - link "Consultation":
        - /url: "#/consultation"
    - listitem:
      - link "FAQ":
        - /url: "#/faq"
  - heading "Connect" [level=4]
  - list:
    - listitem:
      - link "Contact":
        - /url: "#/contact"
    - listitem:
      - link "Gallery":
        - /url: "#/gallery"
    - listitem:
      - link "MEMBERS PORTAL":
        - /url: "#/auth"
  - paragraph: © 2026 MEntorino ALL RIGHTS RESERVED
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing Page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |   });
  7  | 
  8  |   test('displays brand name and navigation', async ({ page }) => {
  9  |     await expect(page.getByText('Mentorino').first()).toBeVisible();
  10 |     await expect(page.getByRole('link', { name: 'MEMBERS PORTAL' })).toBeVisible();
  11 |   });
  12 | 
  13 |   test('navigation links are accessible in header', async ({ page }) => {
  14 |     const nav = page.locator('header');
  15 |     const navLinks = ['About Mentor', 'Programs', 'Consultation', 'FAQ', 'Contact', 'Gallery'];
  16 |     for (const link of navLinks) {
  17 |       await expect(nav.getByRole('link', { name: link })).toBeVisible();
  18 |     }
  19 |   });
  20 | 
  21 |   test('clicking Programs navigates to /programs', async ({ page }) => {
  22 |     await page.locator('header').getByRole('link', { name: 'Programs' }).click();
  23 |     await expect(page).toHaveURL(/#\/programs/);
  24 |   });
  25 | 
  26 |   test('clicking Members Portal navigates to auth page', async ({ page }) => {
  27 |     await page.getByRole('link', { name: 'MEMBERS PORTAL' }).click();
  28 |     await expect(page).toHaveURL(/#\/auth/);
  29 |   });
  30 | 
  31 |   test('hero section has CTA to apply', async ({ page }) => {
  32 |     const applyLink = page.getByRole('link', { name: /apply/i });
  33 |     await expect(applyLink.first()).toBeVisible();
  34 |   });
  35 | 
  36 |   test('displays footer with copyright and mentor portal', async ({ page }) => {
  37 |     const footer = page.locator('footer');
> 38 |     await expect(footer.getByText(/Mentorino Trajectory Coaching/i)).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
  39 |     await expect(footer.getByText(/Mentor Portal/i)).toBeVisible();
  40 |   });
  41 | });
  42 | 
```