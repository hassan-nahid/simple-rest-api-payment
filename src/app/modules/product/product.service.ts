import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IProduct } from "./product.interface";
import { Product } from "./product.model";

const createProduct = async (payload: IProduct) => {
    const result = await Product.create(payload);
    return result;
};

const getAllProducts = async (query: Record<string, unknown>) => {
    const productQuery = new QueryBuilder(
        Product.find({ isDeleted: false }),
        query as Record<string, string>
    )
        .search(["name", "description"])
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await productQuery.modelQuery;
    const meta = await productQuery.getMeta();

    return {
        meta,
        result,
    };
};

const getSingleProduct = async (id: string) => {
    const result = await Product.findById(id);

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (result.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product has been deleted");
    }

    return result;
};

const updateProduct = async (id: string, payload: Partial<IProduct>) => {
    const product = await Product.findById(id);

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (product.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot update deleted product");
    }

    const result = await Product.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

const deleteProduct = async (id: string) => {
    const product = await Product.findById(id);

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (product.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "Product already deleted");
    }

    const result = await Product.findByIdAndUpdate(
        id,
        { isDeleted: true, isActive: false },
        { new: true }
    );

    return result;
};

export const ProductServices = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
