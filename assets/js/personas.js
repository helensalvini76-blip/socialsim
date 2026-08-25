/* Exercise Jupiter — cast list.
   Every person here is invented. The Kirkwood, Dalton and the Huddersfield
   geography are real; no real journalist, resident, relative or member of
   hospice staff is named or depicted. Photos reuse the existing image set. */

const IMG = 'images/';

export const PERSONAS = {
  // ── Local residents & passers-by ──────────────────────────────────
  liam:      {name:'Liam Carr',          handle:'@liamcarr92',       photo:IMG+'liam-carr.jpg',       type:'public'},
  darren:    {name:'Darren Stubbs',      handle:'@darrenstubbs',     photo:IMG+'darren-stubbs.jpg',   type:'public'},
  ryan:      {name:'Ryan Stephens',      handle:'@ryanstephens_',    photo:IMG+'ryan-stephens.jpg',   type:'public'},
  becky:     {name:'Becky Turner',       handle:'@beckyturner81',    photo:IMG+'becky-turner.jpg',    type:'public'},
  tracy:     {name:'Tracy Hobbs',        handle:'@tracyhobbs_hd',    photo:IMG+'tracy-hobbs.jpg',     type:'public'},
  nikki:     {name:'Nikki Rhodes',       handle:'@nikkirhodes',      photo:IMG+'nikki-rhodes.jpg',    type:'public'},
  owen:      {name:'Owen Hughes',        handle:'@owenhughes_',      photo:IMG+'owen-hughes.jpg',     type:'public'},
  kevin:     {name:'Kevin Park',         handle:'@kevpark',          photo:IMG+'kevin-park.jpg',      type:'public'},
  sandra:    {name:'Sandra Yates',       handle:'@sandrayates',      photo:IMG+'sandra-yates.jpg',    type:'public'},
  john:      {name:'John Dobson',        handle:'@jdobson_hd',       photo:IMG+'john-dobson.jpg',     type:'public'},
  mike:      {name:'Mike Tanner',        handle:'@miketanner',       photo:IMG+'mike-tanner.jpg',     type:'public'},
  paul:      {name:'Paul Okafor',        handle:'@paulokafor',       photo:IMG+'paul-okafor.jpg',     type:'public'},
  priya:     {name:'Priya Sharma',       handle:'@priyasharma_hd',   photo:IMG+'priya-sharma.jpg',    type:'public'},
  fatima:    {name:'Fatima Al-Hassan',   handle:'@fatima_alh',       photo:IMG+'fatima-al-hassan.jpg',type:'public'},
  gary:      {name:'Gary Bolton',        handle:'@garybolton_fc',    photo:IMG+'gary-bolton.jpg',     type:'public'},
  dave:      {name:'Dave Briggs',        handle:'@davebriggs_hd',    photo:IMG+'dave-briggs.jpg',     type:'public'},
  tom:       {name:'Tom Ashworth',       handle:'@tom_ashworth',     photo:IMG+'tom-ashworth.jpg',    type:'public'},
  neighbour: {name:'Helen Brookes',      handle:'@brookes_dalton',   photo:IMG+'helpful-neighbour.jpg',type:'public'},
  business:  {name:'Dalton Mini Market', handle:'@daltonminimkt',    photo:IMG+'local-business-owner.jpg',type:'public'},

  // ── Families & people connected to the hospice ────────────────────
  karen:     {name:'Karen Whitfield',    handle:'@karen_whitfield',  photo:IMG+'Karen-whitfield.jpg', type:'family'},
  diane:     {name:'Diane Fletcher',     handle:'@dianefletcher',    photo:IMG+'Diane-fletcher.jpg',  type:'family'},
  amelia:    {name:'Amelia Cross',       handle:'@ameliacross',      photo:IMG+'amelia-cross.jpg',    type:'family'},
  fiona:     {name:'Fiona Macleod',      handle:'@fionamacleod',     photo:IMG+'fiona-macleod.jpg',   type:'family'},
  mohammed:  {name:'Mohammed Iqbal',     handle:'@m_iqbal_hd',       photo:IMG+'Mohammed-iqbal.jpg',  type:'family'},
  sarahm:    {name:'Sarah Mitchell',     handle:'@sarahmitchell',    photo:IMG+'Sarah-mitchell.jpg',  type:'family'},
  norris:    {name:'Janet Norris',       handle:'@janetnorris_',     photo:IMG+'janet-bill-norris.jpg',type:'family'},
  worried:   {name:'Claire Beaumont',    handle:'@clairebeaumont',   photo:IMG+'worried-parent.jpg',  type:'family'},

  // ── Media (invented outlets and bylines) ──────────────────────────
  examiner:  {name:'Huddersfield Examiner',handle:'@ExaminerHD',     photo:IMG+'huddersfield-examiner.jpg',type:'media',verified:true},
  regional:  {name:'Calder Valley News',  handle:'@CalderValleyNews',photo:IMG+'bbc-regional-news.jpg',type:'media',verified:true},
  national:  {name:'Northern Wire',       handle:'@NorthernWire',    photo:IMG+'sky-news.jpg',        type:'media',verified:true},
  reporter:  {name:'James Whitmore',      handle:'@jwhitmore_news',  photo:IMG+'mike-tanner.jpg',     type:'media'},

  // ── Official / partner accounts ───────────────────────────────────
  police:    {name:'West Yorkshire Police',handle:'@WYPKirklees',    photo:IMG+'police-service.jpg',  type:'official',verified:true},
  fire:      {name:'West Yorkshire Fire & Rescue',handle:'@WYFRS',   photo:IMG+'police-service.jpg',  type:'official',verified:true},
  councillor:{name:'Cllr James Walsh',    handle:'@cllr_james_w',    photo:IMG+'cllr-james-walsh.jpg',type:'official',verified:true},

  // ── Rumour and hostility ──────────────────────────────────────────
  watch:     {name:'Huddersfield Watch',  handle:'@hudds_watch',     photo:IMG+'local-watch-account.jpg',type:'rumour'},
  viral:     {name:'Yorkshire Incidents', handle:'@yorks_incidents', photo:IMG+'viral-rumour-account.jpg',type:'rumour'},
  angry:     {name:'Baz',                 handle:'@baz_hd1',         photo:IMG+'angry-local.jpg',     type:'rumour'},
  exstaff:   {name:'Michelle Dyson',      handle:'@micheeed77',      photo:IMG+'conspiracy-account.jpg',type:'rumour'},

  // ── Hospice staff (staff channel only, never on public feeds) ─────
  sister:    {name:'Nina Whitaker',       handle:'Sister, IPU',            photo:'', type:'staff'},
  facilities:{name:'Rob Attwell',         handle:'Facilities',             photo:'', type:'staff'},
  hcaJoy:    {name:'Joy Mensah',          handle:'HCA, IPU',               photo:'', type:'staff'},
  nurseSam:  {name:'Sam Okoro',           handle:'Staff Nurse',            photo:'', type:'staff'},
  fundraise: {name:'Bex Hartley',         handle:'Fundraising',            photo:'', type:'staff'},
  daytherapy:{name:'Lorna Beckett',       handle:'Day Therapy',            photo:'', type:'staff'},
  reception: {name:'Pauline Grant',       handle:'Reception',              photo:'', type:'staff'},
  exec:      {name:'Alison Frame',        handle:'Director of Care',       photo:'', type:'staff'},

  // ── Enquiry senders (inbox only) ──────────────────────────────────
  boardMember:{name:'Geoffrey Hale',      handle:'Trustee',                photo:'', type:'official'},
  icb:       {name:'Kirklees ICB',        handle:'System Coordination',    photo:'', type:'official'},
  tvProducer:{name:'Rhian Doyle',         handle:'Calder Valley News',     photo:IMG+'bbc-regional-news.jpg', type:'media'},

  // ── The organisation (the comms team posts as this) ───────────────
  kirkwood:  {name:'The Kirkwood',        handle:'@TheKirkwoodHD',   photo:'',     type:'org',verified:true},
};

/* The account the comms team posts as. */
export const ORG = PERSONAS.kirkwood;

export function persona(key){
  return PERSONAS[key] || {name:key, handle:'@'+String(key).toLowerCase(), type:'public'};
}
