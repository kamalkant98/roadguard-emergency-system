import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import mysqlPool from "../database/index.js";
// export const authenticateUser = asyncHandler(async (req, res, next) => {
//   try {
//     console.log("asdasdasd");
    
//     const accessToken =
//       req.cookies?.accessToken ||
//       req.header("Authorization")?.replace("Bearer ", "");
//     // const accessToken = req.header("Authorization")?.replace("Bearer ","");
//     if (!accessToken) {
//       throw new ApiError(401, "Unauthorized request");
//     }
//     const decodedToken = jwt.verify(
//       accessToken,
//       process.env.ACCESS_TOKEN_SECRET
//     );
//     console.log(decodedToken,"====");
    

//     if (!user) {
//       throw new (404, "Authorized user not found.")();
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     throw new ApiError(500, error);
//   }
// });

export const authenticateUser = asyncHandler(async (req, res, next) => {
  try {
    // 1. Get token
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized request - No token");
    }

    // 2. Verify token
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    // 3. Fetch user from MySQL
    const [rows] = await mysqlPool.execute(
      "SELECT * FROM users WHERE id = ?",
      [decoded.id]
    );

    const user = rows[0];

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 4. Attach user to request
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid token");
  }
});