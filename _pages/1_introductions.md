---
layout: questions
title: "Introduction"
button: Continue
pageNo: 1
---

<div>
<form class="col-md-12">

{% multiple_choice name:"participant-sex" type:"radio" label:"Sex" %}
[](male) Male
[](female) Female
[](not-say) Prefer not to say
{% endmultiple_choice %}

{% text_input name:"participant-age" label:"Age" %}
[Age](age)
{% endtext_input %}

{% multiple_choice name:"participant-age" type:"radio" label:"Education" %}
[](highschool) I have a highschool diploma
[](bachelor) I have a bachelor's diploma
[](graduate) I have a graduate diploma
[](post-graduate) I have a post-graduate diploma
{% endmultiple_choice %}

{% text_input name:"participant-country" label:"Country" %}
[Country of Residence](country)
{% endtext_input %}

</form>