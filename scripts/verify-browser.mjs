import puppeteer from "puppeteer-core"

const base = "http://127.0.0.1:41731"
const out = "/opt/cursor/artifacts"
const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-fake-ui-for-media-stream"],
})

const failures = []
function check(name, ok, detail = "") {
  console.log(`${ok ? "ok" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`)
  if (!ok) failures.push(name)
}

const a = await browser.createBrowserContext()
const b = await browser.createBrowserContext()
const pageA = await a.newPage()
const pageB = await b.newPage()
for (const page of [pageA, pageB]) {
  page.on("pageerror", (error) => console.log("pageerror", error.message))
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("console", msg.text())
  })
}

await pageA.setViewport({ width: 1440, height: 900 })
await pageA.goto(base, { waitUntil: "networkidle0" })
await pageA.waitForSelector("[data-testid=library]")
await pageA.waitForSelector("[data-testid=book-card]")
check("library title", (await pageA.$eval("h1", (node) => node.textContent)).includes("parallel"))
await pageA.screenshot({ path: `${out}/library.png` })

await pageA.goto(`${base}/book/the-raven`, { waitUntil: "networkidle0" })
await pageA.waitForSelector("[data-testid=book-detail]")
check("book rights", (await pageA.content()).includes("Why these texts are free to read"))

await pageA.goto(`${base}/read/the-raven/poem`, { waitUntil: "networkidle0" })
await pageA.waitForSelector("[data-testid=reader]")
await pageA.waitForFunction(() => document.body.innerText.includes("midnight dreary"))
const columns = await pageA.$$("[data-testid=column]")
check("three columns", columns.length === 3, `found ${columns.length}`)
check("portuguese visible", (await pageA.content()).includes("meia-noite"))
check("spanish visible", (await pageA.content()).includes("media noche"))
await pageA.screenshot({ path: `${out}/reader-desktop.png` })

await pageB.setViewport({ width: 1440, height: 900 })
await pageB.goto(`${base}/read/the-raven/poem?as=second`, { waitUntil: "networkidle0" })
await pageB.waitForSelector("[data-testid=reader]")
await pageB.click("[data-testid=comments-s01]")
await pageB.waitForSelector("[data-testid=comment-input]")

await pageA.click("[data-testid=comments-s01]")
await pageA.waitForSelector("[data-testid=comment-input]")
await pageA.type("[data-testid=comment-input]", "The tapping is already in the Portuguese.")
await pageA.click("[data-testid=comment-submit]")
await pageB.waitForFunction(
  () => document.body.innerText.includes("The tapping is already in the Portuguese."),
  { timeout: 10000 },
)
const relayComment = await pageB.waitForSelector("[data-testid=comment]")
const relayBox = await relayComment.boundingBox()
check(
  "relay comment visible in second session",
  Boolean(relayBox && relayBox.width > 40 && relayBox.height > 10),
  relayBox ? `${Math.round(relayBox.width)}x${Math.round(relayBox.height)}` : "no box",
)
await pageB.screenshot({ path: `${out}/comments-relay.png` })

await pageB.click("[data-testid=comment-input]", { clickCount: 3 })
await pageB.type("[data-testid=comment-input]", "And the Spanish keeps the same midnight.")
await pageB.click("[data-testid=comment-submit]")
await pageA.waitForFunction(
  () => document.body.innerText.includes("And the Spanish keeps the same midnight."),
  { timeout: 10000 },
)
await pageA.waitForFunction(() => document.body.innerText.includes("And the Spanish keeps the same midnight."), {
  timeout: 10000,
})
const returned = await pageA.waitForSelector("[data-testid=comment]")
const returnedBox = await returned.boundingBox()
check("second session comment returned", Boolean(returnedBox && returnedBox.height > 10))

const direct = await pageA
  .waitForFunction(() => (document.querySelector("[data-testid=sync-status]")?.textContent ?? "").includes("direct"), {
    timeout: 8000,
  })
  .then(() => true)
  .catch(() => false)
check("direct peer link", direct, direct ? "" : "WebRTC did not open in this run")
if (direct) {
  await pageA.screenshot({ path: `${out}/comments-direct.png` })
}

await pageA.evaluate(() => {
  const close = [...document.querySelectorAll("button")].find((node) => node.textContent?.trim() === "Close")
  close?.click()
})
await pageA.waitForSelector("[data-testid=comment]", { hidden: true }).catch(() => {})
await pageA.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await pageA.waitForFunction(() => document.body.innerText.includes("Stacked"))
await pageA.screenshot({ path: `${out}/reader-mobile.png`, fullPage: false })
check("mobile stacked control", (await pageA.content()).includes("Stacked"))

await pageA.goto(`${base}/settings`, { waitUntil: "networkidle0" })
await pageA.waitForSelector("[data-testid=last-backup]")
const last = await pageA.$eval("[data-testid=last-backup]", (node) => node.textContent ?? "")
check("last backup shown", last.includes("No backup yet") || last.length > 0, last)

await pageA.goto(`${base}/read/the-raven/poem`, { waitUntil: "networkidle0" })
await pageA.evaluate(async () => {
  const ready = await navigator.serviceWorker.ready
  return Boolean(ready)
})
await pageA.setOfflineMode(true)
await pageA.reload({ waitUntil: "domcontentloaded" })
await pageA.waitForSelector("[data-testid=offline-banner]", { timeout: 8000 })
const offlineText = await pageA.evaluate(() => document.body.innerText)
check("offline reader", offlineText.includes("midnight dreary") && offlineText.includes("You are offline"))
await pageA.screenshot({ path: `${out}/reader-offline.png` })

await browser.close()
if (failures.length) {
  console.log("failures", failures.join(", "))
  process.exit(1)
}
console.log("browser verification passed")
