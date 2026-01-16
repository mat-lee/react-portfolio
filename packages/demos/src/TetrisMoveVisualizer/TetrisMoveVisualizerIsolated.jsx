/**
 * TetrisMoveVisualizerIsolated
 *
 * This wraps TetrisMoveVisualizer in a Shadow DOM for use in environments
 * where CSS conflicts occur (like Docusaurus with Infima).
 *
 * Shadow DOM creates a style boundary:
 * - Our Tailwind styles stay inside, don't affect the page
 * - Page styles (Infima) stay outside, don't break our component
 */

import ShadowWrapper from '../ShadowWrapper.jsx';
import TetrisMoveVisualizer from './TetrisMoveVisualizer.jsx';
import { componentCSS } from './styles.js';

export default function TetrisMoveVisualizerIsolated({ initialRows }) {
  return (
    <ShadowWrapper css={componentCSS}>
      <TetrisMoveVisualizer initialRows={initialRows} />
    </ShadowWrapper>
  );
}
