import { useState, useEffect } from "react";
import { CheckCircle, Clock, ListTodo, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/tasks/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Failed to load dashboard"));
  }, []);

  if (!stats) return <div className="p-8 text-gray-400">Loading...</div>;

  const cards = [
    { label: "Total Tasks", value: stats.total, icon: TrendingUp, color: "bg-indigo-500" },
    { label: "To Do", value: stats.todo, icon: ListTodo, color: "bg-yellow-500" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "bg-blue-500" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "bg-green-500" },
  ];

  const chartData = [
    { name: "To Do", count: stats.todo },
    { name: "In Progress", count: stats.inProgress },
    { name: "Completed", count: stats.completed },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`${color} p-3 rounded-lg text-white`}><Icon size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Task Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {stats.recentTasks.length === 0 && <p className="text-gray-400 text-sm">No tasks yet.</p>}
            {stats.recentTasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-700 truncate">{task.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  task.status === "completed" ? "bg-green-100 text-green-700" :
                  task.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}