import { useParams, useNavigate } from "react-router-dom";
import labs from "./data/labs.json";
import projects from "./data/projects.json";
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
  const DynamicLab = lab.component ? LAB_COMPONENTS[lab.component] : null;

  return (
    <div className="max-w-3xl mx-auto p-8">
      {project && (
        <button
          onClick={() => navigate("/", { state: { openProject: project.id } })}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to {project.title}
        </button>
      )}

      <h1 className="text-3xl font-bold mb-2">{lab.title}</h1>
      <p className="text-gray-500 mb-4">{lab.date}</p>

      {(lab.gif || lab.cover) && (
        <img
          src={lab.gif || lab.cover}
          alt={lab.title}
          className="rounded-xl shadow mb-6"
        />
      )}

      <div className="prose max-w-none mb-8">
        <p>{lab.summary}</p>
      </div>

      {/* If a component is specified for this lab, render it */}
      {DynamicLab ? (
        <DynamicLab />
      ) : (
        <p className="text-gray-500">
          (No interactive component for this lab yet.)
        </p>
      )}
    </div>
  );
}
