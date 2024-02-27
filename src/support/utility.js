
function getRandomXPosition() {
  return Math.floor(((Math.random() * 1370) + 30) * 1000) / 1000;
}
exports.getRandomXPosition = getRandomXPosition;
function getRandomAvatarIndex() {
  return Math.floor(Math.random() * 3);
}
exports.getRandomAvatarIndex = getRandomAvatarIndex;
function calculateRandomVelocity() {
  let randomShipXVelocity = Math.floor(Math.random() * 200) + 20;
  randomShipXVelocity *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
  return randomShipXVelocity;
}
exports.calculateRandomVelocity = calculateRandomVelocity;
