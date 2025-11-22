/* REFERENCES...
id string pk
username string
email string
fullName string
avatar string
coverImage string
watchHistory ObjectId[] videos
password string 
refreshToken string
createdAt Date
updateAt Date
*/


import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

//here we define how the models will like in mongodb..
//its like a structure which is going to refer in creating User..
const userSchema = new Schema(
    {
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  password: {
    type: String,
    required: [true, "password is required."],
  },
  refreshToken: {
    type: String
  }
},
  {timestamps: true}

);

//password should be encrypted so we install a module called bcrypt and going to work on it..
//now we will implement a hook(pre, post) in the userSchema
userSchema.pre("save", async function (next) {
  //if the password is not modified then just return
  if (!this.isModified("password")) return next();

  //now hashed the password.
  this.password = await bcrypt.hash(this.password, 10); //hashed the password with 10 rounds
  next();
});



  //now the encrypted password must be becrypted so that we know the password..
  userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  ///generating access token..
  userSchema.methods.generateAccessToken = function () {
    //short lived access tokens.
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  };

  ///generating refresh token..
  userSchema.methods.generateRefreshToken = function () {
    //short lived access tokens.
    return jwt.sign(
      {
        _id: this._id,
       
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
  };





export const User = mongoose.model("User", userSchema)  //we are exporting User and User will be created using mongoose..
//It's like Hey mongoose i want to build a model in DB named User and the structure it will follow is the "userSchema"

