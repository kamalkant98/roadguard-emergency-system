import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js";
const router = Router();
import { authenticateUser } from '../middlewares/auth.middleware.js';
import {
  createVehicle,
  getUserVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicle.controller.js";

router.post("/create", authenticateUser,createVehicle);
router.get("/vehicles",authenticateUser, getUserVehicles);
router.get("/:id", authenticateUser,getVehicleById);
router.put("/:id",authenticateUser, updateVehicle);
router.delete("/:id",authenticateUser, deleteVehicle);

export default router;
