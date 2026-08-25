/* Exercise clock, inject scheduling, pacing and the reaction engine.

   Pacing note: scripted items carry a minute, but they are not fired on the
   minute. Each is nudged by a few seconds, and items marked `burst` are pulled
   tight together, so the feed arrives in clusters and lulls rather than at a
   metronome tick. */

import { SCRIPT, BASELINE, REACTIONS, REPLY_REACTIONS, PHASES, COMMENT_POOL, THREAD_MIX } from './scenario-jupiter.js';
import { persona, ORG } from './personas.js';
import { rnd, pick, sample, agoLabel } from './util.js';

export class Engine {
  constructor(feed){
    this.feed = feed;              // { add(post), comment(post, persona, text), all() }
    /* Time is derived from the wall clock rather than accumulated per frame.
       A phone that locks, or a tab left in the background, throttles timers and
       stops rAF entirely — accumulating would silently freeze that participant's
       exercise clock. Anchoring to Date.now() means they catch up on wake. */
    this._anchorReal = Date.now();
    this._anchorMin = 0;
    this.speed = 1;
    this.running = false;
    this.queue = [];
    this.pending = [];             // reaction replies waiting to land
    this.firstOrgPostMin = null;
    this.orgPostCount = 0;
    this.log = [];
    this._build();
  }

  /* Give a post a plausible comment thread, weighted by who posted it.
     Rumour and media posts attract the biggest, nastiest threads. */
  _makeThread(item, p){
    const mix = THREAD_MIX[p.type] || THREAD_MIX.public;
    const n = (p.type === 'rumour' || p.type === 'media') ? rnd(3, 6) : rnd(1, 4);
    const out = [];
    const used = new Set();
    for (let i = 0; i < n; i++){
      const c = pick(COMMENT_POOL[pick(mix)] || []);
      if (!c || used.has(c.who)) continue;
      used.add(c.who);
      out.push({
        persona: persona(c.who),
        text: c.text,
        min: item.min + 0.4 + i * 0.8,
        nowMin: item.min + 0.4 + i * 0.8,
        likes: rnd(0, 22),
        replies: [],
      });
    }
    return out;
  }

  _build(){
    this.queue = SCRIPT.map((s, i) => {
      const jitter = s.burst ? (Math.random() * 0.35) : (Math.random() * 1.6 - 0.5);
      return {
        ...s,
        id: 'S' + i,
        fireAt: s.min + jitter,
        persona: persona(s.who),
        thread: this._makeThread(s, persona(s.who)),
        scripted: true,
        fired: false,
      };
    }).sort((a, b) => a.fireAt - b.fireAt);
  }

  /* Seed the ordinary day before T+0 so the feed is not empty at the start. */
  seedBaseline(){
    BASELINE.forEach((b, i) => {
      const pp = persona(b.who);
      const post = { ...b, id: 'B' + i, persona: pp, min: b.min, scripted: true,
                     thread: this._makeThread(b, pp) };
      this.feed.add(post, { silent: true });
    });
  }

  get nowMin(){
    if (!this.running) return this._anchorMin;
    return this._anchorMin + ((Date.now() - this._anchorReal) / 60000) * this.speed;
  }

  _setNow(min){ this._anchorMin = min; this._anchorReal = Date.now(); }

  start(){
    if (this.running) return;
    this._anchorReal = Date.now();
    this._lastTick = Date.now();
    this.running = true;
    if (!this._timer) this._timer = setInterval(() => this._tick(), 250);
  }

  pause(){
    this._anchorMin = this.nowMin;
    this.running = false;
  }

  setSpeed(s){
    this._setNow(this.nowMin);
    this.speed = s;
  }

  /* Jump the clock. Anything skipped fires silently so the feed stays coherent. */
  seek(min){
    if (min < this.nowMin) this.reset();
    this._setNow(min);
    this._fireDue(true);
    this._refreshAges();
    if (this.onTick) this.onTick(this.nowMin, this.phase());
  }

  reset(){
    this._setNow(0);
    this.pending = [];
    this.firstOrgPostMin = null;
    this.orgPostCount = 0;
    this.log = [];
    this.feed.clear();
    this._build();
    this.seedBaseline();
  }

