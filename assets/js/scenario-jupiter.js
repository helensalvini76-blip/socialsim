/* Exercise Jupiter — inject script.
   T+0 = 13:00 (EXERCISE START). T+150 = 15:30 (EXERCISE END).
   Phases follow section 3 of Exercise Pack V1.1.

   Items tagged packRef map to the numbered comms injects in section 11 of the
   pack, so anything fired here can be traced back to the written exercise.

   Voice note: posts are deliberately written the way frightened people actually
   type — lowercase, missing apostrophes, mid-thought. Do not tidy them up. */

export const FIRE_LOCATION = 'the link corridor near the day therapy unit';
export const FIRE_LOCATION_SHORT = 'the link corridor';

export const PHASES = [
  {id:1, name:'Alarm & escalation',     from:0,   to:25},
  {id:2, name:'Live movement',          from:20,  to:65},
  {id:3, name:'Clearing station',       from:45,  to:85},
  {id:4, name:'Dispersal & media peak', from:65,  to:115},
  {id:5, name:'Recovery',               from:100, to:150},
];

/* Normal hospice life, posted before the alarm. Seeds the feed so it does not
   start suspiciously empty — participants scroll back into an ordinary day. */
export const BASELINE = [
  {min:-180, plat:'fb', who:'kirkwood', text:'Our Sunflower Appeal is now live! Every sunflower dedicated helps us care for patients and families across Kirklees. Dedicate yours through the link in our bio. 🌻'},
  {min:-165, plat:'ig', who:'kirkwood', text:'Thank you to everyone who walked, baked and donated last weekend. You are the reason we can be here. 💛 #TheKirkwood #Huddersfield'},
  {min:-140, plat:'fb', who:'norris',   text:'Just want to say a huge thank you to all the staff at The Kirkwood for the care they gave my mum. Nothing was ever too much trouble. Wonderful people.'},
  {min:-120, plat:'x',  who:'examiner', text:'Kirklees council confirms roadworks on Wakefield Road will continue until the end of the month. Full story on our site.'},
  {min:-95,  plat:'fb', who:'business', text:'Fresh in this morning — local strawberries, while they last! 🍓'},
  {min:-70,  plat:'x',  who:'kirkwood', text:'Our Hospice at Home team made 214 visits last month. Thank you to everyone whose support makes that possible. 💛'},
  {min:-40,  plat:'ig', who:'tracy',    text:'coffee morning at work for the hospice ☕️ we have raised £86 already and its only half 11'},
  {min:-20,  plat:'fb', who:'gary',     text:'Anyone know why theres so much traffic on Wakefield Rd this dinnertime? Been sat here 15 mins'},
];

/* ── The spine ──────────────────────────────────────────────────────
   min      : minutes from T+0
   plat     : x | fb | ig
   who      : persona key
   text     : post body
   img      : optional image path
   burst    : true = arrives in a rapid cluster with the neighbouring items
   packRef  : maps to a numbered inject in the exercise pack
   note     : facilitator note, never shown to participants               */

