export const parseFen = (fen) => {
  const [piecePlacement] = fen.split(" ");
  const ranks = piecePlacement.split("/");
  const boardState = [];
  ranks.forEach((rank) => {
    for (const char of rank) {
      if (isNaN(char)) {
        const color = char === char.toUpperCase() ? "w" : "b";
        const pieceType = char.toUpperCase();
        boardState.push(`${color}${pieceType}`);
      } else {
        for (let i = 0; i < parseInt(char, 10); i++) {
          boardState.push(null);
        }
      }
    }
  });
  return boardState;
};
