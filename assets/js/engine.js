/* Exercise clock, inject scheduling, pacing and the reaction engine.

   Pacing note: scripted items carry a minute, but they are not fired on the
   minute. Each is nudged by a few seconds, and items marked `burst` are pulled
   tight together, so the feed arrives in clusters and lulls rather than at a
   metronome tick. */

import { SCRIPT, CHANNEL_SCRIPT, BASELINE, REACTIONS, REPLY_REACTIONS, PHASES, THREADS } from './scenario-jupiter.js?v=28';
import { persona, ORG, PERSONAS as PERSONA_KEYS } from './personas.js?v=28';
import { rnd, pick, sample, agoLabel } from './util.js?v=28';
import { stream } from './rng.js?v=28';

export class Engine {
  constructor(feed, opts = {}){
    this.feed = feed;
    this.seed = opts.seed || 'jupiter-1';              // { add(post), comment(post, persona, text), all() }
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
    this._localSeq = 0;
    this.live = { posts: [], comments: [] };
    this._build();
  }

  /* Build a post's thread from the authored list in THREADS, keyed by the
     post's minute. Nothing is generated: a comment only ever appears under the
     post it was written for. Likes are seeded so every device agrees. */
  _makeThread(item, p, postId){
    const authored = THREADS[String(item.min)] || THREADS[item.min] || [];
    const r = stream('thread:' + this.seed + ':' + postId);
    return authored.map((c, i) => ({
      id: postId + '#c' + i,
      persona: persona(c.who),
      text: c.text,
      min: item.min + 0.4 + i * 0.9,
      likes: r.int(0, 18),
      replies: [],
    }));
  }

