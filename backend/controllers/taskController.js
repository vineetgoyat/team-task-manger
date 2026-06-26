const Task = require("../models/Task");

exports.getTasks = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };
    const { status, priority, search } = req.query;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: "i" };

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};