# TODO — open items for the DeTect site

Everything here is a decision or a file that has to come from a person. Nothing in this list
blocks the site from working; it is live and complete without them.

## 1. Files we need from people

| What | Who | Where it goes |
| --- | --- | --- |
| Portrait photo (square, ≥600×600) | **Sofia Brisson** | `images/members/sofia-brisson.jpg`, then set `image:` in `_members/sofia-brisson.md` |
| Portrait photo (square, ≥600×600) | **Timothy Schmid** | `images/members/timothy-schmid.jpg`, then set `image:` in `_members/timothy-schmid.md` |
| A short bio, 1–2 paragraphs | **Sofia Brisson** | replaces the `TODO:` in `_members/sofia-brisson.md` |
| A short bio, 1–2 paragraphs | **Timothy Schmid** | replaces the `TODO:` in `_members/timothy-schmid.md` |
| ORCID iD | **Timothy Schmid** | `links:` in his member file, **and** a new line in `_data/orcid.yaml` so his papers appear |

Both people currently show a grey silhouette placeholder, which is deliberate — better than a
stock photo of someone else.

## 2. A real favicon and logo

`images/icon.png` is a placeholder I generated: a white offset marker bed across a fault, on
the site's blue. It reads fine at 16 px but it is not a designed identity.

The group has no logo at all. If one is ever made, drop it in as `images/logo.svg` and it will
appear next to the title in the header automatically — no code change needed.

## 3. Publications page — deferred curation

The Publications page currently lists **everything** on the five ORCID records, unfiltered: 30
entries. That was a deliberate choice to avoid maintenance, but it means:

- **Conference abstracts sit alongside peer-reviewed papers.** About 13 of the 30 are EGU
  abstracts (`Copernicus GmbH`), which outnumber the journal articles in some years.
- **Three papers appear twice**, once as the preprint and once as the published article:
  - *Selective inversion of rift basins in lithospheric-scale analogue experiments* —
    `10.5194/se-14-909-2023` and `10.5194/egusphere-2023-411`
  - *Scale matters: The influence of structural inheritance on fracture patterns* —
    `10.1016/j.jsg.2019.103896` and `10.31223/OSF.IO/95RKY`
  - *Rapid, semi-automatic fracture and contact mapping…* — `10.5194/se-8-1241-2017` and
    `10.5194/se-2017-83`

When the group wants this tidied, the fix is to add the unwanted ids to `_data/sources.yaml`
with `remove: true` (that file has instructions in it), and optionally split the page into
"Peer-reviewed articles" and "Conference abstracts" sections using a `type` filter. Nothing
needs to be typed by hand and no DOIs need inventing.

## 4. Publications that ORCID does not know about

The old WordPress member pages carried hand-typed publication lists which are **not** on the
new site, because the site takes publications from ORCID only. Most were already on ORCID, but
these were not, and are therefore no longer shown anywhere:

- **Alannah Brett** — a submitted paper (*Lithium production in the United States*, since
  published and now listed automatically), an in-preparation paper (*Permeability of
  hydrothermally altered and fractured lavas…*), the swisstopo report
  `10.5281/zenodo.10938102`, and a 2017 SGA conference proceedings paper.
- **Jefter Caldeira** — his MSc thesis (<https://www.bdtd.uerj.br/handle/1/7164>).

If the group wants these visible, the cleanest route is to add them to the person's ORCID
record, where they will be picked up automatically. Items with a DOI (the swisstopo report) can
alternatively be added to `_data/sources.yaml` by id.

**Ayoub Fatihi's ORCID record currently lists no works at all.** His 2026 *Journal of
Structural Geology* paper does appear on the site, but only because his co-authors list it on
theirs.

## 5. Copy-editing in text carried over from WordPress

These were ported **exactly as they read on the live site**. They are other people's words, so
they have not been silently edited:

- `_members/alannah-brett.md`, second paragraph: "I am originally from New Zealand, where I
  completed **her** undergraduate…" — should presumably be "my".
- `projects/muschelkalk/index.md` reads like the conference abstract it came from: it refers to
  "(Alt-Epping et al., **this meeting**)" and "(see Madritsch et al. and Diamond et al., **this
  meeting**)", which mean nothing to a website reader. Worth rewording.
- Same page: "This **works** will improve the understanding…" — should presumably be "work".
- One name **was** corrected: the Muschelkalk page spelled a team member "Jefter **Caldiera**";
  it now reads "Caldeira", to match his own page and his ORCID record.

## 6. Content questions nobody has answered yet

