d,/
  * * 
     *p hVa2s e数,据
库 辅 助 函 数
q u*e s封t装i所o有 nvI2d s相:关 的J数S据O库N操.作
s t*r/i
nigmipfoyr(tq u{e satnido,n Iedqs,) ,i
                n A r r acyu,r rseqnlt I}n dferxo:m  0",d
r i z z lceo-rorremc"t;C
oiumnpto:r t0 ,{

       p owertoCnagrQduse,s
t i oqnuIedsst:i oJnSsO,N
. s tursienrgPiofeyt(C[a]r)d,s
, 
  } )u;s
e r SrteatguerPnr oNgurmebsesr,(
  ( r evs2uGlatm eaSse susnikonnosw,n
  a sv 2{P oientsDeerbttIsd,:
      n uvm2bSetra g}e[s],)
    [}0 ]f?r.oimn s"e.r.t/Iddr i?z?z l0e)/;s
    c}h
e
meax"p;o
ritm paosrytn c{  fguentcDtbi o}n  fgreotmG a"m.e/Sdebs"s;i
o
n/(/s e─s─ si工o具n函I数 d:─ ─n─u─m─b─e─r─)─ ─{─
   ─ ─ ─c─o─n─s─t─ ─d─b─ ─=─ ─a─w─a─i─t─ ─g─e─t─D─b─(─)─;─
─ ─ ─i──f─ ─(─!─d─b─
)
 erxeptourrtn  fnuunlclt;i
o n  cgoentsDti frfoiwcsu l=t yaRwaanigte (dtbi.esreKleeyc:t (s)t.rfirnogm)(:v 2[GnaummebSeers,s inounmsb)e.rw]h e{r
                                                                                                                   e ( ecqo(nvs2tG ammaepS:e sRseicoonrsd.<isdt,r isnegs,s i[onnuImdb)e)r;,
                                                                                                                       n urmebteurr]n>  r=o w{s
                                                                                                                                              [ 0 ]   ?b?r onnuzlel:; 
                                                                                                                   [}1
                                                                                                                   ,
                                                                                                                      e2x]p,o
                                                                                                                   r t   a ssyinlcv efru:n c[t2i,o n3 ]u,p
                                                                                                                   d a t e Sgeoslsdi:o n[A3n,s w3e]r,(
                                                                                                                     
                                                                                                                          s epslsaitoinnIudm::  n[u3m,b e4r],,
                                                                                                                     
                                                                                                                         n e wdCioarmroencdt:C o[u4n,t :4 ]n,u
                                                                                                                   m b e r ,s
                                                                                                                   t a rw:r o[n4g,I d5s]:, 
n u m b ekri[n]g
                                                                                                                   :)  [{5
                                                                                                                         ,   5c]o,n
                                                                                                                   s t  }d;b
  =  raewtauirtn  gmeatpD[bt(i)e;r
K e yi]f  ?(?! d[b1),  r2e]t;u
r}n
;

e x paowrati tf udnbc.tuipodna tseh(uvf2fGlaem<eTS>e(sasriro:n sT)[.]s)e:t (T{[
                                                                            ]   { 
                                                                                c ocrornesctt Cao u=n t[:. .n.eawrCro]r;r
  e c tfCooru n(tl,e
                t   i   =w rao.nlgeQnugetsht i-o n1I;d si:  >J S0O;N .is-t-r)i n{g
                                                                                 i f y ( wcroonnsgtI djs )=, 
                                                                                   M a t}h)..fwlhoeorre((Meaqt(hv.2rGaanmdeoSme(s)s i*o n(si. i+d ,1 )s)e;s
  s i o n I[da)[)i;]
                                                                              ,} 
a
                                                                              [ejx]p]o r=t  [aas[yjn]c,  fau[nic]t]i;o
                                                                              n   f}i
n a lriezteuSrens sai;o
n}(
  s
  essionId: number, passed: boolean) {
  const db = await getDb();
    if (!db) return;
    await db.update(v2GameSessions).set({
          passed,
          completedAt: new Date(),
    }).where(eq(v2GameSessions.id, sessionId));
}

// ── 题目 ──────────────────────────────────────────────────────

export async function getQuestionsByIds(ids: number[]) {
    const db = await getDb();
    if (!db || ids.length === 0) return [];
    const rows = await db.select().from(questions).where(inArray(questions.id, ids));
    // 按照传入的 ids 顺序重新排序，确保题目顺序一致
  const rowMap = new Map(rows.map(r => [r.id, r]));
    return ids.map(id => rowMap.get(id)).filter(Boolean) as typeof rows;
}

export async function getFillQuestionsByDifficulty(minDiff: number, maxDiff: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(questions).where(
          and(
                  eq(questions.questionType, "fill"),
                  sql`${questions.difficulty} >= ${minDiff}`,
                  sql`${questions.difficulty} <= ${maxDiff}`
                )
        );
}

// ── 卡牌 ──────────────────────────────────────────────────────

export async function getAllPoetCards() {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(poetCards).orderBy(poetCards.id);
}

export async function getUserOwnedCardIds(sessionKey: string) {
    const db = await getDb();
    if (!db) return new Set<number>();
    const rows = await db.select({ cardId: userPoetCards.cardId })
      .from(userPoetCards)
      .where(eq(userPoetCards.sessionKey, sessionKey));
    return new Set(rows.map((r) => r.cardId));
}

export async function getUserCards(sessionKey: string) {
    const db = await getDb();
    if (!db) return [];
    return db.select({
          id: userPoetCards.id,
          cardId: userPoetCards.cardId,
          obtainedAt: userPoetCards.obtainedAt,
          stageId: userPoetCards.stageId,
          poetName: poetCards.poetName,
          dynasty: poetCards.dynasty,
          imageUrl: poetCards.imageUrl,
          rarity: poetCards.rarity,
          description: poetCards.description,
          signaturePoem: poetCards.signaturePoem,
    })
      .from(userPoetCards)
      .innerJoin(poetCards, eq(userPoetCards.cardId, poetCards.id))
      .where(eq(userPoetCards.sessionKey, sessionKey))
      .orderBy(userPoetCards.obtainedAt);
}

export async function dropCards(sessionKey: string, stageId: number, count: number) {
    const db = await getDb();
    if (!db || count <= 0) return [];
    const all = await getAllPoetCards();
    const shuffled = shuffle(all);
    const toDrop = shuffled.slice(0, count);
    for (const card of toDrop) {
          await db.insert(userPoetCards).values({ sessionKey, cardId: card.id, stageId });
    }
    return toDrop.map((c) => ({
          id: c.id,
          poetName: c.poetName,
          imageUrl: c.imageUrl,
          rarity: c.rarity,
          signaturePoem: c.signaturePoem,
    }));
}