  _build(){
    this.queue = SCRIPT.concat(CHANNEL_SCRIPT).map((s, i) => {
      // Seeded per item, so every device fires this inject at the same moment.
      const r = stream('jitter:' + this.seed + ':' + i);
      const jitter = s.burst ? r.range(0, 0.35) : r.range(-0.5, 1.1);
      const postId = 'S' + i;
      return {
        ...s,
        id: postId,
        fireAt: s.min + jitter,
        persona: persona(s.who),
        thread: this._makeThread(s, persona(s.who), postId),
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
                     thread: this._makeThread(b, pp, 'B' + i) };
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

  /* Jump the clock. Anything skipped fires silently so the feed stays coherent.
     Going backwards rebuilds the scripted content — but live posts and replies
     are replayed afterwards, never discarded. Firebase delivers each record
     once, so anything dropped here would be gone from this device for good. */
  seek(min){
    if (min < this.nowMin) this._rebuildScripted();
    this._setNow(min);
    this._fireDue(true);
    this._replayLive();
    this._refreshAges();
    if (this.onTick) this.onTick(this.nowMin, this.phase());
  }

  _rebuildScripted(){
    this.pending = [];
    this.firstOrgPostMin = null;
    this.orgPostCount = 0;
    this.log = [];
    this.feed.clear();
    this._build();
    this.seedBaseline();
  }

  /* Re-apply anything live that belongs at or before the current time. */
  _replayLive(){
    this.live.posts.forEach(rec => {
      if (rec.min <= this.nowMin && !this.findPost(rec.id)) this.applyPost(rec);
    });
    this.live.comments.forEach(rec => {
      if (rec.min <= this.nowMin) this.applyComment(rec);
    });
  }

  /* Full reset — the facilitator deliberately clearing the decks. */
  reset(){
    this._setNow(0);
    this.live = { posts: [], comments: [] };
    this._rebuildScripted();
  }

  _tick(){
    if (!this.running) return;
    this._lastTick = Date.now();
    this._fireDue(false);
    this._updateCounts();
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

  /* Engagement is a pure function of how old a post is, not an accumulating
     random walk. Two devices looking at the same post therefore show the same
     numbers, and pausing or seeking the clock cannot cause drift. */
  _updateCounts(){
    this.feed.all().forEach(p => {
      if (!p.counts) return;
      const age = Math.max(0, this.nowMin - p.min);
      const a = Math.min(age, 45);
      const curve = a - (a * a) / 90 + (age > 45 ? (age - 45) * 0.06 : 0);
      const k = p.counts.wobble * p.counts.rate * curve;
      const likes  = Math.round(p.counts.baseLikes  + k * 9);
      const shares = Math.round(p.counts.baseShares + k * 3);
      if (likes !== p.counts.likes || shares !== p.counts.shares){
        p.counts.likes = likes;
        p.counts.shares = shares;
        p.refresh && p.refresh();
      }
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

  /* ── Live actions ────────────────────────────────────────────────
     Anything a person does is published to the transport and rendered when it
     comes back, so a single device and eight devices take the same code path. */

  attach(transport){
    this.transport = transport;
    transport.on('post',    rec => this.applyPost(rec));
    transport.on('comment', rec => this.applyComment(rec));
  }

  findPost(id){ return this.feed.all().find(p => p.id === id); }

  findComment(id){
    for (const p of this.feed.all()){
      for (const c of (p.thread || [])){
        if (c.id === id){ c.parentPost = p; c.plat = p.plat; c.isComment = true; return c; }
      }
    }
    return null;
  }

  personaKey(p){
    return Object.keys(PERSONA_KEYS).find(k => PERSONA_KEYS[k] === p) || null;
  }

  /* The comms team writes a new post. */
  participantPost(plat, text){
    const rec = { kind: 'post', plat, text, who: 'kirkwood', min: this.nowMin };
    const id = this._publishPost(rec);
    // Reactions are generated by the device that posted, then shared from
    // there, so everyone sees the same replies rather than inventing their own.
    this._scheduleReactions(id, plat, text);
    return id;
  }

  /* The comms team replies to a post, or to one comment inside a thread.
     Logging and enquiry-marking happen in applyComment, so they occur on every
     device rather than only the one that typed the reply. */
  participantReply(parent, text){
    const postId = parent.isComment ? (parent.parentPost && parent.parentPost.id) : parent.id;
    this._publishComment({
      kind: 'comment',
      post: postId,
      parent: parent.isComment ? parent.id : null,
      who: 'kirkwood',
      text,
      min: this.nowMin,
    });
    this._scheduleReplyBack(parent);
    if (this.onCommsReply) this.onCommsReply(parent);
  }

  /* ── Applying whatever comes back ───────────────────────────────── */

  applyPost(rec){
    if (!this.live.posts.some(r => r.id === rec.id)) this.live.posts.push(rec);
    if (this.findPost(rec.id)) return;
    const own = rec.who === 'kirkwood';
    const post = {
      id: rec.id, plat: rec.plat, text: rec.text, persona: persona(rec.who),
      min: rec.min, participant: own, thread: [],
      via: rec.via, subject: rec.subject,
      enquiry: rec.plat === 'inbox' && !own,
    };
    this.feed.add(post, { own });
    if (own){
      const isFirst = this.firstOrgPostMin === null;
      if (isFirst) this.firstOrgPostMin = rec.min;
      this.orgPostCount += 1;
      this.log.push({ min: rec.min, kind: 'comms', who: 'The Kirkwood', plat: rec.plat, text: rec.text });
      if (this.onCommsPost) this.onCommsPost(post, isFirst);
    }
  }

  applyComment(rec){
    if (!this.live.comments.some(r => r.id === rec.id)) this.live.comments.push(rec);
    const post = this.findPost(rec.post);
    if (!post) return;
    const who = persona(rec.who);
    const target = rec.parent ? this.findComment(rec.parent) : null;
    if (target) this.feed.commentReply(target, who, rec.text, rec.min, rec.id);
    else this.feed.comment(post, who, rec.text, rec.min, rec.id);

    if (rec.who !== 'kirkwood') return;

    // An organisational reply answers the post it sits under. Recording it here
    // rather than where it was typed means the facilitator's dashboard and every
    // other device agree on what has been answered and how long it took.
    if (this._loggedReplies && this._loggedReplies.has(rec.id)) return;
    (this._loggedReplies = this._loggedReplies || new Set()).add(rec.id);

    post.answered = true;
    post.answeredAt = rec.min;
    post.answeredIn = Math.max(0, rec.min - post.min);
    const q = this.queue.find(i => i.id === post.id);
    if (q){ q.answered = true; q.answeredIn = post.answeredIn; }

    // Repaint after the timing is known, so the inbox can show how long it took.
    if (this.feed.refreshInbox) this.feed.refreshInbox();

    this.log.push({
      min: rec.min,
      kind: 'comms-reply',
      who: 'The Kirkwood',
      plat: post.plat,
      text: rec.text,
      inReplyTo: (target ? target.persona.name : post.persona.name),
      waitedMin: Number(post.answeredIn.toFixed(1)),
    });
    if (this.onCommsReply) this.onCommsReply(post);
  }

  /* ── Publishing ─────────────────────────────────────────────────── */

  _publishPost(rec){
    if (this.transport) return this.transport.publishPost(rec);
    const id = 'P' + (++this._localSeq);
    this.applyPost({ ...rec, id });
    return id;
  }

  _publishComment(rec){
    if (this.transport){ this.transport.publishComment(rec); return; }
    this.applyComment({ ...rec, id: 'PC' + (++this._localSeq) });
  }

  /* ── Reaction generation (author device only) ───────────────────── */

  _scheduleReactions(postId, plat, text){
    const t = (text || '').toLowerCase();
    const mentionsPatients = /\b(patient|patients|everyone|all 12|inpatient|residents|people in our care)\b/.test(t);
    const saysSafe = /\b(safe|safely|accounted for|no injuries|unharmed|all out|evacuated safely)\b/.test(t);
    const isCorrection = /\b(not true|untrue|incorrect|inaccurate|no deaths|nobody has died|no one has died|speculation|unverified|rumour|rumor|please do not share)\b/.test(t);
    const isFirst = this.orgPostCount <= 1;

    const pools = [];
    if (isFirst) pools.push(this.nowMin <= 30 ? REACTIONS.first_fast : REACTIONS.first_slow);
    if (saysSafe) pools.push(REACTIONS.safe);
    if (isCorrection) pools.push(REACTIONS.correction);
    if (!mentionsPatients) pools.push(REACTIONS.no_patients);
    if (this.nowMin > 45 && Math.random() < 0.55) pools.push(REACTIONS.hostile);

    const chosen = [];
    pools.forEach(pool => chosen.push(...sample(pool, rnd(1, 2))));
    chosen.push(...sample(REACTIONS.ambient, rnd(1, 3)));

    const uniq = [];
    chosen.forEach(c => { if (!uniq.some(u => u.who === c.who)) uniq.push(c); });

    uniq.forEach((r, i) => {
      this.pending.push({
        at: this.nowMin + (0.08 + i * 0.22 + Math.random() * 0.5),
        run: () => {
          this._publishComment({ kind: 'comment', post: postId, parent: null, who: r.who, text: r.text, min: this.nowMin });
          this.log.push({ min: this.nowMin, kind: 'reaction', who: persona(r.who).name, plat, text: r.text });
        }
      });
    });
  }

  /* Whoever was answered answers back — one reply, in character. */
  _scheduleReplyBack(parent){
    const kind = parent.persona.type === 'media'    ? 'media'
               : parent.persona.type === 'family'   ? 'family'
               : parent.persona.type === 'rumour'   ? 'rumour'
               : parent.persona.type === 'official' ? 'official'
               : 'public';
    const line = pick(REPLY_REACTIONS[kind] || REPLY_REACTIONS.public);
    const postId = parent.isComment ? (parent.parentPost && parent.parentPost.id) : parent.id;
    const parentId = parent.isComment ? parent.id : null;
    const whoKey = this.personaKey(parent.persona);
    this.pending.push({
      at: this.nowMin + 0.2 + Math.random() * 0.8,
      run: () => {
        this._publishComment({ kind: 'comment', post: postId, parent: parentId, who: whoKey, text: line.text, min: this.nowMin });
        this.log.push({ min: this.nowMin, kind: 'reaction', who: parent.persona.name, plat: parent.plat, text: line.text });
      }
    });
  }

  /* Every enquiry in play — scripted, and any the facilitator fired by hand.
     Counting only the scripted ones made the dashboard under-report. */
  _allEnquiries(){
    const scripted = this.queue.filter(i => i.fired && i.enquiry);
    const live = this.feed.all().filter(p => p.enquiry && !this.queue.some(q => q.id === p.id));
    return scripted.concat(live);
  }

  unansweredEnquiries(){
    return this._allEnquiries()
      .filter(i => !i.answered)
      .map(i => ({ min: Math.round(i.min), who: i.persona.name, plat: i.plat, text: i.text, packRef: i.packRef || '' }))
      .sort((a, b) => a.min - b.min);
  }

  answeredEnquiries(){
    return this._allEnquiries()
      .filter(i => i.answered)
      .map(i => ({ min: Math.round(i.min), who: i.persona.name, waitedMin: Number((i.answeredIn || 0).toFixed(1)) }))
      .sort((a, b) => a.min - b.min);
  }

  timeToFirstStatement(){ return this.firstOrgPostMin; }
}
