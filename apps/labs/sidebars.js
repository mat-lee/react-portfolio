// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  labsSidebar: [
    'intro',  // Home page
    {
      type: 'category',
      label: 'Tetris',
      collapsed: false,  // Start expanded
      link: {
        type: 'generated-index',
        title: 'Tetris',
        description: 'Reinforcement Learning for Modern Tetris',
        slug: '/tetris',
      },
      items: [
        'tetris/move-generation',
      ],
    },
    // Add more project categories here as you create them
  ],
};

export default sidebars;
