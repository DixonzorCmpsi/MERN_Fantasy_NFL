import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    prices:{
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
}, {timestamp: true}//have meta data, like created at and updated at in doc
);
const Product = mongoose.model(`Product`,productSchema);
export default Product;