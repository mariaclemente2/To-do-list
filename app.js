require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

// --- CONEXIÓN A MONGODB ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.log("Error al conectar a MongoDB:", err));

// --- APP EXPRESS ---
const app = express();

// --- SCHEMAS Y MODELOS ---
const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

// --- VIEWS Y STATIC ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// --- ITEMS POR DEFECTO ---
const defaultItems = [
  new Item({ name: "Bienvenido a tu lista" }),
  new Item({ name: "Añade tareas usando el formulario" }),
  new Item({ name: "Elimina tareas con el icono 🗑️" }),
];

// Asegura que exista una lista en la BD; si no, la crea
async function ensureListExists(listName) {
  let list = await List.findOne({ name: listName }).exec();

  if (!list) {
    list = new List({
      name: listName,
      items: defaultItems,
    });
    await list.save();
  }
  return list;
}

// --- RUTAS ---

// Página principal
app.get("/", async (req, res) => {
  try {
    const generalList = await ensureListExists("general");
    const workList = await ensureListExists("work");

    res.render("index", {
      general: generalList.items,
      work: workList.items,
      customList: [],
      customListName: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar las listas");
  }
});

// Rutas dinámicas para listas personalizadas
app.get("/:customListName", async (req, res) => {
  const customListName = req.params.customListName.trim();

  // Evitar sobreescribir "general" o "work"
  if (customListName === "general" || customListName === "work") {
    return res.redirect("/");
  }

  try {
    let foundList = await List.findOne({ name: customListName }).exec();

    if (!foundList) {
      foundList = new List({
        name: customListName,
        items: defaultItems,
      });
      await foundList.save();
    }

    res.render("index", {
      general: [],
      work: [],
      customList: foundList.items,
      customListName: customListName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar la lista personalizada");
  }
});

// Añadir tarea
app.post("/add", async (req, res) => {
  const list = req.body.list;
  const task = req.body.task?.trim();

  if (!task || !list) return res.redirect("/");

  try {
    const newItem = new Item({ name: task });
    const foundList = await List.findOne({ name: list }).exec();

    if (foundList) {
      foundList.items.push(newItem);
      await foundList.save();
    } else {
      await new List({ name: list, items: [newItem] }).save();
    }

    // Redirigir correctamente según lista
    if (list !== "general" && list !== "work") {
      res.redirect("/" + list);
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al añadir tarea");
  }
});

// Eliminar tarea
app.post("/delete", async (req, res) => {
  const list = req.body.list;
  const itemId = req.body.itemId;

  if (!list || !itemId) return res.redirect("/");

  try {
    await List.findOneAndUpdate(
      { name: list },
      { $pull: { items: { _id: itemId } } }
    ).exec();

    // Redirigir correctamente según lista
    if (list !== "general" && list !== "work") {
      res.redirect("/" + list);
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar tarea");
  }
});

// --- SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor funcionando en puerto ${PORT}`)
);

