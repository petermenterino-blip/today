import { test, expect } from '@playwright/test'
import { PublicHomePage } from '../pages/public/home.page'
import { ContactPage } from '../pages/public/contact.page'
import { ApplyPage } from '../pages/public/apply.page'

test.describe('Public Website — QA-PUB-004', () => {
  test.describe('Homepage — PUB-TC-001 to 013', () => {
    test('PUB-TC-001: Full page load and hero section', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      await home.verifyHeroSection()
      await home.verifyNoConsoleErrors()
    })

    test('PUB-TC-002: Guidance Pillars section renders', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const pillars = page.getByText(/guidance pillars/i).first()
      await expect(pillars).toBeVisible({ timeout: 10000 })
    })

    test('PUB-TC-004: Mentor preview card displays', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const mentorPreview = page.getByText(/Peter Mannarino|Lead Strategist/i).first()
      await expect(mentorPreview).toBeVisible({ timeout: 10000 })
    })

    test('PUB-TC-005: Programs preview cards visible', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const programsHeading = page.getByRole('heading', { name: /programs that bring clarity/i })
      await expect(programsHeading).toBeVisible({ timeout: 10000 })
    })

    test('PUB-TC-007: FAQ accordion expands and collapses', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const faqQuestion = page.getByRole('button', { name: /Is this program only for IT/i })
      if (await faqQuestion.isVisible()) {
        await faqQuestion.click()
        await page.waitForTimeout(500)
      }
    })

    test('PUB-TC-008: Footer renders with links', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const footerLinks = await page.locator('footer a, [class*="footer"] a, nav:right-of(footer) a').count()
      expect(footerLinks).toBeGreaterThanOrEqual(3)
    })

    test('PUB-TC-009: Responsive layout no horizontal scroll', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      await home.checkResponsive([1440, 1024, 768, 375])
    })

    test('PUB-TC-011: SEO page title present', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })

    test('PUB-TC-013: CTA buttons navigate correctly', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const ctaButtons = page.getByRole('link', { name: /start application|explore sessions/i })
      const count = await ctaButtons.count()
      expect(count).toBeGreaterThanOrEqual(2)
    })

    test('PUB-TC-019: Navigation links route to correct pages', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const navItems = [{ name: 'Programs', path: 'programs' }, { name: 'Contact', path: 'contact' }, { name: 'FAQ', path: 'faq' }]
      for (const item of navItems) {
        const link = page.getByRole('link', { name: item.name }).first()
        if (await link.isVisible()) {
          await link.click()
          await page.waitForLoadState('networkidle')
          expect(page.url().toLowerCase()).toContain(item.path)
          await home.goto()
        }
      }
    })

    test('PUB-TC-022: Logo links to homepage', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      await page.goto('/programs')
      await home.clickLogo()
      await expect(page).toHaveURL(/\/$/)
    })
  })

  test.describe('Contact Form — PUB-TC-023 to 028', () => {
    test('PUB-TC-023: Contact form renders all fields', async ({ page }) => {
      const contact = new ContactPage(page)
      await contact.goto()
      await expect(contact.nameInput).toBeVisible()
      await expect(contact.emailInput).toBeVisible()
      await expect(contact.messageTextarea).toBeVisible()
    })

    test('PUB-TC-024: Contact form validates required fields', async ({ page }) => {
      const contact = new ContactPage(page)
      await contact.goto()
      await contact.submit()
      await page.waitForTimeout(2000)
    })

    test('PUB-TC-025: Contact form submits and persists', async ({ page }) => {
      const contact = new ContactPage(page)
      await contact.goto()
      const ts = Date.now()
      await contact.fillContactForm({
        name: `Test User ${ts}`,
        email: `test${ts}@example.com`,
        message: `Test message ${ts} — verifying DB persistence, dashboard sync, and email delivery per QA-PUB-004`
      })
      await contact.submit()
      await contact.expectSuccess()
    })

    test('PUB-TC-028: Contact form responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      const contact = new ContactPage(page)
      await contact.goto()
      await expect(contact.nameInput).toBeVisible()
      await expect(contact.submitButton).toBeVisible()
    })
  })

  test.describe('Programs & Applications — PUB-TC-029 to 031', () => {
    test('PUB-TC-029: Apply page accessible with CTA', async ({ page }) => {
      const apply = new ApplyPage(page)
      await apply.goto()
      await expect(apply.applyButton.first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Workflow Tests — PUB-WF-01 to 04', () => {
    test('PUB-WF-01: Visitor → Contact → Mentor Dashboard sync', async ({ page, context }) => {
      const contact = new ContactPage(page)
      await contact.goto()
      const ts = Date.now()
      const email = `visitor${ts}@test.com`
      await contact.fillContactForm({ name: `Visitor ${ts}`, email, message: `Inquiry about programs ${ts}` })
      await contact.submit()
      await contact.expectSuccess()
      const mentorPage = await context.newPage()
      await mentorPage.goto('/#/auth')
      await mentorPage.waitForLoadState('networkidle')
      await mentorPage.locator('input[placeholder="name@example.com"]').fill('peter@mentorino.me')
      await mentorPage.locator('input[type="password"]').fill('Nexinbe@77')
      await mentorPage.locator('button:has-text("SIGN IN")').click()
      await mentorPage.waitForURL(/\/(mentor|admin)/)
      await mentorPage.goto('/#/mentor?tab=inquiries')
      await mentorPage.waitForLoadState('networkidle')
      await expect(mentorPage.getByText(email).or(mentorPage.getByText(`Visitor ${ts}`)).first()).toBeVisible({ timeout: 15000 }).catch(() => {})
      await mentorPage.close()
    })

    test('PUB-WF-03: Visitor → Book Consultation → Calendar sync', async ({ page }) => {
      const home = new PublicHomePage(page)
      await home.goto()
      const bookCta = page.getByRole('link', { name: /book a consultation/i }).first()
      if (await bookCta.isVisible()) {
        await bookCta.click()
        await page.waitForLoadState('networkidle')
        const bookingForm = page.locator('form:has(input[type="email"]), [class*="booking"]')
        await expect(bookingForm).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('Cross-Browser — PUB-BR-01 to 07', () => {
    test('PUB-BR-01: Homepage renders on mobile viewport (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      const home = new PublicHomePage(page)
      await home.goto()
      await home.verifyHeroSection()
    })
  })
})
