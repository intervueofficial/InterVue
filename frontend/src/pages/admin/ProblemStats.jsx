import {
  BookOpen,
  CircleCheckBig,
  CircleDashed,
  TriangleAlert,
} from "lucide-react";

const cards = [
  {
    title: "Total Problems",
    key: "total",
    icon: BookOpen,
    color: "blue",
  },
  {
    title: "Easy",
    key: "easy",
    icon: CircleCheckBig,
    color: "green",
  },
  {
    title: "Medium",
    key: "medium",
    icon: CircleDashed,
    color: "yellow",
  },
  {
    title: "Hard",
    key: "hard",
    icon: TriangleAlert,
    color: "red",
  },
];

const colors = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
  },
};

const ProblemStats = ({ problems }) => {
  const stats = {
    total: problems.length,
    easy: problems.filter(
      (p) => p.difficulty === "Easy"
    ).length,
    medium: problems.filter(
      (p) => p.difficulty === "Medium"
    ).length,
    hard: problems.filter(
      (p) => p.difficulty === "Hard"
    ).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition"
          >

            <div className="flex justify-between">

              <div>

                <p className="text-slate-500 text-sm">
                  {card.title}
                </p>

                <h2 className="text-4xl font-bold mt-3">
                  {stats[card.key]}
                </h2>

              </div>

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[card.color].bg}`}
              >
                <Icon
                  className={colors[card.color].text}
                  size={28}
                />
              </div>

            </div>

          </div>
        );
      })}

    </div>
  );
};

export default ProblemStats;