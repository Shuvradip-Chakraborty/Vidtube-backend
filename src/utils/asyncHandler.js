/* its a higher order function..
    when multiple routes are designed then for every get, post request we have to use try catch and async, for that there are many try catch block, so to avoid this there is asynHandler...
*/

/*
AsynHandler is a higher order function which takes another function name requestHandler as parameter and return a middleware funtion which handles the route or if there are any problem that will be handled by .catch() method...

*/

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            next(err)
        })
    }
}


export {asyncHandler}