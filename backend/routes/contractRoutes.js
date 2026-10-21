const express = require("express");
const multer = require("multer");

const {
  analyze,
  askQuestion,
} = require("../controllers/contractController");

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
router.post("/qa", askQuestion);

module.exports = router;