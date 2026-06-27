import { useState, useEffect } from "react";
import { Plus, Trash2, MessageCircle, Filter } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["todo", "in-progress", "completed"];
const PRIORITIES = ["low", "medium", "high"];

const priorityColor = { low: "bg-gray-100 text-gray-600", medium: "bg-yellow-100 text-yellow-700", high: "bg-red-100 text-red-600" };
const statusColor = { "todo": "bg-yellow-100 text-yellow-700", "in-progress": "bg-blue-100 text-blue-700", "completed": "bg-green-100 text-green-700" };

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [comment, setComment] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "", search: "" });
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "todo", deadline: "", assignedTo: [], tags: "" });

  useEffect(() => { fetchTasks(); }, [filters]);
  useEffect(() => { if (user?.role === "admin") api.get("/users").then(r => setUsers(r.data)); }, [user]);

  const fetchTasks = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api.get("/tasks", { params }).then(r => setTasks(r.data)).catch(() => toast.error("Failed to load tasks"));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) };
      await api.post("/tasks", payload);
      toast.success("Task created!");
      setShowModal(false);
      setForm({ title: "", description: "", priority: "medium", status: "todo", deadline: "", assignedTo: [], tags: "" });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchTasks();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try { await api.delete(`/tasks/${id}`); toast.success("Deleted!"); fetchTasks(); }
    catch { toast.error("Failed to delete"); }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/tasks/${activeTask._id}/comments`, { text: comment });
      setComment("");
      const updated = await api.get("/tasks");
      setTasks(updated.data);
      setActiveTask(updated.data.find(t => t._id === activeTask._id));
      toast.success("Comment added!");
    } catch { toast.error("Failed to add comment"); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        {user?.role === "admin" && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input placeholder="Search tasks..." value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tasks.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No tasks found.</p>}
        {tasks.map(task => (
          <div key={task._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm leading-snug">{task.title}</h3>
              <div className="flex gap-2">
                <button onClick={() => setActiveTask(task)} className="text-gray-400 hover:text-indigo-500 transition-colors">
                  <MessageCircle size={16} />
                </button>
                {user?.role === "admin" && (
                  <button onClick={() => handleDelete(task._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            {task.description && <p className="text-gray-500 text-xs mb-3 line-clamp-2">{task.description}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority]}`}>{task.priority}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[task.status]}`}>{task.status}</span>
            </div>
            {task.deadline && (
              <p className="text-xs text-gray-400 mb-3">Due: {new Date(task.deadline).toLocaleDateString()}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {task.assignedTo?.slice(0, 3).map(u => (
                  <div key={u._id} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600 text-xs font-bold">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
              <select value={task.status} onChange={e => handleStatusChange(task._id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Create New Task</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input required placeholder="Task title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none" />
              </div>
              <select multiple value={form.assignedTo}
                onChange={e => setForm({ ...form, assignedTo: [...e.target.selectedOptions].map(o => o.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none h-24">
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
              <input placeholder="Tags (comma separated)" value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none" />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors">Create Task</button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">{activeTask.title}</h3>
            <p className="text-sm text-gray-400 mb-4">Comments ({activeTask.comments?.length || 0})</p>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {activeTask.comments?.length === 0 && <p className="text-gray-400 text-sm">No comments yet.</p>}
              {activeTask.comments?.map((c, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-indigo-600 mb-1">{c.user?.name}</p>
                  <p className="text-sm text-gray-700">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input placeholder="Add a comment..." value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddComment()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleAddComment}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">Post</button>
            </div>
            <button onClick={() => setActiveTask(null)}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}