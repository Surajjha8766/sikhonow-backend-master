import Master from "../models/Master.js";
import jwt from "jsonwebtoken";

export const masterLogin = async (req, res) => {

  try {

    const { email, password } = req.body;

    const master = await Master.findOne({ email });

    if (!master) {
      return res.status(404).json({
        success: false,
        message: "Teacher Not Found"
      });
    }

    if (master.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Wrong Password"
      });
    }

    const token = jwt.sign(
      {
        id: master._id,
        email: master.email,
        category: master.category,
        username: master.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    const redirectUrl =
      `/masterdashboard/${master.category}/${master.username}`;

    res.status(200).json({
      success: true,
      token,
      redirectUrl,

      master: {
        id: master._id,
        name: master.name,
        email: master.email,
        username: master.username,
        category: master.category
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};