export const SCRIPT = [

  // ── PHASE 1 — Alarm and escalation (T+0 to T+25) ──────────────────
  {min:2,  plat:'x',  who:'liam',      text:'fire alarm going off at the hospice on Dalton. can hear it from the road'},
  {min:4,  plat:'fb', who:'neighbour', text:'Is everything alright at The Kirkwood? Alarms have been going a good few minutes now and there are people out on the grass.'},
  {min:6,  plat:'x',  who:'darren',    text:'2 fire engines just gone past the Co-op with blues on. heading towards Dalton', burst:true},
  {min:7,  plat:'x',  who:'ryan',      text:'make that 3. somethings going on', burst:true},
  {min:9,  plat:'fb', who:'tracy',     text:'my sister in laws just rang, shes says theres smoke coming from the hospice building. praying its nothing 🙏'},
  {min:11, plat:'ig', who:'kevin',     text:'Fire crews on Dalton. Hope everyone is ok', note:'IG image post — cordon at distance'},
  {min:13, plat:'x',  who:'watch',     text:'INCIDENT: Multiple fire appliances in attendance at The Kirkwood Hospice, Dalton. Reports of smoke from the main building. Patients understood to be inside. More to follow.', note:'First rumour account. Unsourced, states patients inside as fact.'},
  {min:15, plat:'x',  who:'examiner',  enquiry:true, text:'We are getting reports of a fire at The Kirkwood Hospice in Dalton. Emergency services are on scene. @TheKirkwoodHD are you able to confirm what is happening?', note:'First direct media approach. Clock starts on their response.'},
  {min:17, plat:'fb', who:'karen',     enquiry:true, text:'my dad is in the inpatient unit at the kirkwood. can anyone tell me whats happening please. ive rang twice and cant get through', note:'HIGH IMPACT — family member, publicly identifiable relative, asking on an open page.'},
  {min:19, plat:'x',  who:'owen',      text:'been diverted off the road by police. whole area taped off. never seen anything like it here', burst:true},
  {min:20, plat:'x',  who:'nikki',     text:'that poor place. those are the most vulnerable people you could imagine 😢', burst:true},
  {min:22, plat:'fb', who:'sandra',    text:'They are bringing beds out into the car park. I can see them from the top road. Actual hospital beds outside.'},
  {min:24, plat:'x',  who:'fire',      text:'We are currently in attendance at an incident at a premises in Dalton, Huddersfield. Please avoid the area to allow emergency vehicles access. #WYFRS', note:'Partner posts before the hospice does. If the comms team has still said nothing, point this out at debrief.'},

  // ── PHASE 2 — Live movement (T+20 to T+65) ────────────────────────
  {min:25, plat:'fb', who:'diane',     text:'Looks serious – whole hospice being evacuated. My friend works there and says they are moving everyone out. Nobody knows where they are going yet.', packRef:'T+25', note:'PACK T+25 — the staff-originated speculation inject. Tests correcting misinformation without a punitive tone.'},
  {min:27, plat:'x',  who:'viral',     text:'🚨 HUDDERSFIELD: Fire at The Kirkwood Hospice. Patients being evacuated into the car park. Unconfirmed reports of casualties. #Huddersfield', note:'Amplifier account. "Unconfirmed reports of casualties" is the first hard untruth.'},
  {min:29, plat:'x',  who:'paul',      text:'why has nobody from the hospice said anything yet. its been half an hour'},
  {min:31, plat:'fb', who:'mohammed',  enquiry:true, text:'My mother is a patient there. I have had no phone call. I am finding this out from Facebook. Why is nobody telling the families anything??', packRef:'T+35', note:'HIGH IMPACT — the "I found out online" complaint. This is the one that stings.'},
  {min:33, plat:'x',  who:'regional',  text:'BREAKING: Fire at a hospice in Huddersfield. Patients evacuated. We understand West Yorkshire Fire & Rescue have multiple crews on scene. More shortly.', burst:true},
  {min:34, plat:'x',  who:'national',  text:'Fire at Huddersfield hospice — patients moved from building. Developing story.', burst:true},
  {min:35, plat:'x',  who:'becky',     text:'someone on the local group is saying two patients didnt make it out 😢 absolutely heartbreaking if true', note:'HIGH IMPACT — false death rumour enters. Must be corrected without disclosing patient information.'},
  {min:37, plat:'fb', who:'angry',     text:'Two dead apparently. Disgusting. How do you let that happen in a HOSPICE of all places', note:'Rumour hardening into accusation. Wholly untrue.'},
  {min:39, plat:'x',  who:'councillor',text:'I am aware of a serious incident at The Kirkwood in my ward. My thoughts are with patients, families and staff. I am seeking an urgent update. @TheKirkwoodHD'},
  {min:41, plat:'ig', who:'ryan',      text:'Bad scenes on Dalton this afternoon. Thoughts with everyone at the hospice ❤️'},
  {min:43, plat:'x',  who:'examiner',  enquiry:true, text:'@TheKirkwoodHD We have now approached The Kirkwood three times for comment. Can you confirm whether all patients are safe?', note:'Public escalation of an unanswered enquiry.'},
  {min:45, plat:'fb', who:'watch',     text:'Photos from the scene at The Kirkwood. You can see patients in beds out in the open in the car park. Families are saying they still have not been contacted. Casualties not confirmed either way.', packRef:'T+45', note:'PACK T+45 — photo of emergency vehicles plus casualty claim. Patients visible in shot: raises dignity and confidentiality.'},

  // ── PHASE 3 — Clearing station and families (T+45 to T+85) ────────
  {min:47, plat:'x',  who:'exstaff',   text:'not surprised at all this. i worked there til 2 years ago and raised concerns about the fire doors on that corridor more than once. nothing was ever done.', note:'HIGHEST IMPACT ITEM. Plausible, unfalsifiable in the moment, no clean answer. Flagged as the sharpest inject in the script — pull it if the room is already overloaded.'},
  {min:49, plat:'x',  who:'angry',     text:'@TheKirkwoodHD silence speaks volumes doesnt it', burst:true},
  {min:50, plat:'x',  who:'john',      text:'give them a chance, theyre a bit busy saving peoples lives arent they', burst:true},
  {min:52, plat:'fb', who:'amelia',    text:'Please can everyone stop speculating. There are families reading this who are terrified. Wait for the hospice to tell us.'},
  {min:54, plat:'x',  who:'reporter',  enquiry:true, text:'Reporting on the fire at The Kirkwood in Huddersfield. If you are a family member or member of staff affected and willing to talk, my DMs are open.', note:'Journalist going directly to staff and families around the comms team.'},
  {min:55, plat:'x',  who:'regional',  enquiry:true, text:'We have requested an interview with The Kirkwood. Our reporter is at the scene for the 18:00 bulletin. @TheKirkwoodHD', packRef:'T+55', note:'PACK T+55 — interview request with a hard broadcast deadline.'},
  {min:57, plat:'fb', who:'priya',     text:'Its started raining. Those poor patients are outside in the rain. Someone needs to get them under cover.'},
  {min:59, plat:'ig', who:'fatima',    text:'Praying for everyone at The Kirkwood this afternoon 🤲'},
  {min:61, plat:'x',  who:'dave',      text:'ambulance just left with blue lights. thats the second one', note:'Ambiguous — participants may read this as a casualty. It is a routine transfer.'},
  {min:63, plat:'fb', who:'sarahm',    enquiry:true, text:'Has anyone been contacted by the hospice? Genuine question. My aunt is a patient and we have heard nothing at all.'},
  {min:65, plat:'x',  who:'police',    text:'Officers are supporting the emergency response at a premises in Dalton. There is no wider risk to the public. Please do not attend the area.'},

  // ── PHASE 4 — Dispersal and media peak (T+65 to T+115) ────────────
  {min:68, plat:'fb', who:'fiona',     enquiry:true, text:'Message going round the staff group asking if evening shift should still come in. Nobody seems to know. Has anyone heard officially?', packRef:'T+70', note:'PACK T+70 — workforce instruction gap, surfacing publicly instead of internally.'},
  {min:70, plat:'x',  who:'national',  text:'Fire at Huddersfield hospice: patients evacuated to car park as crews tackle blaze. The hospice has been approached for comment.', note:'"Approached for comment" — the phrase that signals silence to every other newsroom.'},
  {min:72, plat:'x',  who:'viral',     text:'Still no statement from @TheKirkwoodHD over two hours in. Families finding out from social media. Poor.', burst:true},
  {min:73, plat:'x',  who:'becky',     text:'to be fair they will be dealing with the actual emergency first', burst:true},
  {min:75, plat:'fb', who:'business',  text:'We are open and have hot drinks for anyone waiting near the hospice. Just come in, no charge. 💛'},
  {min:77, plat:'fb', who:'karen',     text:'UPDATE from me — I have finally spoken to someone and my dad is safe. Thank you to everyone who messaged. Still dont know where he is going tonight.', note:'Softening moment. Good practice being publicly recognised.'},
  {min:79, plat:'fb', who:'worried',   enquiry:true, text:'A local business has offered a whole floor of their building and we can get vans and volunteers there within the hour to help move patients. Who do I speak to? Come on Huddersfield! 💛', packRef:'T+80', note:'PACK T+80 — well-meant unsolicited offer. Must be acknowledged but routed through governance, not accepted ad hoc.'},
  {min:81, plat:'x',  who:'examiner',  text:'The Kirkwood has issued no public statement more than 80 minutes after the first 999 call. Families have told the Examiner they learned of the fire through social media.', note:'If they HAVE posted by now, treat this as a stale-story correction opportunity rather than a fair hit.'},
  {min:83, plat:'ig', who:'tom',       text:'Rain coming down now and theyre still out there. Heartbreaking.'},
  {min:85, plat:'x',  who:'exstaff',   text:'ask them about the fire door report. ask them.', burst:true},
  {min:86, plat:'x',  who:'angry',     text:'@ExaminerHD worth looking into who signed off the fire risk assessment', burst:true},
  {min:88, plat:'fb', who:'diane',     enquiry:true, text:'Two relatives have just turned up at the gate and been turned away. That cant be right can it? They just want to know their family are alive.', packRef:'T+95', note:'PACK T+95 — families arriving on site despite the message not to attend.'},
  {min:90, plat:'x',  who:'regional',  enquiry:true, text:'Our 18:00 bulletin will lead on the Huddersfield hospice fire. We would still welcome a statement or interview from @TheKirkwoodHD.'},
  {min:93, plat:'fb', who:'nikki',     enquiry:true, text:'Whoever is running that hospices Facebook page — people just need to hear something. Anything. Even just "we are here and everyone is safe".'},
  {min:96, plat:'x',  who:'watch',     text:'Understand all patients are now accounted for and being transferred to other facilities. Still no official confirmation. #Huddersfield', note:'Rumour account gets it broadly right this time — muddies whether to trust it.'},
  {min:99, plat:'x',  who:'councillor',text:'I have now spoken to the hospice and can reassure residents that all patients are safe and accounted for. Please support them however you can in the days ahead.', note:'A third party breaks the good news first. Discuss at debrief.'},

  // ── PHASE 5 — Recovery (T+100 to T+150) ───────────────────────────
  {min:102,plat:'fb', who:'norris',    text:'That hospice looked after my mum in her last days. Whatever they need, this town will give them. Tell us what to do and we will do it. 💛'},
  {min:105,plat:'x',  who:'fire',      text:'Crews remain at the scene in Dalton. The building will not be reoccupied today and a fire investigation will begin tomorrow. #WYFRS', packRef:'T+100'},
  {min:108,plat:'fb', who:'amelia',    text:'People are already asking how to donate. Is there an official appeal? Please dont send money anywhere that isnt the hospices own page.', note:'Fraud risk — fake appeals follow real incidents within hours.'},
  {min:110,plat:'x',  who:'national',  text:'Huddersfield hospice fire: all patients safe, building closed for at least 48 hours. Questions now turning to where inpatients will be cared for.'},
  {min:113,plat:'x',  who:'examiner',  enquiry:true, text:'@TheKirkwoodHD Following up — can you confirm how many inpatients have been transferred and where families should direct enquiries this evening?', packRef:'T+110'},
  {min:116,plat:'fb', who:'mohammed',  enquiry:true, text:'I would like to say that once someone did ring me they were very kind and very clear. It was the two hours before that were unbearable.', note:'Fair, measured criticism. Harder to dismiss than anger.'},
  {min:120,plat:'x',  who:'exstaff',   text:'glad everyones safe. still think theres questions to answer about that corridor.'},
  {min:124,plat:'fb', who:'tracy',     enquiry:true, text:'Is the hospice open tomorrow? My mum has day therapy on Thursdays and nobody has said anything.', note:'Business continuity comms — the services nobody has thought about yet.'},
  {min:128,plat:'x',  who:'regional',  text:'The Kirkwood confirmed no patients were injured in this afternoon’s fire. The hospice says its inpatient unit will remain closed while the building is assessed.'},
  {min:132,plat:'fb', who:'gary',      enquiry:true, text:'Genuine question — where do people go now if they need hospice care this week? Asking as a family who might need them.'},
  {min:136,plat:'ig', who:'kevin',     text:'Dalton tonight. Everyone got out. 💛'},
  {min:140,plat:'fb', who:'sandra',    text:'The staff who ran into that building today deserve every bit of praise going. Absolute heroes.'},
  {min:145,plat:'x',  who:'examiner',  text:'ANALYSIS: The Kirkwood fire — what happens to hospice patients when the building goes? Our reporter looks at the pressures on the wider system. Read now.', note:'Story moving from incident to scrutiny. Sets up the recovery comms conversation.'},
];

