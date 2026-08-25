/* Deterministic randomness.

   Every device runs the same script, so rather than pushing 65 injects and
   several hundred generated comments over the network, each device generates
   them itself and only the clock is shared. That only works if "random" means
   the same thing everywhere — otherwise the facilitator's screen shows a
   different comment thread from the comms team's, which would be worse than
   having no threads at all.

   So all scenario generation draws from a seeded generator keyed by a stable
   id. Live things — a participant's post, a reaction to it — are genuinely
   shared through Firebase and do not use this. */

/* FNV-1a: small, fast, stable across browsers. */
export function hash(str){
  let h = 2166136261;
  for (let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* mulberry32 — tiny seeded PRNG, good enough for scenery. */
export function seeded(seed){
  let a = typeof seed === 'string' ? hash(seed) : (seed >>> 0);
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Convenience wrappers around a seeded stream. */
export function stream(seed){
  const r = seeded(seed);
  return {
    next: r,
    int: (a, b) => Math.floor(r() * (b - a + 1)) + a,
    pick: arr => arr[Math.floor(r() * arr.length)],
    range: (a, b) => a + r() * (b - a),
  };
}
