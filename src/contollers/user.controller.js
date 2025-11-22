import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


//A HELPER METHOD FOR GENERATING ACCESS AND REFRESH TOKEN...
const generateAccessAndRefreshToken = async(userId) => {
    //whole thing might be failed so we wrap up it in try-catch block..
    try {
        const user = await User.findById(userId)
        
        if(!user){
            throw new ApiError(404, "We couldn't find the user..")
        }
    
        const accessToken = user.generateAccessToken()
        const refreshToken  = user.generateRefreshToken()
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens..")
    }
}

///CONTROLLER FOR REGISTERING THE USER..
const registerUser = asyncHandler( async (req, res) => {
    //now what to accept from body..
    const {fullname, email, username, password} = req.body;

    //validation..(WITHOUT WRITING VALIDATION SEPARATELY WE CAN DO IT IN ONE GOLL)
    // if(fullName?.trim() === ""){
    //     throw new ApiError()
    // }
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required..")
    }

    //checking whether user previously register or not.?
    const existedUser = await User.findOne({
        $or: [{username}, {email}] //$or is a mongodb query to find somthing in the DB
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists..")
    }

    //now handles the images (IMAGES COMES IN FILES)
    console.warn(req.files)
   const avatarLocalPath =  req.files?.avatar?.[0]?.path //unlocking the avatar path
   const coverLocalPath = req.files?.coverImage?.[0]?.path

   if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
   }
//    const avatar = await uploadOnCloudinary(avatarLocalPath)

//    let coverImage = ""
//    if(coverLocalPath){
//         coverImage = await uploadOnCloudinary(coverLocalPath)
//    }
let avatar;
try {
    avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("Uploaded avatar", avatar)
} catch (error) {
    console.log("Error uploading avatar..", error);
    throw new ApiError(500, "Failed to upload avatar.")
    
}

let coverImage;
try {
  coverImage = await uploadOnCloudinary(coverLocalPath);
  console.log("Uploaded coverImage", coverImage);
} catch (error) {
  console.log("Error uploading coverImage..", error);
  throw new ApiError(500, "Failed to upload coverImage.");
}




//now constructing a user
   try {
    const user = await User.create({
     fullname,
     avatar: avatar.url,
     coverImage: coverImage?.url || "",
     email, 
     password,
     username: username.toLowerCase()
    })
      console.log("User created successfully:", user);
 
    const createdUser = await User.findById(user._id).select("-password -refreshToken");  //here we eliminate the password and refreshtoken.
 
    if(!createdUser){
     throw new ApiError(500, "Something went wrong while registering a user..")
    }
 
    return res
         .status(201)
         .json( new ApiResponse(200, createdUser, "User registered successfully."))
   } catch (error) {
    console.log("user creation failed.");

    if(avatar){
        await deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage){
        await deleteFromCloudinary(coverImage.public_id)
    }

    throw new ApiError(
           500,
           "Something went wrong while registering a user and images were deleted.."
         );

   }

})


//CONTROLLER FOR LOGIN THE USER...
const loginUser = asyncHandler(async(req,res) => {
    //get data from body..
    const {email, username, password} = req.body;

    //validation
    if(!email){
        throw new ApiError(400, "Email is required..")
    }

    //check if user is existed
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    //if no user is found...
    if(!user){
        throw new ApiError(404, "User not found..")
    }

    //now validate the data passed by the user & the data present in DB is same or not (VALIDATE PASSWORD.)
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials..")
    }

    //grab the accesstoken and refresh token..
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    if(!loggedInUser){
        throw new ApiError(404, "Failed to login useer..")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, loggedInUser, "User logged in successfully"))

})

//LOGOUT A USER..
const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {new: true}
    );
    
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully.."))



})

