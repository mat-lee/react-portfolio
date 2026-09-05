/**
 * A group is a folder under src/content/labs/. Posts inside it render as
 * sub-posts of one heading on the home page. Folders with no entry here
 * fall through and their posts show up as standalone entries.
 */
export const GROUPS = {
  tetris: {
    title: 'Training a Tetris AI',
    description:
      'An AlphaZero-style agent learning modern competitive Tetris from self-play — move generation, search diagnostics, and the policy head.',
  },
};
