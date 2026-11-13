# Ganache 7.9.2 (browser build), vendored for Royal Flush demo mode

`ganache.min.js` is `dist/web/ganache.min.js` from the official npm package, unmodified.
`ganache.min.js.LICENSE.txt` and `LICENSE` (MIT) come from the same package.

- Package: `ganache@7.9.2` (https://www.npmjs.com/package/ganache/v/7.9.2)
- Tarball: `ganache-7.9.2.tgz`, fetched with `npm pack ganache@7.9.2` into an empty directory
- npm registry `dist.integrity`: `sha512-7gsVVDpO9AhrFyDMWWl7SpMsPpqGcnAzjxz3k32LheIPNd64p2XsY9GYRdhWmKuryb60W1iaWPZWDkFKlbRWHA==`
  (the downloaded tarball's own sha512 matched it; registry `dist.shasum` `77f506ad2735dd9109696ffa1834a9dd2f806449`)
- `ganache.min.js`: 7,844,725 bytes, sha256 `9a9b3defcbef72f69e4df91a72e6d26f5335ff115bfed979f4cbb830ae2b4177`
- Loaded with subresource integrity `sha384-7ZJuPSJycTVhi/25CY7DMzaD94WbBbDu4G0f8YzNRISN1guhFB9NpF8UlXf7ul6Y`
  (`GANACHE_SRI` in `src/store/demoChain.js`; update both together)
- The 21 MB source map (`ganache.min.js.map`) is left out.

It is only loaded in demo mode, after the visitor presses "Play the demo" (see `src/store/demoChain.js`).
In the page it needs `script-src 'unsafe-eval'` (the bundled EVM runs `new Function(...)` at load,
and it compiles WebAssembly). It also tries to fetch a `data:` WebAssembly URL, which `connect-src
'self'` blocks; it then falls back to compiling the same bytes directly, so that console error is
harmless.

To update: `npm pack ganache@<version>` in an empty directory, check the tarball's sha512 against
`npm view ganache@<version> dist.integrity`, copy `package/dist/web/ganache.min.js` (+ LICENSE files)
into a new `vendor/ganache-<version>/` directory, and update `GANACHE_SRC` / `GANACHE_SRI`.

## The demo runs the real contracts, bugs included

The demo deploys the same bytecode as the BSC testnet build (`src/store/contracts/ABIs/*.json`) and
does not change how it behaves. Two known contract bugs are therefore part of the demo too:

- **Draw off-by-one (`Deck.drawPack`)**: the weighted pick keeps the last bucket whose subtraction
  *succeeded*, so a roll is credited to the card before the one it landed on, and the Wildcard (id 20,
  the last bucket) can never be drawn. Wildcards only enter play through the owner's minting.
- **Timestamp randomness**: the draw seed is `keccak256(block.timestamp)`, so packs drawn in the same
  block get the same rolls, and a miner (or anyone who can predict the block time) can pick the outcome.
