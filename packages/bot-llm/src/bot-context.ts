import type { ComputerPosition } from '@bc/game';

const decks = [
  { id: 'exp01', prefix: 'ECO', file: '001-expansion01.md', label: 'Economy & Labor (EXP-01-02-C/05). Labor Market is a regular Hotspot. Control of Investment Program and a Grassroots enables an alternate 2-ECO conversion at that Grassroots.' },
  { id: 'exp02', prefix: 'SEC', file: '002-expansion02.md', label: 'Security & Order (EXP-02-02/04/05). Inner Order can place a Regulation on enclosure. A controlled Authority Apparatus can move or remove a Regulation. At the applicable tile, Blockade prohibits effects, SecurityLevel reduces eligible outputs, and Control and Administration add costs to paid effects.' },
  { id: 'exp03', prefix: 'CLM', file: '003-expansion03.md', label: 'Climate & Future. Climate costs and replacements are included in the listed payment options. Apply card effects only in their stated windows.' },
] as const;

const ruleBrief = [
  'Goal (CORE-01-09): after the last draw, finish its legal action sequence and the final Settlement. The most real Influence markers on the board wins. Top ties share the win. Resources, markers in reserve and virtual Influence do not score.',
  'Turn (CORE-01-04): place the revealed tile in an empty adjacent hex. Resolve any enclosures, then choose a legal Political Action. The engine handles draws, mandatory skips, and automatic effects.',
  'Political actions (CORE-01-04/08): place one marker from your reserve or move one of yours already on the board. After everyone has placed all starting markers, pay two different resources at a controlled Committee to formalize one marker into reserve, up to seven total markers. The Start Committee offers one formalization per player without control, costs three different resources plus one of any resort, and normally ignores modifiers. You cannot place or move a marker onto it. A controlled Grassroots can trade three resources of one resort for one of another before modifiers.',
  'Control (CORE-01-05): a unique positive majority controls a tile. A controlled Lobbyist adds one virtual Influence to adjacent tiles except other Lobbyists and the Start Committee. Hex neighbors differ by (1,0), (1,-1), (0,-1), (-1,0), (-1,1), or (0,1).',
  'Hotspots and production (CORE-01-06/07): first full enclosure triggers a Hotspot before the political action. Its usual payout places one reserve marker for the majority player. Resort tiles produce at Settlement after each round. Positive ties split output among leaders and remainders go to Noise. Zero Influence produces nothing.',
];

type RuleFile = typeof decks[number]['file'];

