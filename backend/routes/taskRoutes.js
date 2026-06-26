const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getTasks, createTask, updateTask, deleteTask, addComment, getDashboard,
} = require("../controllers/taskController");

router.get("/dashboard", protect, getDashboard);
router.get("/", protect, getTasks);
router.post("/", protect, adminOnly, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, adminOnly, deleteTask);
router.post("/:id/comments", protect, addComment);

module.exports = router;