/* ── Reactions to what the comms team posts ────────────────────────
   Pools are chosen by how long the organisation took to say anything and by
   what the post contains. This is what makes the world answer back. */

export const REACTIONS = {
  /* First organisational post, issued promptly */
  first_fast: [
    {who:'amelia',  text:'Thank you for updating us so quickly. Thinking of all the staff.'},
    {who:'karen',   text:'thank you. thats the first thing ive heard. can you tell us where they are being taken?'},
    {who:'norris',  text:'Thank you for letting us know. Sending love to everyone there. 💛'},
    {who:'examiner',text:'Thank you. Are you able to confirm how many inpatients were in the building at the time?'},
    {who:'john',    text:'good on them for getting something out quick'},
  ],
  /* First organisational post, issued late */
  first_slow: [
    {who:'mohammed',text:'This is the first we have heard and my mother is a patient. Two hours.'},
    {who:'angry',   text:'took you long enough'},
    {who:'karen',   text:'ive been ringing since half one. why has it taken this long to say something'},
    {who:'examiner',text:'Noted, thank you. We approached you four times before this statement — can you say why it took so long?'},
    {who:'amelia',  text:'Thank you. I do think it should have come sooner but I understand you have been busy.'},
    {who:'viral',   text:'2 hours 20 minutes. Screenshot for the record.'},
  ],
  /* Post that confirms patients are safe */
  safe: [
    {who:'tracy',   text:'oh thank god 😭 thank you for telling us'},
    {who:'nikki',   text:'Best news. Well done to every single one of them.'},
    {who:'becky',   text:'so the two that died is not true then? sorry, thats what everyone was saying'},
    {who:'sarahm',  text:'Is that ALL patients? Including the ones in the side rooms?'},
    {who:'norris',  text:'Thank goodness. 💛'},
  ],
  /* Post that does not mention patients at all */
  no_patients: [
    {who:'karen',   text:'but are the patients ok?? you havent said'},
    {who:'mohammed',text:'You have not answered the only question that matters. Are the patients safe.'},
    {who:'angry',   text:'says nothing about the patients. telling isnt it'},
    {who:'examiner',text:'Can you confirm whether all inpatients are accounted for?'},
  ],
  /* Post correcting misinformation */
  correction: [
    {who:'becky',   text:'im so sorry, ive deleted my post. i shouldnt have shared it without checking 😞'},
    {who:'amelia',  text:'Good. People need to stop repeating things they have not verified.'},
    {who:'angry',   text:'convenient'},
    {who:'watch',   text:'We have updated our earlier post following confirmation from the hospice.'},
    {who:'john',    text:'this is why you wait for the official line'},
  ],
  /* Any organisational post, background noise */
  ambient: [
    {who:'fatima',  text:'Thinking of you all 🤲'},
    {who:'gary',    text:'💛'},
    {who:'business',text:'Anything you need, we are just down the road.'},
    {who:'priya',   text:'Thank you for the update.'},
    {who:'owen',    text:'is the road open yet does anyone know'},
    {who:'tom',     text:'Sharing this so people see the actual facts and not the rubbish going round.'},
    {who:'worried', text:'Can we bring anything down? Blankets? Anything?'},
    {who:'diane',   text:'Shared to the Dalton group.'},
  ],
  /* Hostile follow-up, used sparingly */
  hostile: [
    {who:'exstaff', text:'what about the fire doors though'},
    {who:'angry',   text:'still not answered the question about how it started'},
    {who:'viral',   text:'Statement says nothing. No numbers, no cause, no accountability.'},
  ],
};

