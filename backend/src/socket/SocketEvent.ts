export enum ClientEmitEvent {
  setNickname = 'setNickname',
  disconnect = 'disconnect',
  sendMessage = 'sendMessage',

  beginPath = 'beginPath',
  strokePath = 'strokePath',
  fill = 'fill',

  skip = 'skip',
}

export enum ServerEmitEvent {
  newUser = 'newUser',
  disconnected = 'disconnected',
  newMessage = 'newMessage',

  beganPath = 'beganPath',
  strokedPath = 'strokedPath',
  filled = 'filled',

  playerUpdate = 'playerUpdate',
  gameStarting = 'gameStarting',
  gameStarted = 'gameStarted',
  painterNotify = 'painterNotify',
  gameEnded = 'gameEnded',

  skipped = 'skipped',
}
