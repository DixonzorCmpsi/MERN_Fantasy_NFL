import Product from "../models/product.model.js";



export const postProduct = async (req, res) =>{
    const product = req.body;//user will send this data
    if(!product.name || !product.price || !product.image){
        return res.status(400).json({success:false, massage: 
            "please provide all fields"
        })
    }
    const newProduct = new Product(product);

    try {
        await newProduct.save();
        res.status (201).json({success:true, data: newProduct});
        
    } catch (error) {
        console.error("error in create product:", error.massage);
        res.status(500).json({success: false, message:"server error"});
    }
}


export const getProducts = async(req, res) => {
    try{
        const products = await Product.find({});
        res.status(200).json({success: true, data: products});
    }catch(error){
        console.log("error in displaying products");
        res.status(500).json({success: false, message: "Products Unavailable"});
    }

}
export const putProducts = async(req, res) => {
    const {id} = req.params;
    const product = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({success:false, message:"Invalid product id"});
    }
    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, product, {new:true});
        res.status(200).json({success: true, data: updatedProduct})
    } catch (error) {
        console.log("could not update product");
        res.status(500).json({success: false, message: "server error: could not update product"});
    } 	
}
export const deleteProducts = async (req, res) => {
    const {id} = req.params;
    try {
        await Product.findByIdAndDelete(id);
        res.status(200).json({success: true, message: "Product deleted"});
        
    } catch (error) {
        console.log("Coudn't find product, make sure the Id is correct");
        res.status(404).json({success: false, message: "Product deletion failure"});
    }
    console.log("id:", id);

}