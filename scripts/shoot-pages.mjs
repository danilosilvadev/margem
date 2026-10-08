import puppeteer from "puppeteer-core"

const base = "http://127.0.0.1:41731"
const out = "/opt/cursor/artifacts"
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})
const page = await browser.newPage()
page.on("pageerror", (error) => console.log("pageerror", error.message))
await page.setViewport({ width: 1280, height: 800 })

async function shot(name, path) {
  await page.goto(base + path, { waitUntil: "networkidle0" })
  await new Promise((resolve) => setTimeout(resolve, 300))
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log("shot", name)
}

await shot("explore-desktop", "/")
await shot("book-desktop", "/book/the-raven")
await shot("book-quixote-desktop", "/book/quixote")
await shot("shelf-desktop", "/shelf")
await shot("map-desktop", "/map")
await page.click("section button")
await page.screenshot({ path: `${out}/map-game-desktop.png` })
await shot("journey-desktop", "/journey")
await page.click("article button")
await page.screenshot({ path: `${out}/journey-walk-desktop.png` })
await shot("tree-desktop", "/tree")
await shot("openings-desktop", "/openings")
await page.click("article button")
await page.screenshot({ path: `${out}/openings-answer-desktop.png` })
await shot("community-desktop", "/community")
await page.type("input[placeholder='Room title']", "Monday, stanza one")
await page.type("textarea[placeholder='When and how you want to read']", "Read the first three stanzas and stop.")
await page.click("button[type=submit]")
await page.waitForSelector("[data-testid=reading-room]")
await page.type("textarea[placeholder='The line']", "Once upon a midnight dreary")
await page.type("textarea[placeholder='What you want beside it']", "The Portuguese keeps the midnight.")
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")]
  buttons.find((node) => node.textContent?.includes("Sign this mark"))?.click()
})
await page.waitForSelector("[data-testid=marginalia]")
await page.type("textarea[placeholder='The letter']", "I keep rereading the bust of Pallas and I still do not know who is speaking.")
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")]
  buttons.find((node) => node.textContent?.includes("Leave it on the table"))?.click()
})
await page.waitForSelector("[data-testid=letter]")
await page.screenshot({ path: `${out}/community-filled-desktop.png`, fullPage: true })
console.log("shot community-filled")
await shot("salon-desktop", "/salon/midnight")
await shot("reader-desktop", "/read/the-raven/poem")

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await shot("explore-mobile", "/")
await shot("community-mobile", "/community")
await shot("map-mobile", "/map")
await shot("reader-mobile", "/read/the-raven/poem")

await browser.close()
console.log("pages shot")
