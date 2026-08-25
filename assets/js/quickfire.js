/* Quick-fire injects.

   The scripted spine runs itself. These are for the moments it cannot predict:
   the comms team says something that deserves a consequence, or the room goes
   quiet and needs pressure, or they do something well and deserve to see it
   land. One click, published immediately at the current exercise time.

   Keep the wording short. A facilitator reading a screen mid-exercise needs to
   recognise an inject by its label, not read a paragraph. */

export const QUICKFIRE = [

  // ── Media pressure ────────────────────────────────────────────────
  { group:'Media', label:'Demand numbers', who:'examiner', plat:'x',
    text:'@TheKirkwoodHD How many inpatients were in the building at the time, and how many have been transferred? Our readers are asking.' },

  { group:'Media', label:'Deadline pressure', who:'regional', plat:'x',
    text:'@TheKirkwoodHD We go on air in 20 minutes. Without a statement we will report that the hospice has declined to comment.' },

  { group:'Media', label:'Reporter at the gate', who:'reporter', plat:'x',
    text:'I am at the cordon on Dalton. Nobody from the hospice has come out to speak to press or to the families waiting here.' },

  { group:'Media', label:'Ask about cause', who:'examiner', plat:'x',
    text:'@TheKirkwoodHD Can you say anything about how the fire started, or whether the building had recently been inspected?' },

  { group:'Media', label:'Quote their own words back', who:'national', plat:'x',
    text:'The Kirkwood says patients are "safe and accounted for" but has not said how many were moved or where they have gone.' },

  { group:'Media', label:'Doorstep the CEO', who:'reporter', plat:'x',
    text:'Asking again — is the Chief Executive available for a short interview this afternoon? We can come to you.' },

  // ── Families ──────────────────────────────────────────────────────
  { group:'Families', label:'Nobody has rung me', who:'karen', plat:'fb',
    text:'still nothing from the hospice. my dad is 82 and he is in that building. please can someone just tell me he is alright' },

  { group:'Families', label:'Found out online', who:'mohammed', plat:'fb',
    text:'I have now been watching this on Facebook for over an hour. Nobody has contacted me. Is that really how this is meant to work?' },

  { group:'Families', label:'Which hospital?', who:'sarahm', plat:'fb',
    text:'If they have been transferred, can you at least say which hospitals? We are ringing round and getting nowhere.' },

  { group:'Families', label:'Relative at the cordon', who:'diane', plat:'fb',
    text:'There are three families stood at the gate now in the rain and nobody has come out to them. Somebody please go and speak to them.' },

  { group:'Families', label:'Thank you (relief)', who:'karen', plat:'fb',
    text:'Just had a call from the hospice. Dad is safe. Thank you to whoever made that call, it meant everything. 💛' },

  // ── Rumour and hostility ──────────────────────────────────────────
  { group:'Rumour', label:'Death rumour resurfaces', who:'viral', plat:'x',
    text:'Hearing again from a second source that there were fatalities at the Huddersfield hospice. The silence is telling. #Huddersfield' },

  { group:'Rumour', label:'Accuse of covering up', who:'angry', plat:'fb',
    text:'They know exactly what happened and they are not saying. Why would you stay quiet this long if you had nothing to hide' },

  { group:'Rumour', label:'Fire safety allegation', who:'exstaff', plat:'x',
    text:'still waiting for anyone to answer the question about the fire doors on that corridor. i raised it. its documented.' },

  { group:'Rumour', label:'Fake donation page', who:'viral', plat:'fb',
    text:'Setting up a fundraiser for the hospice, link below. All donations go straight to them. Please share widely.' },

  { group:'Rumour', label:'Filming patients', who:'watch', plat:'x',
    text:'More footage from the scene. You can clearly see beds and staff in the car park. #TheKirkwood #Huddersfield' },

  // ── Staff ─────────────────────────────────────────────────────────
  { group:'Staff', label:'Should we come in?', who:'fiona', plat:'fb',
    text:'Late shift here. Still nobody has told us whether to come in at 6 or not. Can someone please just send one message to everyone.' },

  { group:'Staff', label:'Staff sharing photos', who:'tracy', plat:'fb',
    text:'Pic from one of the girls on shift, they are all out in the car park with the patients. Absolute heroes every one of them.' },

  { group:'Staff', label:'Staff contradicting the line', who:'fiona', plat:'fb',
    text:'That is not what we were told in the building. We were told it started in the plant room. Which is it?' },

  // ── Partners and scrutiny ─────────────────────────────────────────
  { group:'Partners', label:'Councillor wants update', who:'councillor', plat:'x',
    text:'@TheKirkwoodHD I have residents and families contacting me directly. Can I have an authorised update I can share?' },

  { group:'Partners', label:'Fire service statement', who:'fire', plat:'x',
    text:'Crews remain in attendance in Dalton. The cause is not yet established and an investigation will follow. #WYFRS' },

  { group:'Partners', label:'Police ask for cooperation', who:'police', plat:'x',
    text:'We are asking the public not to attend the area or share unverified information about the incident in Dalton.' },

  // ── Positive — reward good practice ───────────────────────────────
  { group:'Positive', label:'Public praise the response', who:'norris', plat:'fb',
    text:'Whoever is running the hospice page today — thank you. Clear, kind and honest. It has calmed a lot of frightened people.' },

  { group:'Positive', label:'Correction accepted', who:'becky', plat:'fb',
    text:'I have deleted my earlier post. The hospice have confirmed it was not true and I should not have shared it. Sorry.' },

  { group:'Positive', label:'Community offers help', who:'business', plat:'fb',
    text:'Anything the hospice needs over the next few days, this town will provide it. Just tell us where to bring things.' },
];

export const GROUPS = ['Media', 'Families', 'Rumour', 'Staff', 'Partners', 'Positive'];
