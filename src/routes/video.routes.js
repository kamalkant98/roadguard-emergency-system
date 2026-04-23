import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifiedJWT } from "../middlewares/auth.middleware.js";
import {uploadVideo} from "../controllers/video.controller.js"

const router = Router();
router.use(verifiedJWT);

router.route("/uploadVideo").post(upload.fields([
    {
        name:"videoFile",
        maxCount:1,
        
    },
    {
        name:"thumbnail",
        maxCount:1,
    }
]),uploadVideo);

export default router