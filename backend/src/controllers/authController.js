const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Auth = require("../models/authModel");

// controllers/authController.js
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Auth.findByUsername(username);
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Include center_id and full_name in payload
    const payload = {
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      center_id: user.center_id,
      full_name: `${user.name || ''} ${user.surname || ''}`.trim(),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // ✅ Include additional user info for localStorage
    const userInfo = {
      id: user.id,
      name: user.name,
      surname: user.surname,
      center_id: user.center_id,
      id_number: user.id_number,
      user_type: user.user_type,
      username: user.username,
    };

    res.json({ token, user: payload, userInfo });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
