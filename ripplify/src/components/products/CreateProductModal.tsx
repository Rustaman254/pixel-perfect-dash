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

interface CreateProductModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateProductModal = ({ open, onClose, onSubmit }: CreateProductModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    status: "Active",
    paymentMethods: ["mpesa"],
    deliveryDays: 3,
    minOrder: 1,
    shippingFee: "50"
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Create New Product</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
              <input type="text" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter product name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price (KES) *</label>
              <input type="number" step="0.01" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea required rows={4} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Enter product description"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="food">Food & Beverages</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
              <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Days</label>
              <input type="number" min="1" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.deliveryDays} onChange={(e) => setFormData({...formData, deliveryDays: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Order (KES)</label>
              <input type="number" min="0" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.minOrder} onChange={(e) => setFormData({...formData, minOrder: parseInt(e.target.value)})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Methods *</label>
              <select multiple required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.paymentMethods} onChange={(e) => {
                const options = Array.from(e.target.selectedOptions).map(o => o.value);
                setFormData({...formData, paymentMethods: options});
              }}>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Credit Card</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Shipping Fee (KES)</label>
              <input type="number" step="0.01" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" value={formData.shippingFee} onChange={(e) => setFormData({...formData, shippingFee: parseFloat(e.target.value)})} placeholder="e.g. 50" />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Product
            </button>
            <button type="button" onClick={onClose} className="px-8 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
