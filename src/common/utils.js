function shuffle(array) {
  return array.sort((a, b) => Math.random() - 0.5);
}

module.exports = {
  shuffle
}