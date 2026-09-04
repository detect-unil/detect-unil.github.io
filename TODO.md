# TODO: open items for the DeTect site

Everything here is a decision or a file that has to come from a person. None of it stops the
site working. It is live and complete without them.

## 1. Files we need from people

| What | Who | Where it goes |
| --- | --- | --- |
| Portrait photo (square, 600px or larger) | **Sofia Brisson** | `images/members/sofia-brisson.jpg`, then set `image:` in `_members/sofia-brisson.md` |
| Portrait photo (square, 600px or larger) | **Timothy Schmid** | `images/members/timothy-schmid.jpg`, then set `image:` in `_members/timothy-schmid.md` |
| A short bio, one or two paragraphs | **Sofia Brisson** | replaces the `TODO:` in `_members/sofia-brisson.md` |
| A short bio, one or two paragraphs | **Timothy Schmid** | replaces the `TODO:` in `_members/timothy-schmid.md` |
| ORCID iD, and DOIs of any papers | **Timothy Schmid** | the iD under `links:` in his member file, the DOIs in `_data/sources.yaml` |

Both people currently show a grey silhouette placeholder. That is deliberate. It is better
than a stock photo of somebody else.

## 2. A real favicon and logo

`images/icon.png` is a placeholder I generated: a white offset marker bed across a fault, on
the site's blue. It is legible at 16px but it is not a designed identity.

The group has no logo at all. If one is ever made, drop it in as `images/logo.svg` and it
appears next to the title in the header automatically, with no code change.

## 3. Check two preprints are still preprints

`_data/sources.yaml` lists two items as `type: preprint`:

- `10.5194/egusphere-2026-1097`, *Towards robust fracture mapping*, current work.
- `10.31223/OSF.IO/AFD7W`, *Inheritance without reactivation*, an EarthArXiv preprint from
  2019.

If either has since appeared in a journal, replace the preprint DOI with the published one.
The 2019 one is old enough that it is worth checking.

## 4. Publications that are not on the site

The old WordPress member pages carried hand-typed publication lists. Those are gone, because
publications now come from the DOI list in `_data/sources.yaml`. Most were already covered,
but these were not, and are therefore no longer shown anywhere:

- **Alannah Brett**: an in-preparation paper (*Permeability of hydrothermally altered and
  fractured lavas*), the swisstopo report `10.5281/zenodo.10938102`, and a 2017 SGA
  conference proceedings paper.
- **Jefter Caldeira**: his MSc thesis, <https://www.bdtd.uerj.br/handle/1/7164>.

Anything with a DOI, such as the swisstopo report, can be added to `_data/sources.yaml` in two
lines. Work with no DOI has nowhere to go at the moment, so if the group wants a "submitted and
in preparation" section on the Publications page, say so and it can be added.

## 5. Copy-editing in text carried over from WordPress

These were ported exactly as they read on the live site. They are other people's words, so
they have not been silently edited:

- `_members/alannah-brett.md`, second paragraph: "I am originally from New Zealand, where I
  completed **her** undergraduate". Presumably should be "my".
- `projects/muschelkalk/index.md` still reads like the conference abstract it came from. It
  refers to "(Alt-Epping et al., **this meeting**)" and "(see Madritsch et al. and Diamond et
  al., **this meeting**)", which mean nothing to a website reader. Worth rewording.
- Same page: "This **works** will improve the understanding". Presumably "work".
- One name **was** corrected: the Muschelkalk page spelled a team member "Jefter
  **Caldiera**". It now reads "Caldeira", matching his own page and his ORCID record.

## 6. Content questions nobody has answered yet

- `teaching/index.md` has a `TODO:` asking whether there are Master's or PhD courses to list,
  such as a MOVE-based structural modelling practical, and which semester Structural geology
  runs in.
- Job titles: Jefter and Ayoub are shown as "Graduate Assistant", matching the old site, but
  both describe themselves as PhD students in their bios. Pick one and use it consistently.
- The Projects page lists only Muschelkalk, as the old site did. Several other active strands
  are visible in the publications (swissAlps3D, the Wilsons Promontory granite work, the
  automatic fracture-mapping benchmark). Adding them is section 5 of `README.md`.
- The old site had no group photo. Both landscape images are Unsplash stock. A real field or
  group photo would make the homepage much more distinctive.