  _tick(){
    if (!this.running) return;
    const now = Date.now();
    const dt = Math.min(5, (now - this._lastTick) / 1000);   // cap catch-up after a long sleep
    this._lastTick = now;
    this._fireDue(false);
    this._grow(dt);
    this._refreshAges();
    if (this.onTick) this.onTick(this.nowMin, this.phase());
  }

  _fireDue(silent){
    this.queue.forEach(item => {
      if (!item.fired && item.fireAt <= this.nowMin){
        item.fired = true;
        this.feed.add(item, { silent });
        this.log.push({ min: item.min, kind: 'inject', who: item.persona.name, plat: item.plat, text: item.text, packRef: item.packRef || '' });
      }
    });
    this.pending = this.pending.filter(r => {
      if (r.at > this.nowMin) return true;
      r.run();
      return false;
    });
  }

  /* Engagement climbs while a post sits on screen — nothing stays frozen. */
  _grow(dtSeconds){
    const mins = (dtSeconds * this.speed) / 60;
    this.feed.all().forEach(p => {
      if (!p.counts) return;
      const age = this.nowMin - p.min;
      if (age < 0 || age > 45) return;
      const decay = Math.max(0.15, 1 - age / 45);
      p.counts.likes   += p.counts.rate * mins * 9  * decay * (0.6 + Math.random() * 0.8);
      p.counts.shares  += p.counts.rate * mins * 3  * decay * (0.6 + Math.random() * 0.8);
      p.counts.replies += p.counts.rate * mins * 1.4* decay * (0.6 + Math.random() * 0.8);
      if (Math.random() < 0.25) p.refresh && p.refresh();
    });
  }

  _refreshAges(){
    if (this._lastAgeMin != null && Math.abs(this.nowMin - this._lastAgeMin) < 0.5) return;
    this._lastAgeMin = this.nowMin;
    this.feed.all().forEach(p => {
      if (!p.el) return;
      const label = agoLabel(p.min, this.nowMin);
      p.el.querySelectorAll('.ago').forEach(n => {
        n.textContent = n.textContent.endsWith('AGO') ? label.toUpperCase() + ' AGO' : label;
      });
    });
  }

  phase(){
    const m = this.nowMin;
    let cur = PHASES[0];
    PHASES.forEach(p => { if (m >= p.from) cur = p; });
    return cur;
  }

  nextInject(){
    const n = this.queue.find(i => !i.fired);
    return n ? { in: Math.max(0, n.fireAt - this.nowMin), item: n } : null;
  }

  /* ── The comms team posts ───────────────────────────────────────── */
  participantPost(plat, text){
    const post = {
      id: 'P' + Date.now(),
      plat,
      text,
      persona: ORG,
      min: this.nowMin,
      participant: true,
    };
    this.feed.add(post, { own: true });
    this.orgPostCount += 1;
    const isFirst = this.firstOrgPostMin === null;
    if (isFirst) this.firstOrgPostMin = this.nowMin;
    this.log.push({ min: this.nowMin, kind: 'comms', who: 'The Kirkwood', plat, text });
    this._react(post, isFirst, text);
    if (this.onCommsPost) this.onCommsPost(post, isFirst);
    return post;
  }

  /* ── The comms team replies to someone ──────────────────────────── */
  participantReply(parent, text){
    const reply = {
      id: 'PR' + Date.now(),
      plat: parent.plat,
      text,
      persona: ORG,
      min: this.nowMin,
      participant: true,
      isReply: true,
      replyTo: parent.persona.handle,
      parentId: parent.id,
    };

    // A reply lands in the thread of whatever is being answered — a post, or
    // one specific comment within a post's thread.
    if (parent.isComment) this.feed.commentReply(parent, ORG, text, this.nowMin);
    else this.feed.comment(parent, ORG, text, this.nowMin);

    if (parent.parentPost) parent.parentPost.answered = true;
    parent.answered = true;
    parent.answeredAt = this.nowMin;
    parent.answeredIn = this.nowMin - parent.min;

    this.log.push({
      min: this.nowMin, kind: 'comms-reply', who: 'The Kirkwood', plat: parent.plat, text,
      inReplyTo: parent.persona.name, waitedMin: Number(parent.answeredIn.toFixed(1)),
    });

    this._reactToReply(parent, reply);
    if (this.onCommsReply) this.onCommsReply(parent, reply);
    return reply;
  }

