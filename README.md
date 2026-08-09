# Powerjacked

A single-file fitness tracker. Weigh-ins with optional body composition, nutrition totals,
a training log built around an editable program, InBody check-ins, Zone 2 and rehab
adherence, and a dashboard that ties them together.

Live at <https://pinedasanabria1911.github.io/powerjacked/>.

## Design constraints

The whole app is one `index.html` with no build step, no framework, and no dependencies.
Nothing is fetched from a CDN. That is deliberate: there is no lockfile to rot, no package
to update, and no service that can sleep, expire, or change its free tier. Editing the file
and pushing is the entire deployment process.

## Where the data lives

The app ships with a program and a goal but no measurements. Everything you log is stored
in a **separate private repository** as a single `data.json`, written through the GitHub
contents API. That repo is the record; the browser holds a cache.

Consequences worth knowing:

- Every save is a commit, so the history is a free, versioned backup of every day.
- Clearing the browser, losing the phone, or having iOS evict site storage costs you
  nothing but the need to paste the token again.
- Two devices editing while offline merge per record rather than overwriting. Records are
  keyed by date, so nothing another device wrote is dropped.

## Setup on a new device

1. Create a fine-grained personal access token at
   <https://github.com/settings/personal-access-tokens>, scoped to the private data
   repository only, with **Contents: read and write**, and an expiry you are happy with.
2. Open the app, go to **Setup → Sync**, enter the GitHub user and the private repo name
   (`powerjacked-data`), paste the token, and press **Connect**.
3. On iOS, use Share → Add to Home Screen so it opens full screen with its own icon.

The token is kept in that browser's local storage under its own key, is excluded from every
export, and is only ever sent to `api.github.com`. **Forget token** removes it from the
device.

## Exports

- **Tier 1, check-in summary.** Markdown or JSON: weight trend, volume against the targets
  your own program implies, top lift changes versus the previous run of the same session,
  nutrition averages, and flags.
- **Tier 2, full history.** One CSV per table plus the program, bundled into a ZIP written
  in-page with no library. Some sandboxed viewers refuse `.zip`, so there is also a
  single-Markdown fallback containing the same tables.

## Calorie target

Maintenance is measured, not predicted: mean intake over the window, corrected by what the
7-day weight average actually did, at 7700 kcal per kg. The target is maintenance plus the
phase rate. Under 14 days of paired weight and nutrition data it falls back to a fixed
number and says so.
