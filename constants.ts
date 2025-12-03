export const COLORS = {
  neonBlue: '#00F5FF',
  neonPurple: '#B200FF',
  darkBg: '#050505',
  trackBase: '#1a1a1a',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32'
};

export const TRACK_CONFIG = {
  startHeight: 20,
  trackWidth: 8,
  friction: 0.1,
  restitution: 0.5
};

export const PHYSICS_CONFIG = {
  gravity: [0, -9.81, 0] as [number, number, number],
  defaultContactMaterial: {
    friction: 0.1,
    restitution: 0.7,
  }
};