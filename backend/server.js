import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import playerRoutes from './routes/playerRoutes.js';
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/product.route.js";
dotenv.config(); // enable env vars

const app = express();
app.use(express.json());//allos us to use json data in the body
app.use(cors());

const PORT = process.env.PORT || 5000;
//postman destop app
console.log(process.env.MONGO_URI);
app.get('/', (req , res) => {
    res.send("Api has started");
});
app.use("/api/auth", authRoutes);
app.use("/api/products",productRoutes);
app.use('/api', playerRoutes);
app.listen(PORT, () => {
    connectDB();
    console.log("Server started at http://localhost:"+PORT);
});
