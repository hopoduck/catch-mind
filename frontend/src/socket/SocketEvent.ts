export enum ClientEmitEvent {
  setNickname = "setNickname",
  disconnect = "disconnect",
  sendMessage = "sendMessage",

  beginPath = "beginPath",
  strokePath = "strokePath",
  fill = "fill",
}

export enum ServerEmitEvent {
  newUser = "newUser",
  disconnected = "disconnected",
  newMessage = "newMessage",

  beganPath = "beganPath",
  strokedPath = "strokedPath",
  filled = "filled",

  playerUpdate = "playerUpdate",
  gameStarted = "gameStarted",
  leaderNotify = "leaderNotify",
  gameEnded = "gameEnded",
  gameStarting = "gameStarting",
}
