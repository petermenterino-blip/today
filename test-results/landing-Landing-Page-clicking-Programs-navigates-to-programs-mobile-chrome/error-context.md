# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing Page >> clicking Programs navigates to /programs
- Location: e2e\landing.spec.ts:21:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('header').getByRole('link', { name: 'Programs' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - main [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - link "M Mentorino" [ref=e9] [cursor=pointer]:
          - /url: "#/"
          - generic [ref=e11]: M
          - generic [ref=e12]: Mentorino
        - generic [ref=e13]:
          - link "PORTAL" [ref=e14] [cursor=pointer]:
            - /url: "#/auth"
          - button "Open Menu" [ref=e15]:
            - img [ref=e16]
      - generic [ref=e18]:
        - img "Architecture" [ref=e20]
        - generic [ref=e24]:
          - generic [ref=e25]:
            - heading "CONFUSED ABOUT DIRECTION?" [level=1] [ref=e26]:
              - text: CONFUSED
              - text: ABOUT
              - text: DIRECTION?
            - heading "Let’s Figure It Out Together." [level=2] [ref=e28]
          - paragraph [ref=e29]: For college students, recent grads, or anyone stuck choosing their next step. 1-on-1 mentoring with a clear step-by-step plan.
          - generic [ref=e30]:
            - link "START APPLICATION" [ref=e31] [cursor=pointer]:
              - /url: "#/apply"
            - link "EXPLORE SESSIONS" [ref=e32] [cursor=pointer]:
              - /url: "#/consultation"
          - img [ref=e34]
      - generic [ref=e36]:
        - generic [ref=e37]: GUIDANCE PILLARS
        - generic [ref=e39]:
          - generic [ref=e40]: CAREER STRATEGY
          - generic [ref=e41]: ACADEMIC PLANNING
          - generic [ref=e42]: LIFE ARCHITECTURE
          - generic [ref=e43]: PERSONAL GROWTH
          - generic [ref=e44]: DECISION MASTERY
          - generic [ref=e45]: MENTAL FRAMEWORKS
          - generic [ref=e46]: SKILL ACQUISITION
          - generic [ref=e47]: GOAL ALIGNMENT
          - generic [ref=e48]: CAREER STRATEGY
          - generic [ref=e49]: ACADEMIC PLANNING
          - generic [ref=e50]: LIFE ARCHITECTURE
          - generic [ref=e51]: PERSONAL GROWTH
          - generic [ref=e52]: DECISION MASTERY
          - generic [ref=e53]: MENTAL FRAMEWORKS
          - generic [ref=e54]: SKILL ACQUISITION
          - generic [ref=e55]: GOAL ALIGNMENT
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e59]:
            - generic [ref=e62]: The Journey
            - heading "OUR STRATEGIC PROCESS." [level=2] [ref=e63]:
              - text: OUR STRATEGIC
              - text: PROCESS.
          - paragraph [ref=e64]: We've refined a results-driven methodology to ensure every student finds their ideal trajectory through structured introspection and action.
        - generic [ref=e65]:
          - generic [ref=e66]:
            - generic:
              - img
            - generic [ref=e67]:
              - paragraph [ref=e68]: Phase 01
              - heading "Apply" [level=3] [ref=e69]
              - paragraph [ref=e70]: The Intent
              - paragraph [ref=e71]: Complete the 2-minute application. We look for seriousness and readiness for guidance.
          - generic [ref=e72]:
            - generic:
              - img
            - generic [ref=e73]:
              - paragraph [ref=e74]: Phase 02
              - heading "Review" [level=3] [ref=e75]
              - paragraph [ref=e76]: The Audit
              - paragraph [ref=e77]: We review your current goal. Your application is approved within 48 hours.
          - generic [ref=e78]:
            - generic:
              - img
            - generic [ref=e79]:
              - paragraph [ref=e80]: Phase 03
              - heading "Consult" [level=3] [ref=e81]
              - paragraph [ref=e82]: The Clarity
              - paragraph [ref=e83]: A 1-on-1 session to verify goals and identify the exact hurdles in your way.
          - generic [ref=e84]:
            - generic:
              - img
            - generic [ref=e85]:
              - paragraph [ref=e86]: Phase 04
              - heading "Roadmap" [level=3] [ref=e87]
              - paragraph [ref=e88]: The Growth
              - paragraph [ref=e89]: Get your custom trajectory plan. Weekly audits, tasks, and real-time support.
      - generic [ref=e91]:
        - generic [ref=e93]:
          - img "Peter Mannarino" [ref=e94]
          - generic [ref=e96]:
            - generic [ref=e99]: Lead Strategist
            - heading "Mentorino" [level=3] [ref=e100]
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e105]: Since 2010
            - heading "GUIDANCE FROM EXPERIENCE." [level=1] [ref=e106]:
              - text: GUIDANCE FROM
              - text: EXPERIENCE.
          - generic [ref=e107]:
            - paragraph [ref=e108]: Leveraging over 25 years of professional experience, I have been guiding college students, recent grads, and people in the game of life for 15 years.
            - paragraph [ref=e109]: I help people make better decisions through calm, structured, and practical guidance — not pressure or motivation talk.
          - generic [ref=e110]:
            - generic [ref=e111]:
              - paragraph [ref=e112]: Career
              - paragraph [ref=e113]: Strategic Paths
            - generic [ref=e114]:
              - paragraph [ref=e115]: Life
              - paragraph [ref=e116]: Decision Mastery
            - generic [ref=e117]:
              - paragraph [ref=e118]: Academic
              - paragraph [ref=e119]: Future Clarity
            - generic [ref=e120]:
              - paragraph [ref=e121]: Growth
              - paragraph [ref=e122]: Discipline Systems
          - link "Read the backstory" [ref=e123] [cursor=pointer]:
            - /url: "#/about"
            - text: Read the backstory
            - img [ref=e124]
      - generic [ref=e127]:
        - generic [ref=e128]:
          - heading "MOST PEOPLE FEEL LOST." [level=2] [ref=e130]:
            - text: MOST PEOPLE
            - text: FEEL LOST.
          - paragraph [ref=e131]: It's normal, but it's a guidance gap. You might be unsure which career path to choose, feeling family pressure, or stuck without direction.
          - list [ref=e132]:
            - listitem [ref=e133]: Unsure which career path to choose
            - listitem [ref=e135]: Confused about education path
            - listitem [ref=e137]: Feeling pressure from family & society
            - listitem [ref=e139]: Overthinking your future
        - generic [ref=e141]:
          - heading "PROGRAMS THAT BRING CLARITY." [level=2] [ref=e143]:
            - text: PROGRAMS THAT
            - text: BRING CLARITY.
          - paragraph [ref=e144]: No hype. No shortcuts. Just clear guidance to help you understand yourself and move forward with a realistic plan.
          - list [ref=e145]:
            - listitem [ref=e146]:
              - img [ref=e147]
              - text: Understand yourself better
            - listitem [ref=e150]:
              - img [ref=e151]
              - text: Make confident decisions
            - listitem [ref=e154]:
              - img [ref=e155]
              - text: Build a realistic plan
            - listitem [ref=e158]:
              - img [ref=e159]
              - text: Reduce stress and confusion
      - generic [ref=e163]:
        - generic [ref=e164]:
          - heading "THE 3 PILLARS." [level=1] [ref=e165]
          - paragraph [ref=e166]: Focused guidance for every aspect of your growth.
        - generic [ref=e167]:
          - generic [ref=e169]:
            - img [ref=e171]
            - generic [ref=e174]:
              - heading "Life" [level=2] [ref=e175]
              - paragraph [ref=e176]: Decision clarity, confidence, stress management, and personal direction.
          - generic [ref=e178]:
            - img [ref=e180]
            - generic [ref=e183]:
              - heading "Schooling" [level=2] [ref=e184]
              - paragraph [ref=e185]: Education choices, course decisions, study planning, and academic confidence.
          - generic [ref=e187]:
            - img [ref=e189]
            - generic [ref=e192]:
              - heading "Career" [level=2] [ref=e193]
              - paragraph [ref=e194]: Career clarity, skill roadmap, job preparation, and long-term planning.
      - generic [ref=e196]:
        - generic [ref=e197]:
          - text: CONDUCTED EVENTS
          - heading "SEE COHORTS IN ACTION." [level=2] [ref=e198]:
            - text: SEE COHORTS
            - text: IN ACTION.
          - paragraph [ref=e199]: From CompTIA celebration meetups and career bootcamps to hybrid virtual roundtables, explore how our students elevate their professional presence.
          - link "Browse Event Gallery" [ref=e201] [cursor=pointer]:
            - /url: "#/gallery"
            - generic [ref=e202]: Browse Event Gallery
            - img [ref=e203]
        - generic [ref=e207]:
          - generic [ref=e208]:
            - img "CompTIA celebration meetup" [ref=e210]
            - img "Career bootcamp session" [ref=e212]
          - generic [ref=e213]:
            - img "Hybrid virtual roundtable" [ref=e215]
            - img "Student professional presence event" [ref=e217]
      - generic [ref=e218]:
        - generic [ref=e219]:
          - generic [ref=e222]: The Sessions
          - heading "STRATEGIC CONSULTATION." [level=1] [ref=e224]
          - paragraph [ref=e225]: High-intensity, hyper-focused coaching calls. We strip away the theories and solve real bottlenecks with practical logic.
        - generic [ref=e226]:
          - generic [ref=e227]:
            - img [ref=e229]
            - generic [ref=e232]:
              - heading "1:1 Program Intro Call" [level=3] [ref=e233]
              - generic [ref=e234]: Free
              - paragraph [ref=e235]: Not sure where to start? Book a no-pressure introductory call. We will examine where you are, where you want to go, and whether our cohort is a perfect match — zero commitment, total clarity.
            - list [ref=e236]:
              - listitem [ref=e237]:
                - img [ref=e238]
                - generic [ref=e241]: 30-minute personal discovery call
              - listitem [ref=e242]:
                - img [ref=e243]
                - generic [ref=e246]: Custom trajectory analysis
              - listitem [ref=e247]:
                - img [ref=e248]
                - generic [ref=e251]: Zero pressure - alignment check only
            - link "Book Free Call" [ref=e253] [cursor=pointer]:
              - /url: "#/book-call?type=intro"
          - generic [ref=e254]:
            - img [ref=e256]
            - img [ref=e259]
            - generic [ref=e261]:
              - heading "Rapid Response Call" [level=3] [ref=e262]
              - generic [ref=e263]: $25 Per Session
              - paragraph [ref=e264]: Facing an immediate tactical bottleneck? Book a high-intensity session to resolve critical certification roadblocks, career decisions, study planning crises, or life trajectory doubts with Peter.
            - list [ref=e265]:
              - listitem [ref=e266]:
                - img [ref=e267]
                - generic [ref=e269]: 60-minute 1:1 strategy session
              - listitem [ref=e270]:
                - img [ref=e271]
                - generic [ref=e273]: Custom-built step-by-step action PDF
              - listitem [ref=e274]:
                - img [ref=e275]
                - generic [ref=e277]: Follow-up email feedback loop
              - listitem [ref=e278]:
                - img [ref=e279]
                - generic [ref=e281]: Priority scheduling support
            - link "Schedule Response Call" [ref=e283] [cursor=pointer]:
              - /url: "#/book-call?type=rapid"
        - generic [ref=e284]:
          - heading "WHAT IS INCLUDED IN EVERY CALL" [level=2] [ref=e285]
          - generic [ref=e286]:
            - generic [ref=e287]:
              - img [ref=e289]
              - generic [ref=e292]:
                - heading "Secure Video Meeting" [level=4] [ref=e293]
                - paragraph [ref=e294]: Private, end-to-end encrypted 1:1 video session with Peter.
            - generic [ref=e295]:
              - img [ref=e297]
              - generic [ref=e299]:
                - heading "Trajectory Blueprint" [level=4] [ref=e300]
                - paragraph [ref=e301]: A custom step-by-step checklist of what to execute next.
            - generic [ref=e302]:
              - img [ref=e304]
              - generic [ref=e306]:
                - heading "Post-Call Email Support" [level=4] [ref=e307]
                - paragraph [ref=e308]: Access for up to 2 direct clarification questions after.
            - generic [ref=e309]:
              - img [ref=e311]
              - generic [ref=e313]:
                - heading "Resource Checklist" [level=4] [ref=e314]
                - paragraph [ref=e315]: Links to specific guides, tools, and downloads.
      - generic [ref=e317]:
        - generic [ref=e318]:
          - heading "SUCCESS STORIES." [level=2] [ref=e319]
          - paragraph [ref=e320]: Real outcomes from our dedicated mentees.
        - generic [ref=e321]:
          - generic [ref=e322]:
            - paragraph [ref=e323]: "\"Working with Peter has had a huge impact on my growth. He has been an amazing role model and mentor, pushing me to improve while trusting me with real responsibilities. I’m now on track to obtain my CompTIA A+ certification and I'm currently interviewing for IT positions all before my graduation in May 2026. None of this would have been possible without his mentorship.\""
            - generic [ref=e324]:
              - generic [ref=e325]: M
              - generic [ref=e326]:
                - paragraph [ref=e327]: Mauricio L.
                - paragraph [ref=e328]: Information Technology Major
          - generic [ref=e329]:
            - paragraph [ref=e330]: "\"Peter has played a key role in helping me bring structure and focus to my career. Under his mentorship, I’ve developed the habit of setting three specific goals each day, which has significantly improved my productivity and overall direction. Previously, I approached challenges without a clear plan, often taking on tasks reactively.\""
            - generic [ref=e331]:
              - generic [ref=e332]: D
              - generic [ref=e333]:
                - paragraph [ref=e334]: David C.
                - paragraph [ref=e335]: Cybersecurity Professional
          - generic [ref=e336]:
            - paragraph [ref=e337]: "\"Peter’s mentorship gave me clarity and direction when I needed it most. Over the past couple of years, I’ve grown not just technically, but in how I think, plan, and approach challenges. His guidance helped me stay focused, build discipline, and make smarter decisions about my future. It's pushed me to level up my career.\""
            - generic [ref=e338]:
              - generic [ref=e339]: M
              - generic [ref=e340]:
                - paragraph [ref=e341]: Mohamed R.
                - paragraph [ref=e342]: MS Cybersecurity | PC Support Specialist
          - generic [ref=e343]:
            - paragraph [ref=e344]: "\"Pete has supported me in countless meaningful ways. Whether it has been through direct instruction, sharing his resources, or pointing me toward the exact tools and information I need to reach my goals. He consistently demonstrates a genuine investment in my success, checking in regularly to see how I’m progressing and making sure I stay on track.\""
            - generic [ref=e345]:
              - generic [ref=e346]: C
              - generic [ref=e347]:
                - paragraph [ref=e348]: Connor C.
                - paragraph [ref=e349]: IT Graduate | Future Masters CS
      - generic [ref=e350]:
        - generic [ref=e351]:
          - generic [ref=e354]: The Answers
          - heading "COMMON QUESTIONS." [level=1] [ref=e356]
          - paragraph [ref=e357]: Everything you need to know about starting your coaching journey, booking consultation calls, and unlocking consistent direction.
        - generic [ref=e358]:
          - generic [ref=e359]:
            - heading "General Program" [level=2] [ref=e360]
            - generic [ref=e361]:
              - button "Is this program only for IT people?" [ref=e363]:
                - generic [ref=e364]: Is this program only for IT people?
                - img [ref=e366]
              - button "Do I need to know my goals before applying?" [ref=e368]:
                - generic [ref=e369]: Do I need to know my goals before applying?
                - img [ref=e371]
              - button "Do you accept everyone who applies?" [ref=e373]:
                - generic [ref=e374]: Do you accept everyone who applies?
                - img [ref=e376]
          - generic [ref=e377]:
            - heading "Consultations & Coaching" [level=2] [ref=e378]
            - generic [ref=e379]:
              - button "Is this mentoring paid?" [ref=e381]:
                - generic [ref=e382]: Is this mentoring paid?
                - img [ref=e384]
              - button "How are mentoring sessions conducted?" [ref=e386]:
                - generic [ref=e387]: How are mentoring sessions conducted?
                - img [ref=e389]
              - button "What is the Rapid Response call?" [ref=e391]:
                - generic [ref=e392]: What is the Rapid Response call?
                - img [ref=e394]
          - generic [ref=e395]:
            - heading "Methodology & Platform" [level=2] [ref=e396]
            - generic [ref=e397]:
              - button "What is the 3-Daily-Goals system?" [ref=e399]:
                - generic [ref=e400]: What is the 3-Daily-Goals system?
                - img [ref=e402]
              - button "Can I access resources on my dashboard?" [ref=e404]:
                - generic [ref=e405]: Can I access resources on my dashboard?
                - img [ref=e407]
      - generic [ref=e409]:
        - generic [ref=e410]:
          - generic [ref=e413]: Get In Touch
          - heading "CONTACT PETER." [level=1] [ref=e415]
          - paragraph [ref=e416]: Have a question about the cohorts, pricing, or custom options? Drop a message and Peter will get back to you within 24 hours.
        - generic [ref=e417]:
          - generic [ref=e418]:
            - generic [ref=e419]:
              - generic [ref=e420]:
                - heading "Direct Channels" [level=3] [ref=e421]
                - paragraph [ref=e422]: Skip the contact form if you prefer direct corporate messaging channels.
              - generic [ref=e423]:
                - generic [ref=e424]:
                  - img [ref=e426]
                  - generic [ref=e429]:
                    - paragraph [ref=e430]: Email Us
                    - paragraph [ref=e431]: peter.mannarino@coaching.com
                - generic [ref=e432]:
                  - img [ref=e434]
                  - generic [ref=e436]:
                    - paragraph [ref=e437]: Call/Text
                    - paragraph [ref=e438]: +1 (201) 555-0192
                - generic [ref=e439]:
                  - img [ref=e441]
                  - generic [ref=e444]:
                    - paragraph [ref=e445]: Location
                    - paragraph [ref=e446]: New York Metropolitan Area
            - generic [ref=e448]:
              - img [ref=e449]
              - generic [ref=e451]: Strict Confidentiality Guaranteed
          - generic [ref=e453]:
            - generic [ref=e454]:
              - generic [ref=e455]:
                - text: Full Name *
                - textbox "e.g. John Doe" [ref=e456]
              - generic [ref=e457]:
                - text: Email Address *
                - textbox "e.g. john@example.com" [ref=e458]
            - generic [ref=e459]:
              - generic [ref=e460]:
                - text: Your Discipline / Area
                - combobox [ref=e461]:
                  - option "IT & Tech" [selected]
                  - option "Cybersecurity"
                  - option "Business & Finance"
                  - option "Liberal Arts"
                  - option "Undecided"
                  - option "Other"
              - generic [ref=e462]:
                - text: Subject / Goal
                - combobox [ref=e463]:
                  - option "Career Guidance" [selected]
                  - option "Schooling Advice"
                  - option "Life Strategy"
                  - option "General Inquiry"
            - generic [ref=e464]:
              - text: Your Message *
              - textbox "Tell Peter about where you are currently stuck, and what you'd like to achieve..." [ref=e465]
            - button "Send Message" [ref=e466]:
              - generic [ref=e467]: Send Message
              - img [ref=e468]
      - generic [ref=e472]:
        - heading "READY FOR CLARITY?" [level=2] [ref=e473]
        - paragraph [ref=e474]: Take control of your trajectory today. Submit an application for structured long-term cohorts or schedule a strategy consultation call with Peter.
        - generic [ref=e475]:
          - link "Apply for Programs" [ref=e476] [cursor=pointer]:
            - /url: "#/apply"
          - link "Book Strategy Session" [ref=e477] [cursor=pointer]:
            - /url: "#/consultation"
      - generic [ref=e479]:
        - generic [ref=e480]:
          - generic [ref=e481]:
            - generic [ref=e482]:
              - generic [ref=e483]: M
              - generic [ref=e484]: Mentorino.
            - paragraph [ref=e485]: Clarity in career, schooling, and life. We build the trajectory you were meant to follow.
          - generic [ref=e486]:
            - heading "Navigate" [level=4] [ref=e487]
            - list [ref=e488]:
              - listitem [ref=e489]:
                - link "About Mentor" [ref=e490] [cursor=pointer]:
                  - /url: "#/about"
              - listitem [ref=e491]:
                - link "Programs" [ref=e492] [cursor=pointer]:
                  - /url: "#/programs"
              - listitem [ref=e493]:
                - link "Consultation" [ref=e494] [cursor=pointer]:
                  - /url: "#/consultation"
              - listitem [ref=e495]:
                - link "FAQ" [ref=e496] [cursor=pointer]:
                  - /url: "#/faq"
          - generic [ref=e497]:
            - heading "Connect" [level=4] [ref=e498]
            - list [ref=e499]:
              - listitem [ref=e500]:
                - link "Contact" [ref=e501] [cursor=pointer]:
                  - /url: "#/contact"
              - listitem [ref=e502]:
                - link "Gallery" [ref=e503] [cursor=pointer]:
                  - /url: "#/gallery"
              - listitem [ref=e504]:
                - link "MEMBERS PORTAL" [ref=e505] [cursor=pointer]:
                  - /url: "#/auth"
        - paragraph [ref=e507]: © 2026 MEntorino ALL RIGHTS RESERVED
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
> 22 |     await page.locator('header').getByRole('link', { name: 'Programs' }).click();
     |                                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  38 |     await expect(footer.getByText(/Mentorino Trajectory Coaching/i)).toBeVisible();
  39 |     await expect(footer.getByText(/Mentor Portal/i)).toBeVisible();
  40 |   });
  41 | });
  42 | 
```