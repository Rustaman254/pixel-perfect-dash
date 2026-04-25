import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BASE_URL } from "@/lib/api";
import ProductsListTable from "@/components/products/ProductsListTable";
import ProductCard from "@/components/products/ProductCard";
import CreateProductModal from "@/components/products/CreateProductModal";
import { Product } from "@/types/product";

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (productData: any) => {
    try {
      const response = await fetch(`${BASE_URL}/products`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(productData)
      });
      
      if (response.ok) {
        toast({ title: "Product Created", description: "Product has been listed successfully." });
        setShowCreateModal(false);
        fetchProducts();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleProductClick = (id: number) => {
    navigate(`/products/${id}`);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle view"
            >
              {viewMode === 'grid' ? 'Table View' : 'Grid View'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Products View */}
        {viewMode === 'table' ? (
          <ProductsListTable
            products={filteredProducts}
            onProductClick={handleProductClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product.id)}
              />
            ))}
          </div>
        )}

        <CreateProductModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProduct}
        />
      </div>
    </div>
  );
};

export default ProductsPage;

export { ProductsListTable, ProductCard, CreateProductModal };