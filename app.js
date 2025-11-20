const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Usamos Map para guardar dos listas de tareas
const tasks = new Map([
  ["general", []],
  ["work", []]
]);

// Configuración de EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Página principal
app.get("/", (req, res) => {
  res.render("index", {
    general: tasks.get("general"),
    work: tasks.get("work")
  });
});

// Añadir tarea
app.post("/add", (req, res) => {
  const list = req.body.list;
  const task = req.body.task?.trim();

  if (!task || !tasks.has(list)) {
    return res.redirect("/");
  }

  tasks.get(list).push(task);
  res.redirect("/");
});

// Eliminar tarea
app.post("/delete", (req, res) => {
  const list = req.body.list;
  const index = parseInt(req.body.index, 10);

  if (tasks.has(list) && !isNaN(index)) {
    tasks.get(list).splice(index, 1);
  }

  res.redirect("/");
});

// Arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor funcionando en puerto ${PORT}`));