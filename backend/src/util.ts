import { words } from './constants';

export const randomWord = () => words[Math.floor(Math.random() * words.length)];
