import { useState } from "react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  status: string;
  paymentMethods: string[];
  deliveryDays: number;
  minOrder: number;
  shippingFee: string;
}

interface ProductCardProps {
  product: Product;
  onClick: (id: number) => void;
}

const ProductCard = ({ product, onClick }: ProductCardProps) => {
  return (
    <div
      onClick={() => onClick(product.id)}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border border-slate-100"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {product.status}
          </span>
        </div>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-green-600">Ksh {parseFloat(product.price).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 21h10a1 1 0 001-1V7a1 1 0 00-1-1H7a1 1 0 00-1 1v13a1 1 0 001 1zM9 9h6m-3 5h3m-3-8h.01M9 16h.01"></path></svg>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
