import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "../models/user.model.js"; // added `.js` extension

export const postUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    console.log("Not all fields are entered");
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, data: newUser, message: "New user created" });
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ success: false, message: "Server failed to create user" });
  } 
};
// export const SignUp1 = async (req, res) =>{
//   const {name, email, password} = req.body;
//   if(!name || !email ||!password){
//     res.status(404).json({success: false, message: "All fields must be failed in"});
//   };
//   const existGuy = await findOne(email);
//   if (existGuy){
//     res.status(404).json({success: false, message: "user already created"});
//   }
//   const saltt = await bcrypt.genSalt(10);
//   const hashedPass = await bcrypt.hash(password, saltt);
//   const newGuy = new User({name, email, password: hashedPass});

//   try {
//     await newGuy.save();
//     res.status(201).json({success:true, message: "New user added", data: newGuy});
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({success: false, message: "Server erro, whilst adding user"});
//     console.log("Server error adding user");
//   }

// }

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email }); // FIXED: was missing `User.`
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    return res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// export const Login1 = async (req, res) => {
//   const {email, password} = req.body;
//   if(!email || !password){
//     return res.status(404).json({success: false, message: "Enter all fields"});
//   }
//   try {
//     const user1 = await User.findOne({email})
//     if(!user1){
//       console.log("User Doesn't Exist, Please sign up!!");
//       return res.status(404).json({success: false, message: "User does not exist"});
//     }
//     const isMatch1 = await bcrypt.compare(password, user1.password);
//     if(!isMatch1){
//       console.log("Password Doesn't Match");
//       return res.status(401).json({success:false, message:"password doesn't match"});
//     }
//     const token = jwt.sign(
//       {id: user1._id, email: user1.email},
//       process.env.JWT_SECRET,
//       {expiresIn: "1h"}

//     );

//     return res.status(200).json({success: true, message: "Successfull login", User1:{id: user1._id, name: user1.name, email: user1.email}, token});

//   } catch (error) {
//     console.error("This is the error" + error);
//     return res.status(500).json({success:true, message: "Server error, whilst loggin in"});
//   }


// } 