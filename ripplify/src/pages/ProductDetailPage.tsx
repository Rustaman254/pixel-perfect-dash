import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Upload, Calendar, DollarSign, TrendingUp, Package, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { BASE_URL } from "@/lib/api";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProduct(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast({ title: "Product Updated", description: "Your product has been updated successfully." });
        setIsEditing(false);
        fetchProduct();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update product");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        toast({ title: "Status Updated", description: `Product status changed to ${newStatus}.` });
        fetchProduct();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>;
  if (!product) return <div className="text-center py-20"><h1 className="text-2xl font-bold text-slate-900">Product not found</h1></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-5 h-5" /> Back to Products
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.status}
                  </span>
                  {product.category && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{product.category}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
                    <button onClick={handleUpdateProduct} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    Edit Product
                  </button>
                )}
                <button onClick={() => handleStatusChange(product.status === 'Active' ? 'Inactive' : 'Active')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  {product.status === 'Active' ? 
                    <CheckCircle2 className="w-5 h-5 text-green-600" /> : 
                    <XCircle className="w-5 h-5 text-red-600" />
                  }
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                  <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={4} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none resize-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price (KES) *</label>
                    <input type="number" name="price" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required step="0.01" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                    <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none">
                      <option value="">Select Category</option>
                      <option value="electronics">Electronics</option>
                      <option value="clothing">Clothing</option>
                      <option value="food">Food & Beverages</option>
                      <option value="services">Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Methods *</label>
                    <select name="paymentMethods" multiple required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none">
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="card">Credit Card</option>
                      <option value="cash">Cash on Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Days</label>
                    <input type="number" name="deliveryDays" value={formData.deliveryDays} onChange={(e) => setFormData({...formData, deliveryDays: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" placeholder="e.g., 3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Order</label>
                    <input type="number" name="minOrder" value={formData.minOrder} onChange={(e) => setFormData({...formData, minOrder: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Shipping Fee (KES)</label>
                    <input type="number" name="shippingFee" value={formData.shippingFee} onChange={(e) => setFormData({...formData, shippingFee: parseFloat(e.target.value)})} step="0.01" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none" placeholder="50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Drag and drop images here or click to upload</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-700">Price</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">Ksh {parseFloat(product.price).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-slate-700">Category</span>
                    </div>
                    <p className="text-slate-600">{product.category}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-slate-700">Payment Methods</span>
                    </div>
                    <p className="text-slate-600">{product.paymentMethods.join(', ')}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Description</h3>
                  <p className="text-slate-600 leading-relaxed">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-slate-700">Delivery</span>
                    </div>
                    <p className="text-slate-600">{product.deliveryDays} days</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      <span className="font-medium text-slate-700">Min Order</span>
                    </div>
                    <p className="text-slate-600">Ksh {product.minOrder}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;