/* ── Replies to a reply ────────────────────────────────────────────
   When the comms team answers someone directly, that person answers back.
   Chosen by who they replied to, so a journalist pushes and a relative
   softens. Kept short — a direct reply should not spawn a pile-on. */

export const REPLY_REACTIONS = {
  media: [
    {text:'Thank you. And can you confirm the number of inpatients affected?'},
    {text:'Understood. Are you able to make someone available for interview before 18:00?'},
    {text:'Thanks. Do you have a line on the cause at this stage?'},
    {text:'Noted, we will run that. Is that attributable to the Chief Executive?'},
    {text:'Appreciated. Who should we contact for updates this evening?'},
  ],
  family: [
    {text:'Thank you so much. That is all I needed to hear. 💛'},
    {text:'thank you for replying. do you know where he will be going tonight?'},
    {text:'Thank you. Please pass on our thanks to the staff.'},
    {text:'Ok thank you. Is there a number I can ring rather than doing this on Facebook?'},
    {text:'Thank you for coming back to me so quickly. I feel a lot better.'},
  ],
  rumour: [
    {text:'so youre denying it then'},
    {text:'We have updated our post to reflect the hospice statement.'},
    {text:'right ok. still think questions need answering'},
    {text:'noted, thanks for clarifying.'},
  ],
  public: [
    {text:'Thanks for replying, appreciate you taking the time on a day like today.'},
    {text:'Thank you 💛'},
    {text:'Good to see someone actually answering people.'},
    {text:'Understood, thanks.'},
  ],
  official: [
    {text:'Thank you — we will coordinate messaging with you before anything further goes out.'},
    {text:'Noted, thank you. Please continue to direct public enquiries to us.'},
  ],
};

