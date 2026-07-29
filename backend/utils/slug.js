const adjectives = [
  'silent', 'quiet', 'winter', 'golden', 'ancient', 'forgotten', 'bitter',
  'sweet', 'warm', 'cold', 'velvet', 'hidden', 'lost', 'distant', 'tender',
  'misty', 'shadow', 'light', 'deep', 'wild', 'soft', 'calm', 'amber',
  'silver', 'hollow', 'sacred', 'infinite', 'secret', 'fragile', 'gentle'
];

const nouns = [
  'letter', 'whisper', 'echo', 'river', 'forest', 'dream', 'memory',
  'shadow', 'star', 'wind', 'rain', 'snow', 'leaf', 'sky', 'wave',
  'stone', 'heart', 'path', 'ocean', 'book', 'song', 'light', 'dusk',
  'dawn', 'breath', 'silence', 'truth', 'regret', 'grace', 'feather',
  'hill', 'valley', 'flame', 'shore', 'cloud', 'tide', 'mirror', 'haven'
];

export function generateMemorableSlug() {
  const selectRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const adj1 = selectRandom(adjectives);
  let adj2 = selectRandom(adjectives);
  while (adj2 === adj1) {
    adj2 = selectRandom(adjectives);
  }
  
  const noun = selectRandom(nouns);
  
  return `${adj1}-${adj2}-${noun}`;
}
