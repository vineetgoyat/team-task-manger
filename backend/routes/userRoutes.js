const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getUsers, updateProfile, toggleUserStatus } = require("../controllers/userController");

router.get("/", protect, adminOnly, getUsers);
router.put("/profile", protect, updateProfile);
router.patch("/:id/toggle", protect, adminOnly, toggleUserStatus);

module.exports = router;