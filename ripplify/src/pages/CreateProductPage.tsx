import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/lib/api";

interface ProductFormData {
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

const CreateProductPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<ProductFormData>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing 
        ? `${BASE_URL}/products/${id}`
        : `${BASE_URL}/products`;
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast({ 
          title: isEditing ? "Product Updated" : "Product Created",
          description: `Product has been ${isEditing ? 'updated' : 'created'} successfully.`
        });
        navigate("/products");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save product");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/products")} className="text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Product" : "Create New Product"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>

          {/* Pricing and Category */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Pricing & Category</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price (KES) *</label>
                <input
                  type="number" step="0.01" required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food & Beverages</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Options</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Methods *</label>
                <select
                  multiple
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  value={formData.paymentMethods}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions).map(o => o.value);
                    setFormData({...formData, paymentMethods: options});
                  }}
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Days</label>
                  <input
                    type="number" min="1" required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                    value={formData.deliveryDays}
                    onChange={(e) => setFormData({...formData, deliveryDays: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Order (KES)</label>
                  <input
                    type="number" min="0" required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({...formData, minOrder: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Shipping Fee (KES)</label>
                  <input
                    type="number" step="0.01" required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                    value={formData.shippingFee}
                    onChange={(e) => setFormData({...formData, shippingFee: parseFloat(e.target.value)})}
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Status</h2>
            </div>
            <div className="p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  checked={formData.status === 'Active'}
                  onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Active' : 'Inactive'})}
                />
                <span className="text-sm font-medium text-slate-700">
                  {formData.status === 'Active' ? 'Active' : 'Inactive'} Product
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Save className="w-5 h-5" />
              {isEditing ? "Update Product" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="px-8 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductPage;