import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifiedJWT } from "../middlewares/auth.middleware.js";
import {subscribeChannel} from "../controllers/subscription.controller.js"

const router =  Router();

router.route("/subscribeChannel").post(verifiedJWT,upload.none(),subscribeChannel)

export default router