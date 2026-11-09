import { chooseComputerMove, createBCGame, type ComputerPosition, type EngineMoveOption } from '@bc/game';

export interface ComputerMoveRequest {
  position: ComputerPosition;
  playerID: string;
}

export interface ComputerMoveResponse {
  revision: number;
  option?: EngineMoveOption;
}

self.onmessage = ({ data: { position, playerID } }: MessageEvent<ComputerMoveRequest>) => {
  const { cfg, matchSeed } = position.G;
  const option = chooseComputerMove(createBCGame({ ...cfg, matchSeed }), position, playerID);
  self.postMessage({ revision: position.revision, option } satisfies ComputerMoveResponse);
};
