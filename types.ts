
export interface Participant {
  id: string;
  username: string;
  photoUrl: string;
  color: string;
}

export interface RaceResult {
  username: string;
  time: number;
  rank: number;
  photoUrl: string;
}

export enum GameState {
  MENU = 'MENU',
  EDITOR = 'EDITOR', // New state for Track Editor
  RACE = 'RACE',
  FINISHED = 'FINISHED'
}

export enum CameraMode {
  FOLLOW = 'FOLLOW',
  FREE = 'FREE',
  CINEMATIC = 'CINEMATIC'
}

export interface MarblePosition {
  id: string;
  position: [number, number, number];
  finished: boolean;
}

export interface TrackConfig {
  segmentCount: number; // 5 - 50
  steepness: number; // 0.2 - 1.5
  chaosLevel: number; // 0 - 1 (Probability of obstacles)
  banking: number; // 0 - 0.5 (Right tilt amount)
}
