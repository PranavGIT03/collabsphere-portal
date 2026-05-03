const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap',
  'dick', 'cock', 'pussy', 'ass', 'cunt', 'whore', 'slut', 'piss',
  'nigger', 'nigga', 'faggot', 'retard', 'idiot', 'moron', 'stupid',
  'hell', 'bloody', 'bollocks', 'bugger', 'wanker', 'twat',
];

const censor = (text) => {
  let result = text;
  for (const word of BAD_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(re, (m) => m[0] + '*'.repeat(m.length - 1));
  }
  return result;
};

module.exports = censor;
