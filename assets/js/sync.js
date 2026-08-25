/* Multi-device sync.

   What crosses the network is deliberately small:

     clock      one record the facilitator owns — anchor, speed, running
     posts      what participants and the facilitator actually write
     comments   replies and reactions to those

   The 65 scripted injects and their comment threads are NOT sent. Every device
   generates them from the seeded generator in rng.js and fires them off the
   shared clock, so they arrive identically everywhere. That keeps traffic to a
   trickle, which matters when half the team is on mobile data in a car park.

   Everything renders from the transport, never directly, so local-only mode and
   live mode take exactly the same path through the code.  */

const FIREBASE_VERSION = '12.10.0';
const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

const CONFIG = {
  apiKey: "AIzaSyDezHiKveTfhlEuJtnFrVjYbj3tglZZ-pE",
  authDomain: "socialsim-exercises.firebaseapp.com",
  databaseURL: "https://socialsim-exercises-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "socialsim-exercises",
  storageBucket: "socialsim-exercises.firebasestorage.app",
  messagingSenderId: "140875258847",
  appId: "1:140875258847:web:da6d03172d16da29d8026a"
};

/* Namespaced away from the original tool so nothing can collide with it. */
const ROOT = 'jupiter';

/* ── Local transport ─────────────────────────────────────────────────
   Single device. Publishing delivers straight back. Used for the preview,
   and as the fallback if Firebase cannot be reached. */
export function localTransport(){
  const handlers = {};
  let n = 0;
  return {
    mode: 'local',
    connected: false,
    on(evt, fn){ handlers[evt] = fn; },
    publishPost(rec){ const r = { ...rec, id: 'L' + (++n) }; handlers.post && handlers.post(r); return r.id; },
    publishComment(rec){ const r = { ...rec, id: 'LC' + (++n) }; handlers.comment && handlers.comment(r); return r.id; },
    publishLog(){},
    setClock(){},
    setSettings(){},
    goOffline(){},
    goOnline(){},
    clearAll(){},
    ready: Promise.resolve(),
  };
}

/* ── Firebase transport ──────────────────────────────────────────── */
export async function firebaseTransport(session){
  const [{ initializeApp }, dbMod, authMod] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-database.js`),
    import(`${CDN}/firebase-auth.js`),
  ]);
  const { getDatabase, ref, push, set, onChildAdded, onValue, remove, serverTimestamp } = dbMod;
  const { getAuth, signInAnonymously } = authMod;

  const app = initializeApp(CONFIG, 'jupiter-' + session);
  const db = getDatabase(app);
  try { await signInAnonymously(getAuth(app)); } catch (e) { /* rules may allow open access */ }

  const base = `${ROOT}/${session}`;
  const handlers = {};
  let offset = 0;                      // our clock vs Firebase's

  onValue(ref(db, '.info/serverTimeOffset'), snap => { offset = snap.val() || 0; });

  const online = { value: false };
  onValue(ref(db, '.info/connected'), snap => {
    online.value = !!snap.val();
    handlers.connection && handlers.connection(online.value);
  });

  onChildAdded(ref(db, `${base}/posts`), snap => {
    handlers.post && handlers.post({ ...snap.val(), id: snap.key });
  });
  onChildAdded(ref(db, `${base}/comments`), snap => {
    handlers.comment && handlers.comment({ ...snap.val(), id: snap.key });
  });
  onValue(ref(db, `${base}/clock`), snap => {
    const v = snap.val();
    if (v) handlers.clock && handlers.clock(v);
  });
  onValue(ref(db, `${base}/settings`), snap => {
    handlers.settings && handlers.settings(snap.val() || {});
  });

  return {
    mode: 'firebase',
    get connected(){ return online.value; },
    serverNow(){ return Date.now() + offset; },
    on(evt, fn){ handlers[evt] = fn; },
    publishPost(rec){ return push(ref(db, `${base}/posts`), rec).key; },
    publishComment(rec){ return push(ref(db, `${base}/comments`), rec).key; },
    publishLog(rec){ push(ref(db, `${base}/log`), rec); },
    setClock(state){ set(ref(db, `${base}/clock`), { ...state, at: serverTimestamp() }); },
    setSettings(state){ set(ref(db, `${base}/settings`), state); },
    goOffline(){ dbMod.goOffline(db); },      // used to test dropout handling
    goOnline(){ dbMod.goOnline(db); },
    async clearAll(){
      await Promise.all([
        remove(ref(db, `${base}/posts`)),
        remove(ref(db, `${base}/comments`)),
        remove(ref(db, `${base}/log`)),
        remove(ref(db, `${base}/clock`)),
        remove(ref(db, `${base}/settings`)),
      ]);
    },
    ready: Promise.resolve(),
  };
}

/* Pick a transport. Falls back to local rather than failing outright, so a
   participant who loses Firebase still sees the scripted exercise run. */
export async function connect(session, { offline = false } = {}){
  if (offline) return localTransport();
  try {
    const t = await firebaseTransport(session);
    return t;
  } catch (err){
    console.warn('Jupiter: falling back to local mode —', err && err.message);
    return localTransport();
  }
}
