import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadToCloud,deleteSingleFile} from "../utils/Cloudinary.js"
import jwt from "jsonwebtoken"
import fs from "fs"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const userData = await User.findById(userId);
        const refreshToken = await userData.generateRefreshToken()
        const accessToken = await userData.generateAccessToken()

        userData.refreshToken = refreshToken
        userData.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token.")
    }
}

const registerUser = asyncHandler(async (req,res) => {
    
    const {username,email,fullName,password} = req.body

    //require all fileds 
    if(
        [username,email,fullName,password].some((filed) => filed?.trim() === '')){
        throw new ApiError(400, "All fields are required")
    }
    
    // check user exist
    const checkUserExisted = await User.findOne({
        $or:[{username:username},{email:email}]
    })

    if(checkUserExisted){
        throw new ApiError(409, "User with email or username already exists")
    }

    let avatarImage = req.files?.avatar[0]?.path;
    let coverImage

    if(req.files?.coverImage && req.files?.coverImage.length > 0){
        coverImage = req.files?.coverImage[0]?.path;
    }

    if(!avatarImage){
        throw new ApiError(404,"Avatar Image required.")
    }

    
    const avatarUploaded = await uploadToCloud(avatarImage);
    const coverUploaded = await uploadToCloud(coverImage);
    
    if(!avatarUploaded){
        throw new ApiError(404,"Avatar Image required.")
    }


    const insertUser = await User.create({
        username:username.toLowerCase(),
        email:email,
        fullName :fullName,
        avatar : avatarUploaded,
        coverImage : coverUploaded || "",
        password
    })

    const getUserData = await User.findById(insertUser._id).select("-password -refreshToken");

    if(!getUserData){   
        throw new ApiError(500,"Something went wrong while registering the user.")
    }

    return res.status(200).json(
        new ApiResponse(200,getUserData,"User has been created.")
    );
})

const loginUser = asyncHandler(async(req,res) => {
    try {
        const {username,email,password} = req.body;

        if(!username || !email){
            throw new ApiError(400,"email and username is required.")
        }
        
        const userData = await User.findOne({
            $or:[{username},{email}]
        });

        if(!userData){
            throw new ApiError(404,"user doesn't exist")
        }

        const checkPassword = await userData.isPasswordCorrect(password);
        
        if(!checkPassword){
            throw new ApiError(400,"Password doesn't match.")
        }

       
        const {accessToken,refreshToken} = await generateAccessAndRefreshToken(userData._id);
        // console.log(accessToken);
        // return "l";
        const loggedInUser = await User.findById(userData._id).select("-password -refreshToken");

        const option = {
            httpOnly:true,
            secure:true
        }
        
        return res.status(200)
        .cookie("accessToken",accessToken,option)
        .cookie("refreshToken",refreshToken,option)
        .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser,accessToken,refreshToken
                },"User logged in successfully."
            )
        )
    
    } catch (error) {
        throw new ApiError(500,error)
    }
})

const logoutUser = asyncHandler(async (req,res) => {
    
    await User.findByIdAndUpdate(
        req.user?._id,
        {   
            $set:{
                 refreshToken : undefined
            }
           
        },{
            new:true
        }   
    )
    
    const option = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",option)
    .clearCookie("refreshToken",option)
    .json(
        new ApiResponse(200,"","User logout successfully.")
    )

})

const changePassword = asyncHandler (async (req,res) =>{
    const {oldPassword,newPassword} = req.body;
    console.log(oldPassword,"==",newPassword);
    
    if(oldPassword && newPassword){

        const userData = await User.findById(req.user._id)

        const isPassword = await userData.isPasswordCorrect(oldPassword)
        if(!isPassword){
            throw new ApiError(400,"Invalid old password")
        }

        userData.password = newPassword;
        userData.save({validateBeforeSave:false})
        return res.status(200).json(new ApiResponse(200,"Password changed"))
    }else{
        throw new ApiError(400,"old password and new password required")
    }
    
    
})

const getLoggedInUser = asyncHandler(async(req,res) => {
    const  userData = await User.findById(req.user._id).select("-password -refreshToken")
    return res.status(200).json( new ApiResponse(200,userData,"User fetch Successfully"))
})

const updateProfile = asyncHandler(async(req,res) => {
    
    const {username,fullName} = req.body
    if(
        [username,fullName].some((filed) => filed?.trim() === '')){
        throw new ApiError(400, "All fields are required")
    }

    const checkUserExisted = await User.findOne({
        username: username,
        _id: { $ne: req.user._id }

    })

    if(checkUserExisted){
        throw new ApiError(409, "User with email or username already exists")
    }
    
    let OldData  = await User.findById(req.user?._id)
    let setUpdatedData = {
        fullName,username
    }
    let avatarImage
    let coverImage

    if(req.files?.avatar && req.files?.avatar.length > 0){
        avatarImage = req.files?.avatar[0]?.path;
    }

    if(req.files?.coverImage && req.files?.coverImage.length > 0){
        coverImage = req.files?.coverImage[0]?.path;
    }
    
   
    if(avatarImage){
        const avatarUploaded = await uploadToCloud(avatarImage);
        setUpdatedData.avatar = avatarUploaded
        await deleteSingleFile(OldData?.avatar)
      
    }

    if(coverImage){
        const coverUploaded = await uploadToCloud(coverImage);
        setUpdatedData.coverImage = coverUploaded
        await deleteSingleFile(OldData?.coverImage)
    }


    let updatedData = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:setUpdatedData,

        },{new:true}
    ).select("-password")


    return res.status(200).json(new ApiResponse(200,updatedData,"User data updated."))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken =  req.cookies?.accessToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401,"Unauthorized request")
    }
    if(user?.refreshToken !== incomingRefreshToken){
        throw new ApiError(401,"Refresh token used")
    }


    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(userData._id);
    
    const option = {
        httpOnly:true,
        secure:true
    }
    
    return res.status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
               accessToken,refreshToken
            }
        )
    )
})


const getChannel = asyncHandler(async (req,res) =>{

    const {username} = req.query;
    if(!username){
        throw new ApiError(401,"username required")
    }

    let getChannelDetails = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup : {
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"subscriber",
                            foreignField:"_id",
                            as:"channelDetials",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            channelDetials:{
                                $first:"$channelDetials"
                            }
                        }
                    }
                ]

            }
        },
        {
            $lookup : {
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"channel",
                            foreignField:"_id",
                            as:"channelDetials",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            channelDetials:{
                                $first:"$channelDetials"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields :{
                subscribersCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond :{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else : false
                    }
                }
            }
        }
    ])

    return res.status(200).json(getChannelDetails)

})

export {registerUser,loginUser,logoutUser,getLoggedInUser,updateProfile,changePassword,refreshAccessToken,getChannel};