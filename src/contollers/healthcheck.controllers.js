import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const healthCheck = asyncHandler(async (req, res) => {
    // return res
    //     .status(200)
    //     .json({message: "test ok"})  this type of response may be sent but ideal would be the Apiresponse..

    return res
        .status(200)
        .json(new ApiResponse(200, "OK", "Health check passed.."))

}); 

export {healthCheck}


/* Remember
    every controller should get its route in the route folder...
*/