//GENERATING FRESH ACCESS TOKEN..
const refreshAccessToken = asyncHandler(async (req,res) => {
    //first get the existing refresh token
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required")
    }

    try {
        //decoding the incoming token
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

      //finding the token in DB
      const user = await User.findById(decodedToken?._id)

      //if the user not found
      if(!user){
        throw new ApiError(401, "Invalid refresh token.")
      }

      //checking the incoming token is same as the DB(if not same)
      if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Invalid refresh token.")
      }

      //now generating a new token and send it
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      }

      const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)


      return res
        .status(200)
        .cookie("acccessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                 {accessToken,
                    refreshToken: newRefreshToken},
            "Access token refresh successfully."
        ))




    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing access token..")
    }

})


//HERE'S THE SIMPLE CRUD OPERATIONS..
/**
 * STEPS
 * 1. TAKE THE DATA FROM THE USER
 * 2. VALIDATE THE DATA WITH DB
 * 3. HAVE COMPLETION..
 */
//CHANGING OF PASSWORD..
const changeCurrentPassword = asyncHandler( async(req,res) => {
    //grab the old and new password
    const {oldPassword, newPassword} = req.body

    //finding user from DB
    const user = await User.findById(req.user?._id)

    //checks if the password valid..
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    //if not valid throw error
    if(!isPasswordValid){
        throw new ApiError(401, "Old password is incorrect..")
    }

    //here the new password updation happens..
    user.password = newPassword

    //after asigning the password save this..
    await user.save({validateBeforeSave: false})

    //then return response..
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully."))



})


//TO GET CURRENT USER
const getCurrentUser = asyncHandler( async(req,res) => {
    ///to get the current user, we have to just return the request because the user is already stored in req..
    return res.status(200).json(new ApiResponse(200, req.user, "Current user details.."))
})

//TO UPDATE ACCOUNT DETAILS..
const updateAccountDetails = asyncHandler( async(req,res) => {
     const {fullname, email} = req.body

     if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required..")
     }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
     ).select("-password -refreshToken")


     return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully.."))
})

//TO UPDATE AVATAR..
const updateUserAvatar = asyncHandler( async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "File is required..")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(500, "Something went wrong while uploading avatar..")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")


    res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully."))
})

//TO UPDATE COVERIMAGE..
const updateUserCoverImage = asyncHandler( async(req,res) => {
    //grab the file path
    const coverImageLocalPath =  req.file?.path

    //if no file path is there..
    if(!coverImageLocalPath){
        throw new ApiError(400, "File is required..")
    }

    //if the file path is there upload it on cloudinary..
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //if no coverimage found..
    if(!coverImage){
        throw new ApiError(500, "Something went wrong while uploading the image.")
    }


    //noow changing the coverImage..
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Cover image uploaded successfully.."))

})

//MONGODB AGGREGATION PIPELINE.........
const getUserChannelProfile = asyncHandler( async (req, res) => {
    //get the username from the url
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is required.")
    }

    const channel = await User.aggregate([
      //a pipeline..
      {
        $match: {
          username: username.toLowerCase(),
        },
      },
      //another pipeline..(to check my subscribers.)
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      ///another pipeline..(which channel i have subscribed..)
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
                if: {
                    $in: [req.user?._id, "$subscribers.subscriber"]
                },
                then: true,
                else: false
            }
          }
        },
      },
      {
        //Project only the necessary data
        $project: {
            fullname: 1,
            username: 1,
            avatar: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            coverImage: 1,
            email: 1
        }
      }
    ]);

    if(!channel?.length){
        throw new ApiError(404, "Channel not found..")
    }

    return res.status(200).json(new ApiResponse(200,
        channel[0],
        "Channel profile fetched successfully."
    ))



})

const getWatchHistory = asyncHandler( async(req, res) => {
    //aggregate takes an array as an input
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                pipeline: [{
                    $lookup:{
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",

                        pipeline: [{
                            $project: {
                                fullname: 1,
                                username: 1,
                                avatar: 1
                            }
                        }]
                    }
                }, {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }
            ]
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully.."));


})



export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};