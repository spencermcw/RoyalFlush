// Demo-mode regression test: drawing a pack on the in-browser chain, including the failure path.
//
// Serves the built dApp (dist/, from `npm run build:testnet`, the Dockerfile's build) with the
// production CSP read from the Dockerfile, then drives it in headless Chromium:
//   1. "Play the demo" boots the chain and lands on Draw.
//   2. Drawing 5 cards (2,500 of the starting 10,000 $CARD) issues a pack.
//   3. Choosing 25 cards (12,500 $CARD) is blocked up front with a "Not enough $CARD" notice.
//   4. Dispatching that 25-card draw anyway (the contract reverts) clears "Pending Signature" and
//      shows an error, instead of hanging as it used to.
//   5. Opening the marketplace, where a simulated player lists a Yield Card, leaves the player's
//      own Yield Cards empty (the listed card used to land in the player's collection).
//
// Run: npm run build:testnet && npm run test:e2e   (needs Chromium: npx playwright install chromium)
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const here = path.dirname(fileURLToPath(import.meta.url))
const dist = path.resolve(here, "../dist")
const dockerfile = fs.readFileSync(path.resolve(here, "../../Dockerfile"), "utf8")
const csp = dockerfile.match(/ENV SITE_CSP="([^"]+)"/)[1].replace(/;\s*upgrade-insecure-requests/, "")

if (!fs.existsSync(path.join(dist, "index.html")))
    throw new Error("dist/ is missing: run `npm run build:testnet` first")

const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png",
    ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4", ".mp3": "audio/mpeg",
    ".wav": "audio/wav", ".json": "application/json", ".ico": "image/x-icon" }
const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0])
    if (p.endsWith("/")) p += "index.html"
    const file = path.join(dist, path.normalize(p))
    if (!file.startsWith(dist)) { res.writeHead(403); return res.end() }
    fs.readFile(file, (err, body) => {
        res.setHeader("Content-Security-Policy", csp)
        if (err) { res.writeHead(404); return res.end("not found") }
        res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" })
        res.end(body)
    })
})
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch()
const page = await browser.newPage()
const pageErrors = []
page.on("pageerror", e => pageErrors.push(e.message))

const walletButton = page.locator(".draw .MetaMask button")
const pendingSignature = () => page.evaluate(() =>
    document.querySelector("#app").__vue_app__.config.globalProperties.$store.state.MetaMask.pendingSignature)

try {
    await page.goto(`${base}/#/login`)
    await page.getByText(/Play the demo/i).first().click()
    await page.waitForURL(/play\/draw/, { timeout: 180_000 })
    await page.getByRole("button", { name: /Draw Pack/i }).waitFor()
    console.log("ok - demo booted onto Draw")

    // Wait for the starting balance to load before judging the draw buttons.
    await page.waitForFunction(() => {
        const s = document.querySelector("#app").__vue_app__.config.globalProperties.$store
        return s.state.CARDCoin.balance.gt(0)
    }, null, { timeout: 30_000 })

    await page.getByRole("button", { name: /Draw Pack/i }).click()
    await page.getByText(/New Pack ready to open/i).waitFor({ timeout: 20_000 })
    assert.equal(await pendingSignature(), false)
    console.log("ok - a 5-card draw issues a pack")

    await page.locator(".draw .input-group button", { hasText: /^\s*25\s*$/ }).click()
    await page.locator("[data-test=draw-short]").waitFor({ timeout: 5_000 })
    assert.equal(await page.getByRole("button", { name: /Draw Pack/i }).isDisabled(), true)
    console.log("ok - a draw the balance cannot cover is blocked with a notice")

    const sent = await page.evaluate(() =>
        document.querySelector("#app").__vue_app__.config.globalProperties.$store.dispatch("Deck/draw", 25))
    assert.equal(sent, false, "a reverting draw reports failure")
    assert.equal(await pendingSignature(), false, "pending signature is cleared after a revert")
    await page.getByText(/Could not draw a pack/i).waitFor({ timeout: 5_000 })
    assert.doesNotMatch(await walletButton.innerText(), /Pending/i)
    console.log("ok - a reverting draw ends 'Pending Signature' and shows an error")

    // The demo's third simulated player lists a Yield Card on the marketplace. Viewing it must not
    // put that card in the player's own collection (it used to, via YieldCards/fetchYieldCards).
    const store = (fn) => page.evaluate(fn)
    assert.deepEqual(await store(() => document.querySelector("#app").__vue_app__.config.globalProperties
        .$store.getters["YieldCards/adjustedBalances"].length), 0)
    await page.evaluate(() => { window.location.hash = "#/dapp/marketplace/buy" })
    await page.waitForFunction(() => {
        const s = document.querySelector("#app").__vue_app__.config.globalProperties.$store
        return s.state.Marketplace.listings.some(l => l.yieldCardIds.length > 0)
    }, null, { timeout: 30_000 })
    const view = await store(() => {
        const s = document.querySelector("#app").__vue_app__.config.globalProperties.$store
        const listing = s.state.Marketplace.listings.find(l => l.yieldCardIds.length > 0)
        return {
            owned: s.getters["YieldCards/adjustedBalances"].map(yc => yc.id.toString()),
            listedCardShown: Boolean(listing.yieldCards[0]),
        }
    })
    assert.deepEqual(view.owned, [], "another player's listed Yield Card is not the player's")
    assert.equal(view.listedCardShown, true, "the listed Yield Card is still shown in its listing")
    await page.getByText(/Yield Cards \(0\)/).first().waitFor({ state: "attached", timeout: 5_000 })
    console.log("ok - a simulated player's listed Yield Card stays out of the player's collection")

    assert.deepEqual(pageErrors, [], "no uncaught page errors")
    console.log("ok - no uncaught page errors")
} finally {
    await browser.close()
    server.close()
}