  /* A direct reply gets a direct answer back — one, not a pile-on. */
  _reactToReply(parent, reply){
    const kind = parent.persona.type === 'media'    ? 'media'
               : parent.persona.type === 'family'   ? 'family'
               : parent.persona.type === 'rumour'   ? 'rumour'
               : parent.persona.type === 'official' ? 'official'
               : 'public';
    const pool = REPLY_REACTIONS[kind] || REPLY_REACTIONS.public;
    const line = pick(pool);
    this.pending.push({
      at: this.nowMin + 0.2 + Math.random() * 0.8,
      run: () => {
        if (parent.isComment) this.feed.commentReply(parent, parent.persona, line.text, this.nowMin);
        else this.feed.comment(parent, parent.persona, line.text, this.nowMin);
        this.log.push({ min: this.nowMin, kind: 'reaction', who: parent.persona.name, plat: parent.plat, text: line.text });
      }
    });
  }

  /* Enquiries that asked a direct question and never got an answer. */
  unansweredEnquiries(){
    return this.queue
      .filter(i => i.fired && i.enquiry && !i.answered)
      .map(i => ({ min: i.min, who: i.persona.name, plat: i.plat, text: i.text, packRef: i.packRef || '' }));
  }

  answeredEnquiries(){
    return this.queue
      .filter(i => i.fired && i.enquiry && i.answered)
      .map(i => ({ min: i.min, who: i.persona.name, waitedMin: Number((i.answeredIn || 0).toFixed(1)) }));
  }

  _react(post, isFirst, text){
    const t = (text || '').toLowerCase();
    const mentionsPatients = /\b(patient|patients|everyone|all 12|inpatient|residents|people in our care)\b/.test(t);
    const saysSafe = /\b(safe|safely|accounted for|no injuries|unharmed|all out|evacuated safely)\b/.test(t);
    const isCorrection = /\b(not true|untrue|incorrect|inaccurate|no deaths|nobody has died|no one has died|speculation|unverified|rumour|rumor|please do not share)\b/.test(t);

    const pools = [];
    if (isFirst) pools.push(this.nowMin <= 30 ? REACTIONS.first_fast : REACTIONS.first_slow);
    if (saysSafe) pools.push(REACTIONS.safe);
    if (isCorrection) pools.push(REACTIONS.correction);
    if (!mentionsPatients) pools.push(REACTIONS.no_patients);
    pools.push(REACTIONS.ambient);
    if (this.nowMin > 45 && Math.random() < 0.55) pools.push(REACTIONS.hostile);

    // Two or three from the pointed pools, then ambient filler.
    const chosen = [];
    pools.slice(0, -1).forEach(pool => chosen.push(...sample(pool, rnd(1, 2))));
    chosen.push(...sample(REACTIONS.ambient, rnd(1, 3)));

    // One reply per account per statement — the same outlet answering twice in a
    // row reads as a bug to anyone who works in comms.
    const uniq = [];
    chosen.forEach(c => { if (!uniq.some(u => u.who === c.who)) uniq.push(c); });

    uniq.forEach((r, i) => {
      // Replies land fast, the way they really do — 5s to ~2.5 exercise minutes.
      const at = this.nowMin + (0.08 + i * 0.22 + Math.random() * 0.5);
      this.pending.push({
        at,
        run: () => {
          const who = persona(r.who);
          this.feed.comment(post, who, r.text, this.nowMin);
          this.log.push({ min: at, kind: 'reaction', who: who.name, plat: post.plat, text: r.text });
        }
      });
    });
  }

  /* Minutes from T+0 to the first organisational statement, or null. */
  timeToFirstStatement(){ return this.firstOrgPostMin; }
}
