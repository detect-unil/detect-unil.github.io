# DeTect group website

Visit **[detect-unil.github.io](https://detect-unil.github.io)** 🚀

This is the website of the Deformation and Tectonics (DeTect) research group at the Institute
of Earth Sciences, University of Lausanne.

**You do not need to install anything to edit this site.** Everything below can be done from
your browser at [github.com/detect-unil/detect-unil.github.io](https://github.com/detect-unil/detect-unil.github.io).
When you save a change, the site rebuilds itself and goes live in about two minutes.

## How to edit anything, in general

1. Go to the file on GitHub.
2. Click the **pencil icon** (✏️ "Edit this file") at the top right.
3. Make your change.
4. Scroll down, write one line about what you changed, and click **Commit changes**.

That's it. If you make a mistake, nothing is lost — every past version is kept, and someone can
always undo it.

The text is written in **Markdown**, which is just plain text with a few conventions:

| To get this | Type this |
| --- | --- |
| **bold** | `**bold**` |
| *italic* | `*italic*` |
| a link | `[text to show](https://the-address.com)` |
| a heading | `## My heading` |
| a bullet list | `- first item` on its own line |

Leave a blank line between paragraphs.

---

## 1. Add a news post

News posts live in the **`_posts`** folder. One file per post.

1. Go to the `_posts` folder and click **Add file → Create new file**.
2. Name the file `YYYY-MM-DD-short-title.md` — the date must come first, for example
   `2026-10-05-fieldwork-in-the-jura.md`. That date is the date shown on the site.
3. Paste this in, and edit it:

```
---
title: Fieldwork in the Jura
tags:
  - fieldwork
---

<!-- excerpt start -->
One sentence that shows up in the news list.
<!-- excerpt end -->

Then write the post here. As many paragraphs as you like.
```

4. Click **Commit changes**.

The post appears on the [News page](https://detect-unil.github.io/blog/) automatically.

**To put a photo in a post**, first upload it to `images/news/` (go to that folder → **Add file
→ Upload files**), then add this where you want the photo:

```
{%
  include figure.html
  image="images/news/my-photo.jpg"
  caption="What the photo shows"
%}
```

Please always write a `caption` — it is what visually impaired visitors hear.

**To show the post's photo in the news list too**, add `image: images/news/my-photo.jpg` to the
block at the top, under `title:`.

---

## 2. Add a member

Members live in the **`_members`** folder. One file per person.

1. Go to `_members` and click **Add file → Create new file**.
2. Name the file after the person, lowercase and with a dash: `firstname-lastname.md`, for
   example `maria-rossi.md`.
3. Paste this in, and edit it:

```
---
name: Maria Rossi
image: images/members/maria-rossi.jpg
role: phd
affiliation: Institute of Earth Sciences, University of Lausanne
links:
  email: maria.rossi@unil.ch
  orcid: 0000-0000-0000-0000
---

A short paragraph about Maria's research, in her own words.
```

4. Click **Commit changes**.

**`role:` must be one of** these (it sets the little icon and the job title shown under the
name): `principal-investigator`, `junior-lecturer`, `postdoc`, `phd`, `undergrad`,
`programmer`. If you need a different one, see "Adding a new role" at the bottom.

**If the job title should read differently** from the default, add a line
`description: Graduate Assistant` — that text is shown instead.

**Their photo:** upload it to the `images/members/` folder first (**Add file → Upload files**).
A square photo works best, about 600×600 pixels. If you don't have one yet, write
`image: images/members/placeholder.svg` and a grey silhouette is shown until you do.

**`links:` can include** any of: `email`, `orcid`, `google-scholar`, `linkedin`, `github`,
`home-page`. Leave out the ones that don't apply.

New members appear on the [Team page](https://detect-unil.github.io/team/) and the homepage
automatically. Their papers appear on the Publications page automatically too, as long as you
put in their `orcid:`.

---

## 3. Mark a member as a former member (alumni)

**Do not delete their file.** Add one line to it.

1. Open their file in `_members`.
2. Add `group: alum` in the block at the top, like this:

```
---
name: Maria Rossi
image: images/members/maria-rossi.jpg
role: phd
group: alum
---
```

3. Click **Commit changes**.

They move from the main team list down to **Former members** at the bottom of the Team page,
and they come off the homepage. Their own page and their papers stay on the site.

To bring someone back, delete the `group: alum` line again.

---

## 4. Add a project

Projects are a little different: the short version on the Projects page and the full page are
two separate things.

**Step one — the card on the Projects page.** Open **`_data/projects.yaml`** and add a block
like this at the end. Line up the spaces exactly as shown; indentation matters in this file.

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

Upload the image to `images/projects/` first. A square image, about 800×800 pixels, looks best.

**Step two — the project's own page.** In the `projects` folder, click **Add file → Create new
file** and name it `my-new-project/index.md` — typing the `/` creates the folder for you. The
name must match what you put after `projects/` in `link:` above. Paste in:

```
---
title: My New Project
---

# My New Project

Who is involved, what the project is about, and any references.
```

If a project has no page of its own, leave out the `link:` line and skip step two.

---

## Publications — there is nothing to edit

The [Publications page](https://detect-unil.github.io/research/) is built automatically every
week from the **ORCID** records of the people listed in `_data/orcid.yaml`.

**So: to get your paper onto the website, add it to your own ORCID record** at
[orcid.org](https://orcid.org/). It then reaches the website in one of two ways:

- automatically, the next time anyone pushes any change to the site, or
- on demand — go to the **Actions** tab, pick **update-citations** in the left sidebar, and
  click **Run workflow**. Takes about a minute.

A weekly robot that opens a "Periodic citation update" pull request is also configured, but it
needs one organisation setting switched on before it can work — see item 11 in `TODO.md`.

Nobody should type publications into this website by hand — they would be overwritten.

If someone joins the group, add their ORCID iD to `_data/orcid.yaml` as a new line:

```
- orcid: 0000-0000-0000-0000 # Their Name
```

If a paper shows up that you don't want listed (a duplicate, or an abstract), don't delete it
from `_data/citations.yaml` — that file is regenerated and your change would vanish. Instead
add it to `_data/sources.yaml`, which has instructions inside it.

---

## Changing the words on an ordinary page

| Page | File to edit |
| --- | --- |
| Homepage | `index.md` |
| Team | `team/index.md` |
| Publications | `research/index.md` |
| Projects | `projects/index.md` |
| Teaching | `teaching/index.md` |
| News | `blog/index.md` |
| Contact | `contact/index.md` |
| MOVE licences | `move-licenses/index.md` |

The `{% ... %}` bits are building blocks — headings, buttons, photo grids. Editing the plain
text around them is completely safe. If you delete one by accident, look at this file's history
on GitHub to see what it used to say.

Anything in the site that says **`TODO:`** is waiting for a human. Search the repository for
`TODO:` to find them all, and see `TODO.md`.

---

## If something goes wrong

After every change, GitHub tries to rebuild the site. If it fails, **you get an email** and a
red ✗ appears next to your change on GitHub.

Nothing is broken permanently and the live site keeps showing the last good version. To undo:
open your commit on GitHub and click **Revert**, or ask whoever is comfortable with Git. The
most common cause is a typo in the indentation of a `.yaml` file, or a missing quote mark.

You can watch builds under the **Actions** tab.

---

## Notes for whoever maintains this later

- Built with [Lab Website Template](https://github.com/greenelab/lab-website-template) (v1.4.0,
  MIT — see `LICENSE.md`). This repository starts from a single clean commit and does **not**
  contain the template's git history, so `git merge upstream/main` will refuse to run
  ("unrelated histories").
- To pull in a later template release, add the remote and diff against it rather than merging:

  ```
  git remote add upstream https://github.com/greenelab/lab-website-template.git
  git fetch upstream
  git diff HEAD upstream/main -- _layouts _includes _styles _plugins _cite .github
  ```

  then copy across the changes you want. **No files in `_layouts/`, `_includes/`, `_styles/`
  or `_plugins/` have been modified**, so that diff should apply cleanly — all of our changes
  are content, `_config.yaml` and `_data/`. Check the template's release notes for anything
  affecting `_config.yaml`.
- **Adding a new role:** the only change to template data is one extra entry,
  `junior-lecturer`, in `_data/types.yaml`. Add more the same way — an icon
  ([Font Awesome free](https://fontawesome.com/search?o=r&m=free)) and a description.
- **Page URLs are `/research/` and `/blog/`, not `/publications/` and `/news/`.** The nav
  labels read "Publications" and "News". The folders keep the template's names on purpose:
  `_layouts/member.html` links to `research/?search=…` and `blog/?search=…`, so renaming the
  folders would break the "Search for this person's papers" link on every member page.
- The two landscape photos (`images/background.jpg`, `images/share.jpg`) came from the old
  WordPress site and are Unsplash stock images, by Konstantin Kleine and Audric Wonkam
  respectively.
- `images/icon.png` (the browser tab icon) is a placeholder. See `TODO.md`.
- The site is built by GitHub Actions and served from the `gh-pages` branch. Don't edit that
  branch by hand — it is overwritten on every build.
