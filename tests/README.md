# HTML regression runner (v0.35.3)

Run a local HTTP server at the repository root, then:

```sh
python3 tests/run_html.py --url http://127.0.0.1:8874
```

Requires macOS Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` and free debugging port 9357. No Python third-party packages are needed. The runner uses an isolated temporary browser profile, never a personal browser profile. It does not push or commit. JSON results default to `/private/tmp/v035-regression-matrix.json`.

Optional arguments: `--profiles new,legacy,complete`, `--files test_main_story.html,test_story_assets.html`, `--output /private/tmp/result.json`.

## What the three profiles mean

All 58 pages load `fixture.js` before their game iframe. For each selected profile, the fixture first checks real save/load or migration:

- `new`: new-game state, opening stage, not a legacy player. `test_home.html` separately exercises an actually absent save.
- `legacy`: 30F reached, 10F/20F cleared, 1234G, no `chapter.mainStory`; load must migrate to a non-forced legacy/free state without losing progress or G.
- `complete`: the same progress, v0.35 episodes read and facility tutorial complete; save/load must retain the free state.

After that preflight, component tests receive a consistent story-complete fixture with Elna contracted. This prevents an unrelated opening modal from blocking equipment/combat/layout tests. This is **not** a claim that every component test plays the whole story in all three modes. Individual tests may explicitly replace their own state. `test_main_story.html` executes the new story flow, while `test_chapter.html` verifies legacy/completed progression, repeat boss handling, REPLAY neutrality, and milestone unlocks. Both run in each profile pass.

The fixture only appears on test pages, never `index.html`. It does not stub production story or reward functions. The runner treats a failed/missing profile preflight, HTML assertion failure, `pass:false`, or timeout as a failure.

## Browser test boundaries

Chrome autoplay is allowed explicitly to test actual BGM decoding and looping without a synthetic gesture. This does not verify iPhone/Android autoplay permission behavior. Responsive HTML tests resize game iframes; dedicated device-emulation screenshots and actual pointer events supplement them. Real-device Safari/Chrome and physical toolbar/keyboard behavior remain separate checks.

Reports use temporary storage. Game source, assets, balances, and real player saves are not modified by the harness.
