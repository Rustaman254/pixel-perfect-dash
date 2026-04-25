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

interface ProductTableRowProps {
  product: Product;
  onProductClick: (id: number) => void;
}

const ProductTableRow = ({ product, onProductClick }: ProductTableRowProps) => {
  return (
    <tr
      onClick={() => onProductClick(product.id)}
      className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
    >
      <td className="px-6 py-4">
        <div className="font-medium text-slate-900">{product.name}</div>
        <div className="text-sm text-slate-500">{product.description}</div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-2xl font-bold text-green-600">Ksh {parseFloat(product.price).toLocaleString()}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {product.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{product.category}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Delete">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

interface ProductsListTableProps {
  products: Product[];
  onProductClick: (id: number) => void;
}

const ProductsListTable = ({ products, onProductClick }: ProductsListTableProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductTableRow key={product.id} product={product} onProductClick={onProductClick} />
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-20 text-slate-400">
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsListTable;
export { ProductTableRow };
