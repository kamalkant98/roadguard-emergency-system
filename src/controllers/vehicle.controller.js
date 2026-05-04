import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mysqlPool from "../database/index.js";


//Create Vehicle
export const createVehicle = asyncHandler(async (req, res) => {
  try {
    const {
    //   user_id,
      vehicle_number,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_type,
      fuel_type,
      color,
      is_default,
      vehicle_latitude,
      vehicle_longitude,
    } = req.body;
    const user_id = req.user?.id;

    if (!user_id || !vehicle_number) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User ID and Vehicle Number are required"));
    }

    // handle default vehicle
    if (is_default) {
      await mysqlPool.query(
        "UPDATE user_vehicles SET is_default = 0 WHERE user_id = ?",
        [user_id]
      );
    }

    const [result] = await mysqlPool.query(
      `INSERT INTO user_vehicles 
      (user_id, vehicle_number, vehicle_make, vehicle_model, vehicle_year, vehicle_type, fuel_type, color, is_default, vehicle_latitude, vehicle_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        vehicle_number,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_type,
        fuel_type,
        color,
        is_default || 0,
        vehicle_latitude,
        vehicle_longitude,
      ]
    );

    return res
      .status(201)
      .json(new ApiResponse(201, result, "Vehicle created successfully"));

  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message));
  }
});


// Get All Vehicles
export const getUserVehicles = asyncHandler(async (req, res) => {
  try {
    // const { user_id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User ID is required"));
    }

    const [vehicles] = await mysqlPool.query(
      "SELECT * FROM user_vehicles WHERE user_id = ? ORDER BY is_default DESC",
      [user_id]
    );

    return res
      .status(200)
      .json(new ApiResponse(200, vehicles, "Vehicles fetched successfully"));

  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message));
  }
});


//Get Single Vehicle
export const getVehicleById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const [vehicle] = await mysqlPool.query(
      "SELECT * FROM user_vehicles WHERE id = ?",
      [id]
    );

    if (!vehicle.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Vehicle not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, vehicle[0], "Vehicle fetched successfully"));

  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message));
  }
});


//Update Vehicle
export const updateVehicle = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const {
      user_id,
      vehicle_number,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vehicle_type,
      fuel_type,
      color,
      is_default,
      vehicle_latitude,
      vehicle_longitude,
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Vehicle ID is required"));
    }

    if (is_default) {
      await mysqlPool.query(
        "UPDATE user_vehicles SET is_default = 0 WHERE user_id = ?",
        [user_id]
      );
    }

    const [result] = await mysqlPool.query(
      `UPDATE user_vehicles SET 
        vehicle_number=?,
        vehicle_make=?,
        vehicle_model=?,
        vehicle_year=?,
        vehicle_type=?,
        fuel_type=?,
        color=?,
        is_default=?,
        vehicle_latitude=?,
        vehicle_longitude=?
       WHERE id=?`,
      [
        vehicle_number,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vehicle_type,
        fuel_type,
        color,
        is_default || 0,
        vehicle_latitude,
        vehicle_longitude,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Vehicle not found or not updated"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Vehicle updated successfully"));

  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message));
  }
});


// Delete Vehicle
export const deleteVehicle = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await mysqlPool.query(
      "DELETE FROM user_vehicles WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Vehicle not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Vehicle deleted successfully"));

  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message));
  }
});