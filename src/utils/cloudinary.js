import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloud = async (localFilePath) =>{
    try {
        if(!localFilePath) return null;
        const resData =  await cloudinary.uploader.upload(localFilePath,{ resourse_type:"auto"});
        // console.log("file uploaded");
        fs.unlinkSync(localFilePath)
        return resData?.url
    } catch (error) {
        // return error
        fs.unlinkSync(localFilePath)
    }
}

const deleteSingleFile = async(filepath) =>{
    try {

        // const publicId = await cloudinary.uploader.url(filepath).public_id;
        const url = filepath;
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        const filenameParts = lastPart.split('.');
        const filenameWithoutExt = filenameParts.slice(0, -1).join('.');
        const resData =  await cloudinary.uploader.destroy(filenameWithoutExt,{type:"upload", resourse_type:"auto"})
        
        return resData
    } catch (error) {
        return error
    }
}


export {uploadToCloud,deleteSingleFile}