/* ── Trending panel ────────────────────────────────────────────────
   Before the alarm the town is talking about nothing much. Once the story
   breaks the hospice takes over the list — visible escalation the comms team
   can watch happening to them. */

export const TRENDING_BEFORE = [
  {tag:'#Huddersfield',      meta:'Trending in Huddersfield', count:2100},
  {tag:'Wakefield Road',     meta:'Trending in Huddersfield', count:1400},
  {tag:'#HTAFC',             meta:'Trending in Sport',        count:8900},
  {tag:'Kirklees Council',   meta:'Trending in Politics',     count:760},
  {tag:'#SunflowerAppeal',   meta:'Trending in Huddersfield', count:340},
];

export const TRENDING_AFTER = [
  {tag:'#TheKirkwood',       meta:'Trending in Huddersfield', count:14800, rate:180},
  {tag:'Hospice fire',       meta:'Trending in the UK',       count:9200,  rate:120},
  {tag:'#Huddersfield',      meta:'Trending in Huddersfield', count:6400,  rate:70},
  {tag:'#Dalton',            meta:'Trending in Huddersfield', count:3100,  rate:40},
  {tag:'#WYFRS',             meta:'Trending in Huddersfield', count:1900,  rate:20},
];

/* Accounts offered in the sidebar. */
export const SUGGESTED = ['examiner', 'regional', 'fire', 'police', 'councillor'];
