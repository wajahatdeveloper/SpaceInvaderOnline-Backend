
export function getRandomXPosition(): number {
  return Math.floor(((Math.random() * 1370) + 30) * 1000) / 1000;
}

export function getRandomAvatarIndex(): number {
  return Math.floor(Math.random() * 3);
}

export function calculateRandomVelocity(): number {
  let randomShipXVelocity = Math.floor(Math.random() * 200) + 20;
  randomShipXVelocity *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
  return randomShipXVelocity;
}
