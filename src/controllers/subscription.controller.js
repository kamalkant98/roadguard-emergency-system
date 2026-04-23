import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Subscription} from "../models/subscription.model.js";
import {User} from "../models/user.model.js";

const subscribeChannel = asyncHandler(async(req,res) =>{
    
    const {username} = req.body

    if(!username){
        throw new ApiError(400,"username is required")
    }

    let getUserData = await User.findOne({"username":username?.toLowerCase()})

    if(!getUserData){
        throw new ApiError(400,"channel is not found")
    }

    const checkUserExisted = await Subscription.findOneAndDelete({subscriber:req.user?._id,channel:getUserData?._id})
    if(!checkUserExisted){
        const insertUser = await Subscription.create({
            subscriber:req.user?._id,
            channel:getUserData?._id,
        })
        return res.status(200).json(new ApiResponse(200,{},`You subscribed to ${getUserData?.username} channel`))
    }else{

        return res.status(200).json(new ApiResponse(200,{},`You Unsubscribed to ${getUserData?.username} channel`))
    }
    
})




export {subscribeChannel};