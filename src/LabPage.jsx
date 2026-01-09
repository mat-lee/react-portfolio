import { useParams, useNavigate, Link } from "react-router-dom";
import labs from "./data/labs.json";
import projects from "./data/projects.json";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import TetrisMoveVisualizer from "./components/TetrisMoveVisualizer";

const LAB_COMPONENTS = {
  // keys must match the "component" string in labs.json
  TetrisMoveVisualizer,
};

export default function LabPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lab = labs.find((l) => l.id === id);
  if (!lab) return <p className="p-8 text-center">Lab not found.</p>;

  const project = projects.find((p) => p.id === lab.projectId);

  return (
    <div className="max-w-3xl mx-auto p-8">
      {project && (
        <Link to={`/#${project.id}`} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to {project.title}
        </Link>
      )}

      <h1 className="text-3xl font-bold mb-2">{lab.title}</h1>
      <p className="text-gray-500 mb-4">{lab.date}</p>

      <ContentRenderer content={lab.content} />
    </div>
  );
}

function ContentRenderer({ content }) {
  const combinedRegex = /(<COMPONENT:\s*[^/\s>]+)\s*\/?\s*>|(\$\$[\s\S]+?\$\$)|(\$[^$\n\r]+\$)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add the text part before the matched element
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const [fullMatch, componentTag, blockMath, inlineMath] = match;

    if (componentTag) {
      const componentName = componentTag.replace('<COMPONENT:', '').trim();
      parts.push({ type: 'component', name: componentName });
    } else if (blockMath) {
      parts.push({ type: 'blockMath', content: blockMath.slice(2, -2) });
    } else if (inlineMath) {
      parts.push({ type: 'inlineMath', content: inlineMath.slice(1, -1) });
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add any remaining text after the last match
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return (
    <article className="prose max-w-none">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return part.split('\n').map((line, i) => <p key={`${index}-${i}`}>{line}</p>);
        }
        
        switch (part.type) {
          case 'component': {
            const { name } = part;
            const componentKey = Object.keys(LAB_COMPONENTS).find(key => key.toLowerCase() === name.toLowerCase());
            const Component = componentKey ? LAB_COMPONENTS[componentKey] : null;
            return Component ? (
              <div key={index} className="my-8"><Component /></div>
            ) : (
              <div key={index} className="my-8 p-4 border border-dashed rounded text-gray-500">
                <p>Error: Lab component "{name}" not found.</p>
              </div>
            );
          }
          case 'blockMath':
            return (
              <div key={index} className="my-4">
                <BlockMath math={part.content} />
              </div>
            );
          case 'inlineMath':
            return <InlineMath key={index} math={part.content} />;
          default:
            return null;
        }
      })}
    </article>
  );
}
