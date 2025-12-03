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
  LOADING = 'LOADING',
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