import { useParams, useNavigate } from "react-router-dom";
import labs from "./data/labs.json";
import projects from "./data/projects.json";

export default function LabPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lab = labs.find((l) => l.id === id);
  const project = projects.find((p) => p.id === lab.projectId);

  if (!lab) return <p className="p-8 text-center">Lab not found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <button
        onClick={() => navigate("/", { state: { openProject: project.id } })}
        className="text-blue-600 hover:underline mb-4"
      >
        ← Back to {project.title}
      </button>

      <h1 className="text-3xl font-bold mb-2">{lab.title}</h1>
      <p className="text-gray-500 mb-4">{lab.date}</p>

      <img
        src={lab.gif || lab.cover}
        alt={lab.title}
        className="rounded-xl shadow mb-6"
      />

      <div className="prose max-w-none">
        <p>{lab.summary}</p>
        {/* Add rich content or MDX later */}
      </div>
    </div>
  );
}