- `teaching/index.md` has a `TODO:` asking whether there are Master's/PhD courses to list (a
  MOVE-based structural modelling practical?) and which semester Structural geology runs in.
- Job titles: Jefter and Ayoub are shown as "Graduate Assistant", matching the old site, but
  both describe themselves as PhD students in their bios. Pick one and use it consistently.
- The Projects page lists only Muschelkalk, as the old site did. Several other active strands
  are visible in the group's publications (swissAlps3D, the Wilsons Promontory granite work,
  the automatic fracture-mapping benchmark). Adding them is section 4 of `README.md`.
- The old site had no group photo. Both landscape images are Unsplash stock. A real field or
  group photo would make the homepage much more distinctive.

## 7. Deliberately not done

- **No redirect from `wp.unil.ch/detect`.** Pending UNIL Ci's answer on whether a `unil.ch`
  name can point at an external host. The WordPress site has not been touched.
- **The old "Test post"** (`wp.unil.ch/detect/test-post`, reading "This is a test post. Yet
  another line. ?!") was not migrated. It is still public on the old site and could be deleted
  there.
- **Portrait alt text** is the template's generic "member portrait" for every photo, set in
  `_includes/portrait.html`. Each person's name is right next to the image inside the same
  link, so screen readers do announce who it is; changing it would mean editing a template file
  and giving up the easy upstream merge. Left as-is on purpose.

## 8. One decision left: the template credit in the footer

Every page's footer reads "© 2026 DeTect | Built with **Lab Website Template**", linking to
`github.com/greenelab/lab-website-template`. This is the template's attribution credit rather
than leftover demo text, so I left it in place — stripping it is a reasonable choice too, but
it is the group's call, not mine.

The template's MIT licence is satisfied by keeping `LICENSE.md`; it does not require a visible
footer link. To remove it, delete the last four lines of the `<div>` in
`_includes/footer.html`. Note that this is the one place where doing so means editing a
template file, which slightly complicates future `git merge upstream/main` runs.

While you are in that file: it also contains a commented-out block intended for "extra details
like contact info or address", which could carry the ISTE address on every page.

## 9. Two things I could not verify, and one link I changed

**Could not verify in a real browser.** Screenshots and a console-error check were not possible
on this machine: the Claude Chrome extension is not connected, the installed Google Chrome
(v120) is an x86 build that crashes under Rosetta on this macOS, and Brave's headless mode
hangs. Everything else was verified from the built HTML instead — every page has exactly one
`h1` with no heading skips, every `<img>` has alt text, and no page references a local file that
is missing from the build (which is what would produce a console 404). What remains genuinely
unchecked is how it *looks* at narrow widths and whether any of the template's own JavaScript
logs an error at runtime. Worth five minutes in a browser before showing this to the group.

**The BAFU reference link was changed.** The Muschelkalk page's last reference pointed at
`bafu.admin.ch/dam/…/Switzerland's Long-Term Climate Strategy.pdf`, which returns **502 Bad
Gateway** — as does every other `/dam/` PDF on that host, so BAFU's document delivery appears
to be down or blocking non-browser clients. The citation text is untouched; only the hyperlink
now points at the document's stable landing page,
<https://www.bafu.admin.ch/en/climate-strategy-2050> (verified working). If the PDF endpoint
comes back, the original deep link is in this repository's git history.

Note also that the citation says "4 pp.", but the full strategy is 28 pages — BAFU also
publishes a 4-page factsheet, so that may be the document actually intended. Someone who knows
the reference should check.

**Known benign link-checker noise.** `bundle exec jekyll build` runs html-proofer and reports
11 external-link failures. All 11 were checked by hand and none is a real broken link:
seven `doi.org` shortDOIs (they redirect correctly; the publishers — Elsevier, AGU, Wiley —
return 403 to automated requests), one LinkedIn URL (HTTP 999, LinkedIn's standard bot block),
two hits on the UNIL course catalogue (it actually returns 200; proofer timed out), and the
BAFU link above. **Also important: html-proofer failures do not fail the build** — the
`raise error` line in `_plugins/misc.rb` is commented out upstream, so a green GitHub Actions
run does not mean the link check passed. Read the log.

## 10. Cosmetic: every post shows today's date as "modified"

Each news post displays a published date *and* a "modified" date, the latter coming from the
`jekyll-last-modified-at` plugin, which reads the file's last git commit. Because every file
was committed on the same day, all posts currently show the same modified date, which looks
like a bug even though it is accurate. It sorts itself out as posts are edited over time.

If you would rather not show it at all, remove `- jekyll-last-modified-at` from the `plugins:`
list in `_config.yaml` (config only — no template files involved).
