const express = require("express");
const cors = require("cors");
require("dotenv").config();

const contractRoutes = require("./routes/contractRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`REQUEST: ${req.method} ${req.url}`);
  next();
});

app.use("/api/contracts", contractRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ContractLens backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ContractLens backend running on http://localhost:${PORT}`);
});