- The News page has one real entry besides the website launch. Fieldwork, conference and award
  entries are set up and waiting, as switched-off examples in `_data/news.yaml`.

## 7. The template credit in the footer

Every page's footer reads "© 2026 DeTect | Built with **Lab Website Template**", linking to
`github.com/greenelab/lab-website-template`. That is the template's attribution credit rather
than leftover demo text, so it was left in place. Removing it is a reasonable choice too, but
it is the group's call.

The template's MIT licence is satisfied by keeping `LICENSE.md`. It does not require a visible
footer link. To remove it, delete the last four lines of the `<div>` in
`_includes/footer.html`. Note that this is the one place where doing so means editing a
template file, which slightly complicates future comparisons against upstream.

While you are in that file: it also has a commented-out block meant for "extra details like
contact info or address", which could carry the ISTE address on every page.

## 8. Optional: let Actions open the weekly citations pull request

A workflow runs every Monday, re-fetches the metadata for every DOI in `_data/sources.yaml`,
and opens a pull request if anything changed. This is genuinely useful, because it is how a
preprint that has since been published gets its title, journal and date corrected on the site
without anybody noticing it happened.

**Its last step currently fails**, with:

> GitHub Actions is not permitted to create or approve pull requests

That is an organisation setting, off by default. An owner of the `detect-unil` org can turn it
on at <https://github.com/organizations/detect-unil/settings/actions>, under **Workflow
permissions**, by ticking **"Allow GitHub Actions to create and approve pull requests"**.
There is a matching per-repository switch, but the org setting overrides it.

This is not urgent, and publications are not stuck. Everything except the pull-request step
was verified working: adding a DOI to `_data/sources.yaml` and pushing regenerates the whole
list and rebuilds the site, with no pull request involved. You can also refresh on demand from
**Actions**, then **update-citations**, then **Run workflow**.

Until the setting is changed you will get one failure email every Monday. If that is annoying
and nobody wants to flip the setting, delete
`.github/workflows/on-schedule.yaml` and the weekly run stops.

## 9. Two things I could not verify, and one link that was changed

**Not checked by hand in a browser on a phone.** Screenshots and console checks were done with
a headless browser at 1440px and 390px across every page, and came back clean: no console
errors, no failed requests, no broken images, no sideways scrolling. What that does not tell
you is how it feels to actually use on a real phone. Worth five minutes.

**The BAFU reference link was changed.** The Muschelkalk page's last reference pointed at
`bafu.admin.ch/dam/.../Switzerland's Long-Term Climate Strategy.pdf`, which returns 502 Bad
Gateway, as does every other `/dam/` PDF on that host. The citation text is untouched. Only
the hyperlink now points at the document's stable landing page,
<https://www.bafu.admin.ch/en/climate-strategy-2050>, which works. If the PDF endpoint comes
back, the original deep link is in this repository's git history.

Note also that the citation says "4 pp." while the full strategy is 28 pages. BAFU also
publishes a 4-page factsheet, so that may be the document actually intended. Someone who knows
the reference should check.

**Known link-checker noise.** `bundle exec jekyll build` runs html-proofer, which reports a
handful of external-link failures. Every one was checked by hand and none is a real broken
link: the `doi.org` shortDOIs redirect correctly but the publishers (Elsevier, AGU, Wiley)
return 403 to automated requests, LinkedIn returns its standard 999 bot block, and the UNIL
course catalogue actually returns 200 but sometimes times out.

**Also worth knowing: html-proofer failures do not fail the build.** The `raise error` line in
`_plugins/misc.rb` is commented out upstream, so a green GitHub Actions run does not mean the
link check passed. Read the log.

## 10. Deliberately not done

- **No redirect from `wp.unil.ch/detect`.** Pending UNIL Ci's answer on whether a `unil.ch`
  name can point at an external host. The WordPress site was never touched.
- **The old "Test post"** at `wp.unil.ch/detect/test-post`, reading "This is a test post. Yet
  another line. ?!", was not migrated. It is still public on the old site and could be deleted
  there.
- **Portrait alt text** is the template's generic "member portrait" for every photo, set in
  `_includes/portrait.html`. Each person's name sits next to the image inside the same link,
  so screen readers do announce who it is. Changing it would mean editing a template file, so
  it was left alone.
