---
title: Team
nav:
  order: 3
  tooltip: The people in the group
---

# {% include icon.html icon="fa-solid fa-users" %}Team

The DeTect group brings together structural geologists, fluid-flow specialists and remote-sensing
researchers at the Institute of Earth Sciences, University of Lausanne.

{% include section.html %}

{% include list.html data="members" component="portrait" filter="role == 'principal-investigator' && group != 'alum'" %}
{% include list.html data="members" component="portrait" filter="role != 'principal-investigator' && group != 'alum'" %}

{% include section.html %}

## Former members

{% assign alumni = site.members | data_filter: "group == 'alum'" %}
{% if alumni.size > 0 %}
  {% include list.html data="members" component="portrait" filter="group == 'alum'" style="small" %}
{% else %}
  The group was founded in 2023 and nobody has moved on yet. Former members will be listed
  here.
{% endif %}
