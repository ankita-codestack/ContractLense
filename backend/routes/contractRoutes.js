const express = require("express");
const multer = require("multer");

const { analyze } = require("../controllers/contractController");

const router = express.Router();

const upload = multer({
  dest: "backend/uploads/",
});

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Contract routes are working",
  });
});

router.post("/analyze", upload.single("contract"), analyze);

module.exports = router;