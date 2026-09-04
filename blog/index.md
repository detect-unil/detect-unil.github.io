---
title: News
nav:
  order: 5
  tooltip: Group news and announcements
---

# {% include icon.html icon="fa-solid fa-feather-pointed" %}News

What the group has been up to.

{% include section.html %}

{% include search-box.html %}

{% include tags.html tags=site.tags %}

{% include search-info.html %}

## All posts

{% include list.html data="posts" component="post-excerpt" %}
