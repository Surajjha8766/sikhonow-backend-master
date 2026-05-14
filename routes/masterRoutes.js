import express from "express";
import { masterLogin } from "../controllers/masterController.js";

const router = express.Router();

router.post("/login", masterLogin);

export default router;