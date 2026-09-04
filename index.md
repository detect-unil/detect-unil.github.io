---
title: Deformation and Tectonics
---

{% include section.html size="full" %}

{% assign lead = site.members | where: "slug", "anindita-samsu" | first %}

{% capture hero_lead %}
Welcome to the home of the Deformation and Tectonics research group at the Institute of Earth Sciences, University of Lausanne, led by [Anindita Samsu]({{ lead.url | relative_url }}).
{% endcapture %}

{% capture hero_actions %}
  {%
    include button.html
    link="projects"
    text="Our projects"
    icon="fa-solid fa-arrow-right"
    flip=true
  %}
  {%
    include button.html
    link="research"
    text="Publications"
    icon="fa-solid fa-arrow-right"
    flip=true
    style="bare"
  %}
{% endcapture %}

{%
  include hero.html
  eyebrow="Institute of Earth Sciences · University of Lausanne"
  title="Deformation and Tectonics"
  lead=hero_lead
  actions=hero_actions
  image="images/background.jpg"
%}

{% include section.html %}

## Research

Founded in 2023, our group has been active along two research axes:

<div class="axes" markdown="0">
{%
  include axis.html
  number="01"
  label="Brittle deformation"
  text="Brittle deformation of the Earth's crust, with links to regional tectonics and geodynamics."
%}
{%
  include axis.html
  number="02"
  label="Fracture networks"
  text="Characterization, analysis, and advancement of the understanding of fracture networks in outcrop and the subsurface, with applications related to the energy transition."
%}
</div>

We leverage multi-scale mapping and analyses of field and remotely sensed digital datasets, which record the complex deformation history of the Earth's crust. To enhance the value of these large, high-resolution datasets, we are developing novel geostatistical and deep learning approaches to acquiring and interpreting 2D and 3D data in a geologically meaningful way.

Integration of these field-based and computational approaches can deliver better understanding of fracture systems, providing insights into past and present fluid flow through the crust and de-risking geo-energy projects.

{%
  include button.html
  link="projects"
  text="Read more about our current projects"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% include section.html %}

## Latest news

{% include news-list.html limit=4 %}

{%
  include button.html
  link="blog"
  text="All news"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% include section.html %}

## Team

<div class="people" markdown="0">
{% include list.html data="members" component="portrait" filter="role == 'principal-investigator' && group != 'alum'" %}
{% include list.html data="members" component="portrait" filter="role != 'principal-investigator' && group != 'alum'" %}
</div>

{%
  include button.html
  link="team"
  text="Meet the whole team"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}
