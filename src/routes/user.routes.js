import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getLoggedInUser,
  updateProfile,
  refreshAccessToken,
  changePassword,
  getChannel,
} from "../controllers/user-old.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticateUser as verifiedJWT} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(upload.none(), loginUser);
router.route("/logout").post(verifiedJWT, logoutUser);
router.route("/me").get(verifiedJWT, getLoggedInUser);
router
  .route("/changePassword")
  .post(verifiedJWT, upload.none(), changePassword);
router.route("/updateProfile").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  verifiedJWT,
  updateProfile
);
router.route("/refreshAccessToken").post(refreshAccessToken);
router.route("/getChannel").get(verifiedJWT, getChannel);

export default router;
