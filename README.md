# DeTect group website

Visit **[detect-unil.github.io](https://detect-unil.github.io)** 🚀

This is the website of the Deformation and Tectonics (DeTect) research group at the Institute
of Earth Sciences, University of Lausanne.

**You do not need to install anything to edit this site.** Everything below can be done from
your browser at [github.com/detect-unil/detect-unil.github.io](https://github.com/detect-unil/detect-unil.github.io).
When you save a change, the site rebuilds itself and goes live in about two minutes.

## The five files you will ever need

| To do this | Edit this file |
| --- | --- |
| Add news (fieldwork, a conference, an award) | `_data/news.yaml` |
| Add a publication | `_data/sources.yaml` |
| Add a person, or mark someone as a former member | a file in `_members/` |
| Add a project | `_data/projects.yaml` |
| Change the words on a page | that page's `index.md` |

Each one has instructions written inside it, at the top.

## How to edit any file

1. Open the file on GitHub.
2. Click the pencil icon (✏️ "Edit this file") at the top right.
3. Make your change.
4. Scroll down, write one line about what you changed, and click **Commit changes**.

Nothing can be lost. Every past version is kept, and any change can be undone.

Two of these files (`news.yaml`, `sources.yaml`) are **YAML**, where the only rule that matters
is that **the indentation has to line up**. Copy an entry that is already there and change it,
rather than typing a new one from scratch, and you will not go wrong.

The text in pages and bios is **Markdown**, which is plain text with a few conventions:

| To get this | Type this |
| --- | --- |
| **bold** | `**bold**` |
| *italic* | `*italic*` |
| a link | `[text to show](https://the-address.com)` |
| a heading | `## My heading` |
| a bullet list | `- first item` on its own line |

Leave a blank line between paragraphs.

---

## 1. Add news

Open **`_data/news.yaml`** and add an entry at the top:

```
- date: "2026-06-15"
  kind: fieldwork
  title: Fracture mapping campaign in the Wutach Gorge
  text: >-
    Two weeks of scanline and drone surveys through the Muschelkalk aquifer.
```

Keep the quotes around the date and write it year-month-day. The order of entries does not
matter, because the page always sorts newest first.

`kind:` picks the icon and the small label above the headline. It must be one of:
`fieldwork`, `conference`, `teaching`, `award`, `software`, `people`, `other`.

You can also add any of these, all optional:

- `text:` a sentence or two of detail. Keep the `>-` and the indentation as shown above.
- `link:` somewhere to send the reader. Either a page on this site, written without a slash
  (`link: move-licenses`), or a full address elsewhere (`link: https://www.egu.eu`).
- `image:` a picture. Upload it to the `images/news/` folder first (**Add file** then
  **Upload files**), then write `image: images/news/wutach-2026.jpg`.

The file already contains several switched-off examples, one for each kind. To use one, delete
the `# ` from the front of its lines and edit it.

**You do not add publications here.** Anything you add to `_data/sources.yaml` appears on the
News page by itself. See below.

**If the news needs more than a paragraph,** make it a page of its own instead: in the
`pages` area create a folder like `wutach-2026/index.md` (see `move-licenses/index.md` as a
worked example), then point a short news entry at it with `link: wutach-2026`.

---

## 2. Add a publication

Open **`_data/sources.yaml`** and add two lines at the top of the "peer reviewed" section:

```
- id: doi:10.1016/j.jsg.2026.105640
  type: paper
```

**You only supply the DOI.** The title, the full author list, the journal and the date are
fetched for you, so there is nothing to type by hand and no way to misspell a co-author or get
a year wrong.

Use `type: paper` for anything peer reviewed and `type: preprint` for a preprint or a
conference abstract. The only thing `type:` changes is the small icon.

To remove a publication, delete its two lines.

The new paper appears on the Publications page **and** near the top of the News page, labelled
"New publication", without you doing anything else. Publications drop off the News page after
two years but stay on the Publications page forever. (That is the
`news_publication_years: 2` setting in `_config.yaml`.)

The bottom of `sources.yaml` holds the group's EGU conference abstracts and the preprint
versions of papers that are already listed. They are switched off so the page stays readable.
Delete the `# ` in front of any of them to bring it back.

**Do not edit `_data/citations.yaml`.** That file is written by a robot from the DOIs in
`sources.yaml`, and anything you type into it will be overwritten.

---

## 3. Add a person

People live in the **`_members`** folder, one file each.

1. Go to `_members` and click **Add file** then **Create new file**.
2. Name the file after the person, lowercase with a dash: `maria-rossi.md`.
3. Paste this in and edit it:

```
---
name: Maria Rossi
image: images/members/maria-rossi.jpg
role: phd
links:
  email: maria.rossi@unil.ch
  orcid: 0000-0000-0000-0000
---

# {{ page.name }}

A short paragraph about Maria's research, in her own words.
```

4. Click **Commit changes**.

`role:` sets the icon and the job title shown under the name. It must be one of
`principal-investigator`, `junior-lecturer`, `postdoc`, `phd`, `undergrad`, `programmer`.
If the job title should read differently, add a line like `description: Graduate Assistant`
and that text is shown instead.

**Their photo** goes in the `images/members/` folder (**Add file** then **Upload files**).
A square photo of about 600 by 600 pixels works best. If you do not have one yet, write
`image: images/members/placeholder.svg` and a grey silhouette is shown until you do.

`links:` can include any of `email`, `orcid`, `google-scholar`, `linkedin`, `github`,
`home-page`. Leave out the ones that do not apply.

New people appear on the Team page and the homepage automatically. Their ORCID link appears on
their own page, but note that **their papers are not picked up from it**: publications come
only from `_data/sources.yaml`, so add their DOIs there too.

---

## 4. Mark someone as a former member

**Do not delete their file.** Add one line to it:

```
---
name: Maria Rossi
image: images/members/maria-rossi.jpg
role: phd
group: alum
---
```

They move from the main team list down to **Former members** at the bottom of the Team page,
and they come off the homepage. Their own page and their publications stay on the site.

To bring someone back, delete the `group: alum` line again.

---

## 5. Add a project

Projects have two halves: the card on the Projects page, and the project's own page.

**The card.** Open **`_data/projects.yaml`** and add a block at the end. Line the spaces up
exactly as shown:

```
- title: My New Project
  image: images/projects/my-new-project.jpg
  link: projects/my-new-project
  description: >-
    One or two sentences describing the project.
  tags:
    - fracture networks
    - geothermal
```

Upload the image to `images/projects/` first. A square image of about 800 by 800 pixels looks
best.

**The page.** In the `projects` folder click **Add file** then **Create new file**, and name it
`my-new-project/index.md`. Typing the `/` creates the folder for you. The name has to match
whatever you put after `projects/` in `link:` above. Paste in:

```
---
title: My New Project
---

# My New Project

Who is involved, what the project is about, and any references.
```

If a project does not need a page of its own, leave out the `link:` line and skip this half.

---

## Which file is which page

| Page | File |
| --- | --- |
| Homepage | `index.md` |
| Team | `team/index.md` |
| Publications | `research/index.md` |
| Projects | `projects/index.md` |
| Teaching | `teaching/index.md` |
| News | `blog/index.md` |
| Contact | `contact/index.md` |
| MOVE licences | `move-licenses/index.md` |

The `{% ... %}` bits are building blocks: headings, buttons, photo grids. Editing the plain
text around them is completely safe. If you delete one by accident, look at the file's history
on GitHub to see what it used to say.

Anything on the site that says **`TODO:`** is waiting for a person. Search the repository for
`TODO:` to find them all, and see `TODO.md`.

---

## If something goes wrong

After every change GitHub tries to rebuild the site. If it fails you get an email, and a red ✗
appears next to your change on GitHub.

Nothing is broken permanently, and the live site keeps showing the last good version. To undo,
open your commit on GitHub and click **Revert**. The usual cause is indentation that does not
line up in a `.yaml` file, or a missing quote mark.

Builds are listed under the **Actions** tab.

---

## Notes for whoever maintains this later

- Built with [Lab Website Template](https://github.com/greenelab/lab-website-template)
  (v1.4.0, MIT, see `LICENSE.md`). This repository starts from a single clean commit and does
  **not** contain the template's git history, so `git merge upstream/main` will refuse to run
  ("unrelated histories").
- To pull in a later template release, diff against it rather than merging:

  ```
  git remote add upstream https://github.com/greenelab/lab-website-template.git
  git fetch upstream
  git diff HEAD upstream/main -- _layouts _includes _styles _plugins _cite .github
  ```

  then copy across what you want.
- **No file in `_layouts/`, `_includes/`, `_styles/`, `_plugins/` or `_cite/` has been
  modified**, which is what keeps that diff readable. Two files were *added* to those folders,
  and they are the only custom code on the site:
  - `_includes/news-list.html`, the merged news timeline. It concatenates `_data/news.yaml`
    with recent entries from `_data/citations.yaml` and sorts by date, which is how new
    publications reach the News page. Used by `blog/index.md` and by `index.md` with
    `limit=4`.
  - `_styles/news.scss`, the few rules that timeline needs. `_includes/styles.html` links
    every `.scss` in `_styles/` automatically, so no wiring was needed.
- Everything else is content, `_config.yaml` and `_data/`. The only change to template data is
  one extra `junior-lecturer` role plus a block of news kinds in `_data/types.yaml`. Add more
  the same way: an icon from [Font Awesome free](https://fontawesome.com/search?o=r&m=free)
  and a label.
- **Publications come from DOIs in `_data/sources.yaml`, not from ORCID.** The template can
  harvest ORCID records instead (drop a `_data/orcid.yaml` listing iDs and the same pipeline
  picks it up), but that was deliberately turned off in favour of a list the group controls.
  `_cite/cite.py` turns `sources.yaml` into `_data/citations.yaml` using Manubot, and runs on
  every push.
- **Page URLs are `/research/` and `/blog/`, not `/publications/` and `/news/`,** even though
  the nav reads "Publications" and "News". The folders keep the template's names on purpose:
  `_layouts/member.html` links to `research/?search=...`, so renaming them would break the
  "search for this person's papers" link on every member page.
- There are no posts in `_posts/`, because news lives in `_data/news.yaml` instead. That means
  `feed.xml` is a valid but empty RSS feed. If the group ever wants a working feed, that is
  the thing to revisit.
- The two landscape photos (`images/background.jpg`, `images/share.jpg`) came from the old
  WordPress site and are Unsplash stock images, by Konstantin Kleine and Audric Wonkam.
- `images/icon.png`, the browser tab icon, is a placeholder. See `TODO.md`.
- The site is built by GitHub Actions and served from the `gh-pages` branch. Do not edit that
  branch by hand, it is overwritten on every build.