export function createBotPositionDescriber(readRules: (file: RuleFile) => string) {
  const cardRules = new Map<string, Map<string, string>>();
  return (position: ComputerPosition, playerID: string) => describeBotPosition(position, playerID, visibleCardRules);

  function visibleCardRules(file: RuleFile, prefix: string, visible: Set<string | null>): string[] {
    let catalog = cardRules.get(file);
    if (!catalog) {
      catalog = new Map();
      for (const section of readRules(file).split(/^#{1,2} /m)) {
        const match = /^(EXP-\d\d-08-(M\d\d)) — (.+)\r?\n/.exec(section);
        if (!match) continue;
        const [, ruleId, number, title] = match;
        const clauses = section.slice(match[0].length).split(new RegExp(`^${ruleId}-\\d{2}[A-Z]? `, 'm')).slice(1)
          .map(clause => clause.replace(/^---$/gm, '').trim()).filter(clause => !/^Name: /.test(clause));
        catalog.set(`${prefix}_${number}`, `${prefix}_${number} ${title}: ${clauses.join(' ')}`);
      }
      cardRules.set(file, catalog);
    }
    return [...catalog].filter(([id]) => visible.has(id)).map(([, text]) => text);
  }
}

/** Format an allowlist from the public projection. Its simulated piles are also excluded. */
function describeBotPosition({ G, ctx }: ComputerPosition, playerID: string,
  visibleCardRules: (file: RuleFile, prefix: string, visible: Set<string | null>) => string[]): string {
  const { tiles, allTiles, players, influencesOnBoard, resources, activeMeasureEffects } = G.exp.core;
  const expansions = decks.filter(({ id }) => G.cfg.expansions[id]);
  const measureZones = expansions.flatMap(({ id }) => {
    const deck = G.exp[id]?.measures;
    if (!deck) return [];
    const { open, hands, drawPile, recycle, finalDiscard, playCounts } = deck;
    const played = Object.fromEntries(Object.entries(playCounts).filter(([, count]) => count > 0));
    return [{ id, open, hands, cardsLeft: drawPile.length, recycledCount: recycle.length, finalDiscard, playCounts: played }];
  });
  const visible = new Set(measureZones.flatMap(({ open, hands }) => [...open, ...Object.values(hands).flat()]));
  for (const effect of activeMeasureEffects ?? []) visible.add(effect.sourceCardId);
  const position = {
    you: playerID,
    turn: ctx.turn,
    currentPlayer: ctx.currentPlayer,
    stage: ctx.activePlayers?.[playerID],
    turnOrder: ctx.playOrder,
    variants: G.cfg.variants,
    tilesLeft: tiles.drawPile.length,
    drawnTile: tiles.drawResolution ? allTiles[tiles.drawResolution.tileId] : null,
    board: tiles.board.map(({ tileId, coord, enclosureProcessed }) => {
      const tile = allTiles[tileId];
      return [coord.q, coord.r, tileId, tile.kind, tile.kind === 'ResortTile' ? `${tile.resort}:${tile.w}` : null,
        ...(enclosureProcessed ? ['enclosure resolved'] : [])];
    }),
    markers: influencesOnBoard?.map(({ tileId, owner, id }) => [tileId, owner, id]) ?? [],
    players,
    resources,
    ...(measureZones.length ? { measureZones, activeMeasureEffects, playedMeasureThisRound: G.exp.core.playedMeasureThisRound } : {}),
    regulations: G.exp.exp02?.regulations?.attached,
    pendingHotspot: G.exp.core.pendingHotspot,
    pendingRegulationChoice: G.exp.core.pendingRegulationChoices?.[0],
    counterLobbies: G.exp.core.counterLobbies,
    damagedResorts: G.exp.core.damagedResorts,
    pendingDisplacement: G.exp.core.pendingDisplacement,
  };
  return [
    ...ruleBrief,
    ...(G.cfg.variants.influenceDistance ? [
      'Movement (CORE-01-04-12A/-12B) costs zero, one or three resources for one, two or three hex steps. This is the range for moving your own marker. Placing from reserve has no distance cost.',
    ] : []),
    ...(G.cfg.variants.disruption ? [
      'Disruption (CORE-01-04-27 through -34): CounterLobby costs two resources and suppresses one opposing Lobbyist bonus at a standard Committee within two steps of your marker until the Lobbyist controller ends their next turn. DisplaceInfluence costs two resources once per round and targets a rival marker within one step of your marker. Its owner selects a legal neighboring destination in a mandatory response. DamageResort costs three resources once per match and permanently reduces a rival-controlled resort within two steps of your marker by one production. Base costs can use repeated active resorts.',
    ] : []),
    ...(expansions.length ? ['Measures (EXP-01-06/07): TakeMeasure moves a face-up card into your hand. A paid PlayMeasure resolves its printed effect and grants one additional non-PlayMeasure Political Action. The hand limit is two total and the play limit is one per round across all decks.'] : []),
    ...expansions.flatMap(({ label, file, prefix }) => [label, ...visibleCardRules(file, prefix, visible)]),
    'Board rows are [q,r,tile id,kind,printed resort and output,enclosure status if resolved]. Marker rows are [tile id,owner,marker id].',
    `Visible position: ${JSON.stringify(position)}`,
  ].join('\n');
}
