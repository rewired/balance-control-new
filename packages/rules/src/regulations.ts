import type { CoreState, RegulationOperation, Tile, RegulationKind, BoardPlacement } from './types.js';
import { RegulationKinds } from './types.js';

// EXP-02-02-B-04/-06 and CORE-01-08-06: validate the attachment independently of the ContextTile.
export function mayAttachRegulation(tile: Tile, kind: RegulationKind): boolean {
  if (tile.kind === 'StartCommittee') return false;
  const producesOrConverts = tile.kind === 'ResortTile' || tile.kind === 'Grassroots';
  return kind === 'Control' ? !producesOrConverts : kind === 'Administration' ? producesOrConverts : true;
}

export function regulationContext(G: CoreState, operation: RegulationOperation): BoardPlacement | undefined {
  const tileId = 'tileId' in operation ? operation.tileId
    : G.exp?.exp02?.regulations?.attached.find(regulation => regulation.id === operation.regulationId)?.tileId;
  return G.tiles.board.find(placement => placement.tileId === tileId);
}

export function* regulationOperations(G: CoreState, kind: RegulationOperation['operation']): Generator<RegulationOperation> {
  const attached = G.exp?.exp02?.regulations?.attached ?? [];
  switch (kind) {
    case 'place':
      for (const { tileId } of G.tiles.board) {
        for (const regulationKind of RegulationKinds) {
          if (mayAttachRegulation(G.allTiles[tileId], regulationKind)) yield { operation: 'place', regulationKind, tileId };
        }
      }
      break;
    case 'move':
      for (const regulation of attached) {
        for (const { tileId } of G.tiles.board) {
          if (tileId !== regulation.tileId && mayAttachRegulation(G.allTiles[tileId], regulation.kind)) {
            yield { operation: 'move', regulationId: regulation.id, tileId };
          }
        }
      }
      break;
    case 'remove':
      for (const regulation of attached) yield { operation: 'remove', regulationId: regulation.id };
      break;
    case 'removeAll':
      for (const { tileId } of G.tiles.board) yield { operation: 'removeAll', tileId };
      break;
  }
}
