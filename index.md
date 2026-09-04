---
title: Deformation and Tectonics
---

# Deformation and Tectonics

{% assign lead = site.members | where: "slug", "anindita-samsu" | first %}
Welcome to the home of the Deformation and Tectonics research group at the Institute of Earth Sciences, University of Lausanne, led by [Anindita Samsu]({{ lead.url | relative_url }}).

Founded in 2023, our group has been active along two research axes:

1. brittle deformation of the Earth's crust, with links to regional tectonics and geodynamics, and
2. characterization, analysis, and advancement of the understanding of fracture networks in outcrop and the subsurface, with applications related to the energy transition.

We leverage multi-scale mapping and analyses of field and remotely sensed digital datasets, which record the complex deformation history of the Earth's crust. To enhance the value of these large, high-resolution datasets, we are developing novel geostatistical and deep learning approaches to acquiring and interpreting 2D and 3D data in a geologically meaningful way.

Integration of these field-based and computational approaches can deliver better understanding of fracture systems, providing insights into past and present fluid flow through the crust and de-risking geo-energy projects.

{%
  include button.html
  link="projects"
  text="Read more about our current projects"
  icon="fa-solid fa-arrow-right"
  flip=true
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

{% include list.html data="members" component="portrait" filter="role == 'principal-investigator' && group != 'alum'" %}
{% include list.html data="members" component="portrait" filter="role != 'principal-investigator' && group != 'alum'" %}

{%
  include button.html
  link="team"
  text="Meet the whole team"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}
