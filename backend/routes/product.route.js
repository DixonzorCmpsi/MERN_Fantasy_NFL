import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { deleteProducts, getProducts, postProduct, putProducts} from '../controller/product.controller.js';

const router = express.Router();
router.post("/", postProduct);

router.delete("/:id", deleteProducts);
 
router.get('/', getProducts);

router.put('/:id', putProducts );

export default router;