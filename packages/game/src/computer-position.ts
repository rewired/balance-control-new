import { createExpansionRegistry, type CoreState } from '@bc/rules';
import { shuffleSeeded } from '@bc/shared';
import type { EngineSnapshot } from './legal-options.js';

export interface ComputerPosition {
  G: CoreState;
  ctx: EngineSnapshot['ctx'];
  revision: number;
}

/** Build a hypothetical position using material and zones visible to a hotseat player. */
export function createComputerPosition({ G, ctx, _stateID }: EngineSnapshot): ComputerPosition {
  const matchSeed = `computer-search|${ctx.turn}|${_stateID}`;
  const core = G.exp.core;
  const tiles = core.tiles;
  const knownTiles = new Set([...tiles.discardFaceUp, ...tiles.board.map(tile => tile.tileId), tiles.drawResolution?.tileId]);
  // CORE-01-00-05/-05A and CORE-01-03-02: infer the remaining tile set from the public material and zones.
  const unseenTiles = Object.values(core.allTiles).filter(tile => !knownTiles.has(tile.id) && tile.kind !== 'StartCommittee')
    .map(tile => tile.id).sort();
  const exp: CoreState['exp'] = {
    core: { ...core, tiles: {
      board: tiles.board,
      drawResolution: tiles.drawResolution,
      discardFaceUp: tiles.discardFaceUp,
      drawPile: shuffleSeeded(unseenTiles, `${matchSeed}|tiles`),
    } },
  };
  const [, ...modules] = createExpansionRegistry(G.cfg.expansions);
  for (const module of modules) {
    const expansion = G.exp[module.id];
    if (!expansion) continue;
    const deck = expansion.measures;
    if (!deck) {
      exp[module.id] = expansion;
      continue;
    }
    const material = module.measureDeck?.(G.cfg);
    if (!material) throw new Error(`Missing Measure material for ${module.id}`);
    // EXP-01-02-E-01: the hotseat UI shows the market and all hands, and played cards can be tracked.
    const { open, hands, recycle, finalDiscard, playCounts, cycle } = deck;
    const knownCards = new Set([...open, ...Object.values(hands).flat(), ...recycle, ...finalDiscard]);
    const unseenCards = material.filter(card => !knownCards.has(card)).sort();
    exp[module.id] = {
      ...expansion,
      measures: { open, hands, recycle, finalDiscard, playCounts, cycle, drawPile: shuffleSeeded(unseenCards, `${matchSeed}|${module.id}`) },
    };
  }
  // Use a separate seed for simulated recycling. Do not forward the live hash or engine PRNG state.
  return { G: { cfg: G.cfg, exp, matchSeed }, ctx, revision: _stateID };
}
