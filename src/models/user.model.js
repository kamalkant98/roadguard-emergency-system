import mongoose,{Schema} from "mongoose";
import bcrpty from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({

    username:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    fullName:{
        type:String,
        required:true,
        trim: true,
        index: true,
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
        default:""
        // required:true,
    },
    password:{
        type:String,
        required:[true,"Password id required."],
        trim: true,
    },
    refreshToken:{
        type:String,
        // default:null,
    },
    watchHistory:[
        {
            type: mongoose.Types.ObjectId,
            ref:"Video"
        }
    ],
    
},{timestamps:true});

userSchema.pre("save", async function(next){

    if(this.isModified("password")){
       this.password = await bcrpty.hash(this.password,10); 
    } 

    return next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    let comparePass = await bcrpty.compare(password,this.password);
    return comparePass
}


userSchema.methods.generateAccessToken = async function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken = async function(){
    return  jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User',userSchema);