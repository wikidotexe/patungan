import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CustomSplitTitle = () => {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      navigate(`/custom-split?title=${encodeURIComponent(title)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Buat Custom Split Bill</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Judul Split Bill (misal: Makan Siang, Nongkrong, dll)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg outline-none ring-ring focus:ring-2"
            autoFocus
          />
          <button type="submit" className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold text-lg transition-colors hover:opacity-90">
            Mulai Custom Split
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomSplitTitle;
