
export interface IProduct {
    name: string;
    description: string;
    price: number;
    quantity: number;
    image?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    updatedAt?: Date;
    createdAt?: Date;
}