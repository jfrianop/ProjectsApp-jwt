const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./User");
const Project = require("./Project");
const Issue = require("./Issue");

const app = express();

//Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/projects', { useNewUrlParser: true, useUnifiedTopology: true });

//Middlewares
app.use(express.static("public"));
app.use(express.json());

// verificar si existe un header Authorization y si valor de ese header
// es un JWT válido. Si no es válido, devolvemos un 401.
const requireUser = async (req, res, next) => {
  const token = req.headers["authorization"];
  console.log("Request with Token: ", token)
  if (!token) {
    res.status(401).json({ error: "Not authorized" });
  } else {
    try {
      const payload = jwt.verify(token, "my secret");
      const userId = payload.userId;
      const user = await User.findById(userId)
      if (user) {
        console.log("Usuario válido");
        next();
      } else {
        console.log("Usuario invalido");
        res.status(401).json({ error: "Invalid user" });
      }
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  }
};

//GET projects
app.get("/projects", requireUser, async (req, res, next) => {
  try {
    const payload = jwt.verify(req.headers["authorization"], "my secret")
    const userId = payload.userId
    const user = await User.findById(userId)
    console.log("user :", userId);

    const projects = await Project.find();
    console.log("Proyectos :", projects);

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

//GET project issues by projectId
app.get("/projects/:id/issues", requireUser, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    const issues = await Issue.find({ project });

    res.json(issues);
  } catch (err) {
    next(err);
  }
});

//POST Issue
app.post("/projects/:id/issues", requireUser, async (req, res, next) => {
  const newIssue = { name: req.body.name, description: req.body.description };
  newIssue.creationDate = new Date();

  //Get user from authorization
  const payload = jwt.verify(req.headers["authorization"], "my secret")
  const userId = payload.userId
  const user = await User.findById(userId);

  //Get project from req.body
  const projectId = req.params.id;
  const project = await Project.findById(projectId);

  //Assign user and project to issue
  newIssue.user = user;
  newIssue.project = project;

  try {
    const issue = await Issue.create(newIssue)
    res.json(issue);
  } catch (err) {
    next(err);
  }
});

//DELETE Issue
app.delete("/projects/:projectId/issues/:issueId", requireUser, async (req, res, next) => {

  //Get user from authorization
  const payload = jwt.verify(req.headers["authorization"], "my secret")
  const userId = payload.userId
  const user = await User.findById(userId);

  //Get project from req.body
  const projectId = req.params.projectId;
  const project = await Project.findById(projectId);

  try {
    const deleted = await Issue.deleteOne({ user, project, _id: req.params.issueId })
    if (deleted.deletedCount == 0) {
      res.status(401).json({ error: "Not Authorized to Delete Issue" })
    } else {
      res.json({ ok: true });
    }
  } catch (err) {
    next(err);
  }


});

//POST projects
app.post("/projects", requireUser, async (req, res, next) => {
  const newProject = { name: req.body.name, description: req.body.description };
  newProject.creationDate = new Date();
  const payload = jwt.verify(req.headers["authorization"], "my secret")
  const userId = payload.userId
  console.log("User Id: ", userId);
  const user = await User.findById(userId);
  newProject.user = user;
  console.log("Usuario Servidor : ", newProject.user);
  try {
    const project = await Project.create(newProject)
    res.json(project);
  } catch (err) {
    next(err);
  }
});



//New User
app.post("/register", async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.create({ email, password });
    console.log("New User", user);
    const token = jwt.sign({ userId: user._id }, "my secret")
    res.json(token);
  } catch (err) {
    next(err);
  }
});


//New Login
app.post("/login", async (req, res, next) => {

  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email });
    console.log("New Login: ", user);
    if (user && user.password === password) {
      const token = jwt.sign({ userId: user._id }, "my secret")
      res.json(token);
    } else {
      res.status(401).json({ error: "Invalid credentials " });
    }
  } catch (err) {
    next(err);
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    console.log(err);

    res.status(422).json({ errors: err.errors });
  } else {
    // error inesperado
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
