import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.model.js";
import { User } from "../models/user.model.js";

const uploadVideo = asyncHandler(async (req,res) => {

    const {title,description,duration,isPublished} = req.body
    
    let insertVideoData = await Video.create({
        title:title,
        description:description,
        duration:duration,
        isPublished:isPublished,
        owner:req.user?._id
    })

    const getVideoData = await Video.findById(insertVideoData?._id);

    if(getVideoData){
        res.status(200).json(new ApiResponse(200,"ddddd","message"));
    }else{
        res.status(401).json(new ApiError(401,"Something went wrong."));
    }

   
})


export  {uploadVideo}