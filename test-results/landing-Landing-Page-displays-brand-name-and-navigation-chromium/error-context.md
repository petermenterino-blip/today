# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing Page >> displays brand name and navigation
- Location: e2e\landing.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'MEMBERS PORTAL' })
Expected: visible
Error: strict mode violation: getByRole('link', { name: 'MEMBERS PORTAL' }) resolved to 2 elements:
    1) <a href="#/auth" data-discover="true" class="btn-compact bg-black text-white px-6 py-2.5 text-[9px] tracking-widest font-black uppercase rounded-full">MEMBERS PORTAL</a> aka getByRole('navigation').getByRole('link', { name: 'MEMBERS PORTAL' })
    2) <a href="#/auth" data-discover="true" class="text-slate-500 hover:text-black transition-colors text-xs sm:text-sm font-medium">MEMBERS PORTAL</a> aka locator('footer').getByRole('link', { name: 'MEMBERS PORTAL' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'MEMBERS PORTAL' })

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
        - navigation [ref=e13]:
          - link "About Mentor" [ref=e14] [cursor=pointer]:
            - /url: "#/about"
          - link "Programs" [ref=e15] [cursor=pointer]:
            - /url: "#/programs"
          - link "Consultation" [ref=e16] [cursor=pointer]:
            - /url: "#/consultation"
          - link "FAQ" [ref=e17] [cursor=pointer]:
            - /url: "#/faq"
          - link "Contact" [ref=e18] [cursor=pointer]:
            - /url: "#/contact"
          - link "Gallery" [ref=e19] [cursor=pointer]:
            - /url: "#/gallery"
          - link "MEMBERS PORTAL" [ref=e20] [cursor=pointer]:
            - /url: "#/auth"
      - generic [ref=e22]:
        - img "Architecture" [ref=e24]
        - generic [ref=e28]:
          - generic [ref=e29]:
            - heading "CONFUSED ABOUT DIRECTION?" [level=1] [ref=e30]:
              - text: CONFUSED
              - text: ABOUT
              - text: DIRECTION?
            - heading "Let’s Figure It Out Together." [level=2] [ref=e32]
          - paragraph [ref=e33]: For college students, recent grads, or anyone stuck choosing their next step. 1-on-1 mentoring with a clear step-by-step plan.
          - generic [ref=e34]:
            - link "START APPLICATION" [ref=e35] [cursor=pointer]:
              - /url: "#/apply"
            - link "EXPLORE SESSIONS" [ref=e36] [cursor=pointer]:
              - /url: "#/consultation"
          - img [ref=e38]
      - generic [ref=e40]:
        - generic [ref=e41]: GUIDANCE PILLARS
        - generic [ref=e43]:
          - generic [ref=e44]: CAREER STRATEGY
          - generic [ref=e45]: ACADEMIC PLANNING
          - generic [ref=e46]: LIFE ARCHITECTURE
          - generic [ref=e47]: PERSONAL GROWTH
          - generic [ref=e48]: DECISION MASTERY
          - generic [ref=e49]: MENTAL FRAMEWORKS
          - generic [ref=e50]: SKILL ACQUISITION
          - generic [ref=e51]: GOAL ALIGNMENT
          - generic [ref=e52]: CAREER STRATEGY
          - generic [ref=e53]: ACADEMIC PLANNING
          - generic [ref=e54]: LIFE ARCHITECTURE
          - generic [ref=e55]: PERSONAL GROWTH
          - generic [ref=e56]: DECISION MASTERY
          - generic [ref=e57]: MENTAL FRAMEWORKS
          - generic [ref=e58]: SKILL ACQUISITION
          - generic [ref=e59]: GOAL ALIGNMENT
      - generic [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e66]: The Journey
            - heading "OUR STRATEGIC PROCESS." [level=2] [ref=e67]:
              - text: OUR STRATEGIC
              - text: PROCESS.
          - paragraph [ref=e68]: We've refined a results-driven methodology to ensure every student finds their ideal trajectory through structured introspection and action.
        - generic [ref=e69]:
          - generic [ref=e71]:
            - generic:
              - img
            - generic [ref=e72]:
              - paragraph [ref=e73]: Phase 01
              - heading "Apply" [level=3] [ref=e74]
              - paragraph [ref=e75]: The Intent
              - paragraph [ref=e76]: Complete the 2-minute application. We look for seriousness and readiness for guidance.
          - generic [ref=e77]:
            - generic:
              - img
            - generic [ref=e78]:
              - paragraph [ref=e79]: Phase 02
              - heading "Review" [level=3] [ref=e80]
              - paragraph [ref=e81]: The Audit
              - paragraph [ref=e82]: We review your current goal. Your application is approved within 48 hours.
          - generic [ref=e83]:
            - generic:
              - img
            - generic [ref=e84]:
              - paragraph [ref=e85]: Phase 03
              - heading "Consult" [level=3] [ref=e86]
              - paragraph [ref=e87]: The Clarity
              - paragraph [ref=e88]: A 1-on-1 session to verify goals and identify the exact hurdles in your way.
          - generic [ref=e89]:
            - generic:
              - img
            - generic [ref=e90]:
              - paragraph [ref=e91]: Phase 04
              - heading "Roadmap" [level=3] [ref=e92]
              - paragraph [ref=e93]: The Growth
              - paragraph [ref=e94]: Get your custom trajectory plan. Weekly audits, tasks, and real-time support.
      - generic [ref=e96]:
        - generic [ref=e97]:
          - generic [ref=e98]:
            - img "Peter Mannarino" [ref=e99]
            - generic [ref=e101]:
              - generic [ref=e104]: Lead Strategist
              - heading "Mentorino" [level=3] [ref=e105]
          - generic [ref=e107]:
            - paragraph [ref=e108]: 1k+
            - paragraph [ref=e109]: People Guided
        - generic [ref=e110]:
          - generic [ref=e111]:
            - generic [ref=e114]: Since 2010
            - heading "GUIDANCE FROM EXPERIENCE." [level=1] [ref=e115]:
              - text: GUIDANCE FROM
              - text: EXPERIENCE.
          - generic [ref=e116]:
            - paragraph [ref=e117]: Leveraging over 25 years of professional experience, I have been guiding college students, recent grads, and people in the game of life for 15 years.
            - paragraph [ref=e118]: I help people make better decisions through calm, structured, and practical guidance — not pressure or motivation talk.
          - generic [ref=e119]:
            - generic [ref=e120]:
              - paragraph [ref=e121]: Career
              - paragraph [ref=e122]: Strategic Paths
            - generic [ref=e123]:
              - paragraph [ref=e124]: Life
              - paragraph [ref=e125]: Decision Mastery
            - generic [ref=e126]:
              - paragraph [ref=e127]: Academic
              - paragraph [ref=e128]: Future Clarity
            - generic [ref=e129]:
              - paragraph [ref=e130]: Growth
              - paragraph [ref=e131]: Discipline Systems
          - link "Read the backstory" [ref=e132] [cursor=pointer]:
            - /url: "#/about"
            - text: Read the backstory
            - img [ref=e133]
      - generic [ref=e136]:
        - generic [ref=e137]:
          - heading "MOST PEOPLE FEEL LOST." [level=2] [ref=e139]:
            - text: MOST PEOPLE
            - text: FEEL LOST.
          - paragraph [ref=e140]: It's normal, but it's a guidance gap. You might be unsure which career path to choose, feeling family pressure, or stuck without direction.
          - list [ref=e141]:
            - listitem [ref=e142]: Unsure which career path to choose
            - listitem [ref=e144]: Confused about education path
            - listitem [ref=e146]: Feeling pressure from family & society
            - listitem [ref=e148]: Overthinking your future
        - generic [ref=e150]:
          - heading "PROGRAMS THAT BRING CLARITY." [level=2] [ref=e152]:
            - text: PROGRAMS THAT
            - text: BRING CLARITY.
          - paragraph [ref=e153]: No hype. No shortcuts. Just clear guidance to help you understand yourself and move forward with a realistic plan.
          - list [ref=e154]:
            - listitem [ref=e155]:
              - img [ref=e156]
              - text: Understand yourself better
            - listitem [ref=e159]:
              - img [ref=e160]
              - text: Make confident decisions
            - listitem [ref=e163]:
              - img [ref=e164]
              - text: Build a realistic plan
            - listitem [ref=e167]:
              - img [ref=e168]
              - text: Reduce stress and confusion
      - generic [ref=e172]:
        - generic [ref=e173]:
          - heading "THE 3 PILLARS." [level=1] [ref=e174]
          - paragraph [ref=e175]: Focused guidance for every aspect of your growth.
        - generic [ref=e176]:
          - generic [ref=e178]:
            - img [ref=e180]
            - generic [ref=e183]:
              - heading "Life" [level=2] [ref=e184]
              - paragraph [ref=e185]: Decision clarity, confidence, stress management, and personal direction.
          - generic [ref=e187]:
            - img [ref=e189]
            - generic [ref=e192]:
              - heading "Schooling" [level=2] [ref=e193]
              - paragraph [ref=e194]: Education choices, course decisions, study planning, and academic confidence.
          - generic [ref=e196]:
            - img [ref=e198]
            - generic [ref=e201]:
              - heading "Career" [level=2] [ref=e202]
              - paragraph [ref=e203]: Career clarity, skill roadmap, job preparation, and long-term planning.
      - generic [ref=e205]:
        - generic [ref=e206]:
          - text: CONDUCTED EVENTS
          - heading "SEE COHORTS IN ACTION." [level=2] [ref=e207]:
            - text: SEE COHORTS
            - text: IN ACTION.
          - paragraph [ref=e208]: From CompTIA celebration meetups and career bootcamps to hybrid virtual roundtables, explore how our students elevate their professional presence.
          - link "Browse Event Gallery" [ref=e210] [cursor=pointer]:
            - /url: "#/gallery"
            - generic [ref=e211]: Browse Event Gallery
            - img [ref=e212]
        - generic [ref=e216]:
          - generic [ref=e217]:
            - img "CompTIA celebration meetup" [ref=e219]
            - img "Career bootcamp session" [ref=e221]
          - generic [ref=e222]:
            - img "Hybrid virtual roundtable" [ref=e224]
            - img "Student professional presence event" [ref=e226]
      - generic [ref=e227]:
        - generic [ref=e228]:
          - generic [ref=e231]: The Sessions
          - heading "STRATEGIC CONSULTATION." [level=1] [ref=e233]
          - paragraph [ref=e234]: High-intensity, hyper-focused coaching calls. We strip away the theories and solve real bottlenecks with practical logic.
        - generic [ref=e235]:
          - generic [ref=e236]:
            - img [ref=e238]
            - generic [ref=e241]:
              - heading "1:1 Program Intro Call" [level=3] [ref=e242]
              - generic [ref=e243]: Free
              - paragraph [ref=e244]: Not sure where to start? Book a no-pressure introductory call. We will examine where you are, where you want to go, and whether our cohort is a perfect match — zero commitment, total clarity.
            - list [ref=e245]:
              - listitem [ref=e246]:
                - img [ref=e247]
                - generic [ref=e250]: 30-minute personal discovery call
              - listitem [ref=e251]:
                - img [ref=e252]
                - generic [ref=e255]: Custom trajectory analysis
              - listitem [ref=e256]:
                - img [ref=e257]
                - generic [ref=e260]: Zero pressure - alignment check only
            - link "Book Free Call" [ref=e262] [cursor=pointer]:
              - /url: "#/book-call?type=intro"
          - generic [ref=e263]:
            - img [ref=e265]
            - img [ref=e268]
            - generic [ref=e270]:
              - heading "Rapid Response Call" [level=3] [ref=e271]
              - generic [ref=e272]: $25 Per Session
              - paragraph [ref=e273]: Facing an immediate tactical bottleneck? Book a high-intensity session to resolve critical certification roadblocks, career decisions, study planning crises, or life trajectory doubts with Peter.
            - list [ref=e274]:
              - listitem [ref=e275]:
                - img [ref=e276]
                - generic [ref=e278]: 60-minute 1:1 strategy session
              - listitem [ref=e279]:
                - img [ref=e280]
                - generic [ref=e282]: Custom-built step-by-step action PDF
              - listitem [ref=e283]:
                - img [ref=e284]
                - generic [ref=e286]: Follow-up email feedback loop
              - listitem [ref=e287]:
                - img [ref=e288]
                - generic [ref=e290]: Priority scheduling support
            - link "Schedule Response Call" [ref=e292] [cursor=pointer]:
              - /url: "#/book-call?type=rapid"
        - generic [ref=e293]:
          - heading "WHAT IS INCLUDED IN EVERY CALL" [level=2] [ref=e294]
          - generic [ref=e295]:
            - generic [ref=e296]:
              - img [ref=e298]
              - generic [ref=e301]:
                - heading "Secure Video Meeting" [level=4] [ref=e302]
                - paragraph [ref=e303]: Private, end-to-end encrypted 1:1 video session with Peter.
            - generic [ref=e304]:
              - img [ref=e306]
              - generic [ref=e308]:
                - heading "Trajectory Blueprint" [level=4] [ref=e309]
                - paragraph [ref=e310]: A custom step-by-step checklist of what to execute next.
            - generic [ref=e311]:
              - img [ref=e313]
              - generic [ref=e315]:
                - heading "Post-Call Email Support" [level=4] [ref=e316]
                - paragraph [ref=e317]: Access for up to 2 direct clarification questions after.
            - generic [ref=e318]:
              - img [ref=e320]
              - generic [ref=e322]:
                - heading "Resource Checklist" [level=4] [ref=e323]
                - paragraph [ref=e324]: Links to specific guides, tools, and downloads.
      - generic [ref=e326]:
        - generic [ref=e327]:
          - heading "SUCCESS STORIES." [level=2] [ref=e328]
          - paragraph [ref=e329]: Real outcomes from our dedicated mentees.
        - generic [ref=e330]:
          - generic [ref=e331]:
            - paragraph [ref=e332]: "\"Working with Peter has had a huge impact on my growth. He has been an amazing role model and mentor, pushing me to improve while trusting me with real responsibilities. I’m now on track to obtain my CompTIA A+ certification and I'm currently interviewing for IT positions all before my graduation in May 2026. None of this would have been possible without his mentorship.\""
            - generic [ref=e333]:
              - generic [ref=e334]: M
              - generic [ref=e335]:
                - paragraph [ref=e336]: Mauricio L.
                - paragraph [ref=e337]: Information Technology Major
          - generic [ref=e338]:
            - paragraph [ref=e339]: "\"Peter has played a key role in helping me bring structure and focus to my career. Under his mentorship, I’ve developed the habit of setting three specific goals each day, which has significantly improved my productivity and overall direction. Previously, I approached challenges without a clear plan, often taking on tasks reactively.\""
            - generic [ref=e340]:
              - generic [ref=e341]: D
              - generic [ref=e342]:
                - paragraph [ref=e343]: David C.
                - paragraph [ref=e344]: Cybersecurity Professional
          - generic [ref=e345]:
            - paragraph [ref=e346]: "\"Peter’s mentorship gave me clarity and direction when I needed it most. Over the past couple of years, I’ve grown not just technically, but in how I think, plan, and approach challenges. His guidance helped me stay focused, build discipline, and make smarter decisions about my future. It's pushed me to level up my career.\""
            - generic [ref=e347]:
              - generic [ref=e348]: M
              - generic [ref=e349]:
                - paragraph [ref=e350]: Mohamed R.
                - paragraph [ref=e351]: MS Cybersecurity | PC Support Specialist
          - generic [ref=e352]:
            - paragraph [ref=e353]: "\"Pete has supported me in countless meaningful ways. Whether it has been through direct instruction, sharing his resources, or pointing me toward the exact tools and information I need to reach my goals. He consistently demonstrates a genuine investment in my success, checking in regularly to see how I’m progressing and making sure I stay on track.\""
            - generic [ref=e354]:
              - generic [ref=e355]: C
              - generic [ref=e356]:
                - paragraph [ref=e357]: Connor C.
                - paragraph [ref=e358]: IT Graduate | Future Masters CS
      - generic [ref=e359]:
        - generic [ref=e360]:
          - generic [ref=e363]: The Answers
          - heading "COMMON QUESTIONS." [level=1] [ref=e365]
          - paragraph [ref=e366]: Everything you need to know about starting your coaching journey, booking consultation calls, and unlocking consistent direction.
        - generic [ref=e367]:
          - generic [ref=e368]:
            - heading "General Program" [level=2] [ref=e369]
            - generic [ref=e370]:
              - button "Is this program only for IT people?" [ref=e372]:
                - generic [ref=e373]: Is this program only for IT people?
                - img [ref=e375]
              - button "Do I need to know my goals before applying?" [ref=e377]:
                - generic [ref=e378]: Do I need to know my goals before applying?
                - img [ref=e380]
              - button "Do you accept everyone who applies?" [ref=e382]:
                - generic [ref=e383]: Do you accept everyone who applies?
                - img [ref=e385]
          - generic [ref=e386]:
            - heading "Consultations & Coaching" [level=2] [ref=e387]
            - generic [ref=e388]:
              - button "Is this mentoring paid?" [ref=e390]:
                - generic [ref=e391]: Is this mentoring paid?
                - img [ref=e393]
              - button "How are mentoring sessions conducted?" [ref=e395]:
                - generic [ref=e396]: How are mentoring sessions conducted?
                - img [ref=e398]
              - button "What is the Rapid Response call?" [ref=e400]:
                - generic [ref=e401]: What is the Rapid Response call?
                - img [ref=e403]
          - generic [ref=e404]:
            - heading "Methodology & Platform" [level=2] [ref=e405]
            - generic [ref=e406]:
              - button "What is the 3-Daily-Goals system?" [ref=e408]:
                - generic [ref=e409]: What is the 3-Daily-Goals system?
                - img [ref=e411]
              - button "Can I access resources on my dashboard?" [ref=e413]:
                - generic [ref=e414]: Can I access resources on my dashboard?
                - img [ref=e416]
      - generic [ref=e418]:
        - generic [ref=e419]:
          - generic [ref=e422]: Get In Touch
          - heading "CONTACT PETER." [level=1] [ref=e424]
          - paragraph [ref=e425]: Have a question about the cohorts, pricing, or custom options? Drop a message and Peter will get back to you within 24 hours.
        - generic [ref=e426]:
          - generic [ref=e427]:
            - generic [ref=e428]:
              - generic [ref=e429]:
                - heading "Direct Channels" [level=3] [ref=e430]
                - paragraph [ref=e431]: Skip the contact form if you prefer direct corporate messaging channels.
              - generic [ref=e432]:
                - generic [ref=e433]:
                  - img [ref=e435]
                  - generic [ref=e438]:
                    - paragraph [ref=e439]: Email Us
                    - paragraph [ref=e440]: peter.mannarino@coaching.com
                - generic [ref=e441]:
                  - img [ref=e443]
                  - generic [ref=e445]:
                    - paragraph [ref=e446]: Call/Text
                    - paragraph [ref=e447]: +1 (201) 555-0192
                - generic [ref=e448]:
                  - img [ref=e450]
                  - generic [ref=e453]:
                    - paragraph [ref=e454]: Location
                    - paragraph [ref=e455]: New York Metropolitan Area
            - generic [ref=e457]:
              - img [ref=e458]
              - generic [ref=e460]: Strict Confidentiality Guaranteed
          - generic [ref=e462]:
            - generic [ref=e463]:
              - generic [ref=e464]:
                - text: Full Name *
                - textbox "e.g. John Doe" [ref=e465]
              - generic [ref=e466]:
                - text: Email Address *
                - textbox "e.g. john@example.com" [ref=e467]
            - generic [ref=e468]:
              - generic [ref=e469]:
                - text: Your Discipline / Area
                - combobox [ref=e470]:
                  - option "IT & Tech" [selected]
                  - option "Cybersecurity"
                  - option "Business & Finance"
                  - option "Liberal Arts"
                  - option "Undecided"
                  - option "Other"
              - generic [ref=e471]:
                - text: Subject / Goal
                - combobox [ref=e472]:
                  - option "Career Guidance" [selected]
                  - option "Schooling Advice"
                  - option "Life Strategy"
                  - option "General Inquiry"
            - generic [ref=e473]:
              - text: Your Message *
              - textbox "Tell Peter about where you are currently stuck, and what you'd like to achieve..." [ref=e474]
            - button "Send Message" [ref=e475]:
              - generic [ref=e476]: Send Message
              - img [ref=e477]
      - generic [ref=e481]:
        - heading "READY FOR CLARITY?" [level=2] [ref=e482]
        - paragraph [ref=e483]: Take control of your trajectory today. Submit an application for structured long-term cohorts or schedule a strategy consultation call with Peter.
        - generic [ref=e484]:
          - link "Apply for Programs" [ref=e485] [cursor=pointer]:
            - /url: "#/apply"
          - link "Book Strategy Session" [ref=e486] [cursor=pointer]:
            - /url: "#/consultation"
      - generic [ref=e488]:
        - generic [ref=e489]:
          - generic [ref=e490]:
            - generic [ref=e491]:
              - generic [ref=e492]: M
              - generic [ref=e493]: Mentorino.
            - paragraph [ref=e494]: Clarity in career, schooling, and life. We build the trajectory you were meant to follow.
          - generic [ref=e495]:
            - heading "Navigate" [level=4] [ref=e496]
            - list [ref=e497]:
              - listitem [ref=e498]:
                - link "About Mentor" [ref=e499] [cursor=pointer]:
                  - /url: "#/about"
              - listitem [ref=e500]:
                - link "Programs" [ref=e501] [cursor=pointer]:
                  - /url: "#/programs"
              - listitem [ref=e502]:
                - link "Consultation" [ref=e503] [cursor=pointer]:
                  - /url: "#/consultation"
              - listitem [ref=e504]:
                - link "FAQ" [ref=e505] [cursor=pointer]:
                  - /url: "#/faq"
          - generic [ref=e506]:
            - heading "Connect" [level=4] [ref=e507]
            - list [ref=e508]:
              - listitem [ref=e509]:
                - link "Contact" [ref=e510] [cursor=pointer]:
                  - /url: "#/contact"
              - listitem [ref=e511]:
                - link "Gallery" [ref=e512] [cursor=pointer]:
                  - /url: "#/gallery"
              - listitem [ref=e513]:
                - link "MEMBERS PORTAL" [ref=e514] [cursor=pointer]:
                  - /url: "#/auth"
        - paragraph [ref=e516]: © 2026 MEntorino ALL RIGHTS RESERVED
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
> 10 |     await expect(page.getByRole('link', { name: 'MEMBERS PORTAL' })).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
  38 |     await expect(footer.getByText(/Mentorino Trajectory Coaching/i)).toBeVisible();
  39 |     await expect(footer.getByText(/Mentor Portal/i)).toBeVisible();
  40 |   });
  41 | });
  42 | 
```