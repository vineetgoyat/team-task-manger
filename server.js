require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


  const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

const express = require("express");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Request hit");
  res.send("Server is running 🚀");
});


app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const newUser = new User({
    name,
    email,
    password
  });

  await newUser.save();

  res.send("User saved to database");
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).send("User not found");
  }

  if (user.password !== password) {
    return res.status(401).send("Invalid password");
  }

  // 🔥 Create token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET
  );

  res.json({
    message: "Login successful",
    token: token
  });
});
    
function auth(req, res, next) {
  const token = req.headers.authorization;

  // ❌ No token
  if (!token) {
    return res.status(401).send("No token provided");
  }

  try {
    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // store user info
    req.userId = decoded.userId;

    next(); // move to next step
  } catch (err) {
    res.status(401).send("Invalid token");
  }
}

app.get("/dashboard", auth, (req, res) => {
  res.send(`Welcome user ${req.userId}`);
});


const projectSchema = new mongoose.Schema({
  name: String,
  description: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
      }
    }
  ]
});

const Project = mongoose.model("Project", projectSchema);



const taskSchema = new mongoose.Schema({
  title: String,
  description: String,

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  status: {
    type: String,
    enum: ["todo", "in-progress", "done"],
    default: "todo"
  },

  dueDate: Date
});

const Task = mongoose.model("Task", taskSchema);




app.post("/project", auth, async (req, res) => {
  const { name, description } = req.body;

  try {
    const newProject = new Project({
      name,
      description,
      createdBy: req.userId,

      members: [
        {
          user: req.userId,
          role: "admin"
        }
      ]
    });

    await newProject.save();

    res.send("Project created");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating project");
  }
});


app.get("/project", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      createdBy: req.userId
    });

    res.json(projects);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching projects");
  }
});


app.post("/task", auth, async (req, res) => {
  const { title, description, projectId, assignedTo, dueDate } = req.body;

  try {
    const project = await Project.findById(projectId);

    // check if user is part of project
    const isMember = project.members.find(
      m => m.user.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).send("Not part of project");
    }

    const newTask = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      dueDate
    });

    await newTask.save();

    res.status(201).json({
      message: "Task created",
      task: newTask
    });

  } catch (err) {
    res.status(500).send("Error creating task");
  }
});


app.get("/task/:projectId", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId
    });

    res.json({
      message: "Tasks fetched",
      tasks: tasks
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching tasks");
  }
});



app.put("/task/:taskId", auth, async (req, res) => {
  const { status } = req.body;

  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).send("Task not found");
    }

    // update status
    task.status = status;

    await task.save();

    res.json({
      message: "Task updated",
      task: task
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error updating task");
  }
});



app.get("/dashboard/:projectId", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId
    });

    const total = tasks.length;

    const completed = tasks.filter(t => t.status === "done").length;

    const pending = tasks.filter(t => t.status !== "done").length;

    const overdue = tasks.filter(t => {
      return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done";
    }).length;

    res.json({
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching dashboard");
  }
});




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});