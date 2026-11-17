# Shadow Bearings — PR4 Preview and GitHub Pages Deployment

## Reviewing the PR4 build before merging

1. Open [Pull Request #4](https://github.com/chriswalker-afk/hiddenmovement/pull/4).
2. Open the latest successful **Build reviewable Shadow Bearings preview** workflow under **Checks** or **Actions**.
3. Download the **shadow-bearings-site-preview** artifact and unzip it.
4. In the unzipped folder, run a local web server (for example Python's http.server) and open the server's address in the browser. ES modules require an HTTP address; opening index.html from the file system directly may not work.
5. Test Solo Hunt and Pass & Play, plus the two new missions, +/− zoom, save/resume and the limited powers.

The workflow packages only HTML, CSS, favicon/manifest and browser JavaScript modules. It excludes tests, development documents and student save data.

## Publishing after PR4 is merged

The Pages workflow in .github/workflows/pages.yml runs automatically whenever main is updated, or manually through **Actions → Publish Shadow Bearings to GitHub Pages → Run workflow**.

**One-time repository setting (if Pages has not been enabled):**

- Open **Settings → Pages** in GitHub.
- Under **Build and deployment**, select **GitHub Actions** as the source.
- Check that **Actions** can publish Pages deployments for the repository.

Then merge PR4 into main and check the Pages workflow. When it reports a successful deployment, the expected project site is:

https://chriswalker-afk.github.io/hiddenmovement/

**Do not share that as confirmed live until it actually loads.** Repository administrators may have to enable Pages in Settings manually. The GitHub connector cannot change this administration setting itself.

The Pages workflow tests the whole game and packages the same allowlisted site files before calling GitHub's official Pages artifact/deployment actions. Publishing is restricted to pushes to main and explicit workflow dispatch; opening a PR does not replace the live website.

## Safety and privacy checks

- **Pass & Play:** after each move, handoff is entirely opaque: no map, position, clue or notes. A page reopened from saved state re-seals before role reveal.
- **Solo:** the Monster's location never appears in the Hunter view.
- **New missions:** gate and beacons are deliberately public; Veil usage is announced without exposing the Monster's destination.
- **Local saves:** full game state stays on the same browser/device; it is not protected from someone inspecting developer tools, localStorage or browser profiles. Only use this in cooperative look-away classrooms.
- **Accessibility:** verify number labels and map zoom at phone, tablet, computer and classroom projector sizes. Check keyboard navigation and reduced-motion settings. The responsive design is not a claim of formal accessibility certification.
- **Maths:** confirm bearings start at the indicated origin and historical clues use their observation round when intersecting candidates.

## Rollback

If a published change regresses gameplay, revert the change on the default branch and allow the Pages workflow to republish the reverted commit. Git history and deployment records remain available; do not edit a deployed Pages artifact manually.

## Beyond PR4

Competitive two-device play should use a server-authoritative hidden-state API with role-specific access. Shared-device local storage is a practical classroom privacy feature, not a secure adversarial online multiplayer platform.
