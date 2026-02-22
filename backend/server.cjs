const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

// KONFIGURIMI I CORS - Kjo zgjidh gabimin tend
app.use(
  cors({
    origin: "*", // Lejon te gjitha faqet (si Netlify) te komunikojne me kete server
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

const SECRET_KEY = "neon_super_secret_2026";
let users = [];

// Krijimi i Adminit automatikisht sa here ndizet serveri
(async () => {
  const hashedPass = await bcrypt.hash("admin123", 10);
  users.push({
    id: 1,
    username: "NeonAdmin",
    email: "admin@neon.com",
    password: hashedPass,
    highScore: 0,
    isAdmin: true,
  });
  console.log("✅ Serveri u ndez dhe CORS eshte i hapur!");
})();

// Route testimi per te pare nese serveri eshte online
app.get("/", (req, res) => res.send("Serveri eshte Live dhe CORS eshte OK!"));

// Login API
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user.id }, SECRET_KEY);
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          highScore: user.highScore,
          isAdmin: user.isAdmin,
        },
      });
    } else {
      res.status(401).json({ error: "Kredencialet gabim!" });
    }
  } catch (err) {
    res.status(500).json({ error: "Gabim ne server" });
  }
});

// Register API
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (users.find((u) => u.email === email))
      return res.status(400).json({ error: "Email ekziston!" });
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({
      id: Date.now(),
      username,
      email,
      password: hashedPassword,
      highScore: 0,
      isAdmin: false,
    });
    res.status(201).json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ error: "Gabim ne server" });
  }
});

// API per listen e perdoruesve
app.get("/api/users", (req, res) => {
  res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      isAdmin: u.isAdmin,
      highScore: u.highScore,
    })),
  );
});

// API per fshirjen (Vetem Admini)
app.delete("/api/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1)
    return res.status(403).json({ error: "Admini nuk mund te fshihet!" });
  users = users.filter((u) => u.id !== id);
  res.json({ success: true });
});

// API per perditesimin e pikeve
app.post("/api/scores", (req, res) => {
  const { userId, score } = req.body;
  const user = users.find((u) => u.id === userId);
  if (user) {
    if (score > user.highScore) user.highScore = score;
    res.json({ newHighScore: user.highScore });
  }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Serveri po punon ne porten ${PORT}`),
);
