"use client";
import { fetchWithAuth } from '@/utils/fetchWithAuth';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, X, Loader2, Package, Sparkles } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function ProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Eyeglasses',
    brand: '',
    shape: '',
    gender: 'Unisex',
    price: '',
    discount: '',
    stock: '',
    imageUrl: ''
  });

  // Global Attributes State
  const [globalBrands, setGlobalBrands] = useState<string[]>([]);
  const [globalShapes, setGlobalShapes] = useState<string[]>([]);
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [editingAttrKey, setEditingAttrKey] = useState<'storeBrands' | 'storeShapes'>('storeBrands');
  const [attrInputValue, setAttrInputValue] = useState('');

  const fetchProductsAndSettings = () => {
    setIsLoading(true);
    // Fetch Products
    fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setIsLoading(false);
      });
      
    // Fetch Settings
    fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.storeBrands) setGlobalBrands(JSON.parse(data.storeBrands));
        else setGlobalBrands(["EYEVENGERS", "Ray-Ban", "Oakley", "Lenskart"]);
        
        if (data.storeShapes) setGlobalShapes(JSON.parse(data.storeShapes));
        else setGlobalShapes(["Rectangle", "Round", "Aviator", "Wayfarer", "Cat Eye"]);
      })
      .catch(err => console.error("Error fetching settings:", err));
  };

  useEffect(() => {
    fetchProductsAndSettings();
  }, []);

  const openAddModal = () => {
    setEditingProductId(null);
    setNewProduct({
      name: '',
      sku: '',
      category: 'Eyeglasses',
      brand: globalBrands[0] || '',
      shape: globalShapes[0] || '',
      gender: 'Unisex',
      price: '',
      discount: '',
      stock: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProductId(product.id);
    
    let realSku = product.sku || '';
    let discountVal = '';
    let shapeVal = '';
    
    if (realSku.includes('|SHAPE:')) {
      const parts = realSku.split('|SHAPE:');
      shapeVal = parts[1].split('|')[0];
      realSku = realSku.replace(`|SHAPE:${shapeVal}`, '');
    }
    
    if (realSku.includes('|DISCOUNT:')) {
      const parts = realSku.split('|DISCOUNT:');
      discountVal = parts[1].split('|')[0];
      realSku = realSku.replace(`|DISCOUNT:${discountVal}`, '');
    }
    
    setNewProduct({
      name: product.name || '',
      sku: realSku,
      category: product.category || 'Eyeglasses',
      brand: product.brand || '',
      shape: shapeVal || globalShapes[0] || '',
      gender: product.gender || 'Unisex',
      price: product.price !== undefined ? product.price.toString() : '',
      discount: discountVal,
      stock: product.stock !== undefined ? product.stock.toString() : '',
      imageUrl: product.image_url || product.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("An error occurred while deleting the product.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const url = editingProductId 
      ? `https://eyevengers-web.onrender.com/api/admin/products/${editingProductId}` 
      : `https://eyevengers-web.onrender.com/api/admin/products`;
    const method = editingProductId ? 'PUT' : 'POST';

    // Store discount and shape in SKU
    let payloadSku = newProduct.sku;
    if (newProduct.discount) payloadSku += `|DISCOUNT:${newProduct.discount}`;
    if (newProduct.shape) payloadSku += `|SHAPE:${newProduct.shape}`;
    
    const { discount, shape, ...restProduct } = newProduct;
    const payload = {
      ...restProduct,
      sku: payloadSku,
      price: parseFloat(newProduct.price) || 0,
      stock: parseInt(newProduct.stock, 10) || 0,
      image_url: newProduct.imageUrl
    };

    try {
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedProduct = await res.json();
        if (editingProductId) {
          setProducts(prev => prev.map(p => p.id === editingProductId ? savedProduct : p));
        } else {
          setProducts(prev => [savedProduct, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Failed to save product.");
      }
    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Network error: Could not save product.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = product.name?.toLowerCase().includes(q);
        const skuMatch = product.sku?.toLowerCase().includes(q);
        const brandMatch = product.brand?.toLowerCase().includes(q);
        const catMatch = product.category?.toLowerCase().includes(q);
        if (!nameMatch && !skuMatch && !brandMatch && !catMatch) return false;
      }
      // Category filter
      if (selectedCategory !== 'All Categories' && product.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'Active' && Number(product.stock) <= 0) {
        return false;
      }
      if (selectedStatus === 'Out of Stock' && Number(product.stock) > 0) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="flex flex-col h-full relative space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Products Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your catalog, inventory levels, specifications, and media.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAttrModalOpen(true)}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} className="text-brand-navy" />
            Manage Attributes
          </button>
          <button 
            onClick={openAddModal}
            className="px-4 py-2.5 bg-brand-navy hover:bg-blue-900 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-gray-50/60">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, SKU, brand..." 
              className="w-full pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 placeholder:text-gray-400 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy cursor-pointer"
            >
              <option>All Categories</option>
              <option>Eyeglasses</option>
              <option>Sunglasses</option>
              <option>Contact Lenses</option>
              <option>Lens Cleaner</option>
              <option>Contact Lens Solution</option>
              <option>Kids</option>
              <option>Eyevengers Special</option>
            </select>

            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy cursor-pointer"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] gap-3">
              <Loader2 className="animate-spin text-brand-navy" size={40} />
              <p className="text-sm font-medium text-gray-500">Loading catalog products...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50/80 text-gray-700 uppercase font-semibold text-xs tracking-wider sticky top-0 border-b border-gray-200 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Category & Brand</th>
                  <th className="px-6 py-3.5">Gender</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Stock</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const firstImg = (product.image_url || product.imageUrl || '').split(',')[0]?.trim();
                  const displaySku = product.sku && product.sku.includes('|DISCOUNT:') 
                    ? product.sku.split('|DISCOUNT:')[0] 
                    : (product.sku && product.sku.includes('|SHAPE:') ? product.sku.split('|SHAPE:')[0] : product.sku);

                  return (
                    <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {firstImg ? (
                              <img src={firstImg} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            ) : (
                              <Package className="text-gray-300" size={20} />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 group-hover:text-brand-navy transition-colors">{product.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-medium text-gray-600 bg-gray-50/40 rounded">
                        {displaySku || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{product.category}</div>
                        <div className="text-xs text-gray-400 font-medium">{product.brand || 'Generic'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {product.gender || 'Unisex'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          Number(product.stock) > 5 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : Number(product.stock) > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                            : 'bg-red-50 text-red-700 border border-red-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            Number(product.stock) > 5 ? 'bg-emerald-500' : Number(product.stock) > 0 ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          {Number(product.stock) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => openEditModal(product)} 
                            className="p-2 text-gray-400 hover:text-brand-navy hover:bg-blue-50 rounded-lg transition" 
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" 
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package size={40} className="text-gray-300" />
                        <p className="text-base font-semibold text-gray-700">No products found</p>
                        <p className="text-sm text-gray-400 max-w-sm">
                          {searchQuery || selectedCategory !== 'All Categories' || selectedStatus !== 'All Statuses'
                            ? "Try adjusting your search query or filters to find what you're looking for."
                            : "Your product catalog is empty. Click '+ Add Product' to create one."}
                        </p>
                        {(searchQuery || selectedCategory !== 'All Categories' || selectedStatus !== 'All Statuses') && (
                          <button 
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('All Categories');
                              setSelectedStatus('All Statuses');
                            }}
                            className="mt-2 text-xs font-semibold text-brand-navy hover:underline cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination summary */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
          <div>
            Showing <span className="font-semibold text-gray-800">{filteredProducts.length}</span> of <span className="font-semibold text-gray-800">{products.length}</span> products
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-gray-400 flex items-center">
              All inventory synced with store
            </span>
          </div>
        </div>

      </div>

      {/* Add / Edit Product Modal with Seamless Scrollable View */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingProductId ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingProductId ? 'Update specifications, pricing, inventory and media' : 'Create and publish a new item to your online catalog'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => !isSaving && setIsModalOpen(false)} 
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Section: General Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Basic Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={newProduct.name} 
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400" 
                        placeholder="e.g. Midnight Blue Acetate Frame" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={newProduct.sku} 
                        onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400 font-mono" 
                        placeholder="e.g. E-10055" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Category</label>
                      <select 
                        value={newProduct.category} 
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 transition-all cursor-pointer"
                      >
                        <option value="Eyeglasses">Eyeglasses</option>
                        <option value="Sunglasses">Sunglasses</option>
                        <option value="Contact Lenses">Contact Lenses</option>
                        <option value="Lens Cleaner">Lens Cleaner</option>
                        <option value="Contact Lens Solution">Contact Lens Solution</option>
                        <option value="Kids">Kids</option>
                        <option value="Eyevengers Special">Eyevengers Special</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Brand Name</label>
                      <select 
                        value={newProduct.brand} 
                        onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 transition-all cursor-pointer"
                      >
                        <option value="">Select Brand</option>
                        {globalBrands.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Shape</label>
                      <select 
                        value={newProduct.shape} 
                        onChange={(e) => setNewProduct({...newProduct, shape: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 transition-all cursor-pointer"
                      >
                        <option value="">Select Shape</option>
                        {globalShapes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Target Gender</label>
                      <select 
                        value={newProduct.gender} 
                        onChange={(e) => setNewProduct({...newProduct, gender: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-medium text-gray-900 transition-all cursor-pointer"
                      >
                        <option value="Unisex">Unisex</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Pricing & Stock */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pricing & Inventory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                        <input 
                          required 
                          type="number" 
                          min="0"
                          step="any"
                          value={newProduct.price} 
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} 
                          className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-semibold text-gray-900 transition-all placeholder:text-gray-400" 
                          placeholder="999" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Discount (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={newProduct.discount} 
                          onChange={(e) => setNewProduct({...newProduct, discount: e.target.value})} 
                          className="w-full pr-8 pl-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-semibold text-gray-900 transition-all placeholder:text-gray-400" 
                          placeholder="0" 
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        min="0"
                        value={newProduct.stock} 
                        onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} 
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy text-sm font-semibold text-gray-900 transition-all placeholder:text-gray-400" 
                        placeholder="10" 
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Product Media */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Media</span>
                  </div>

                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200/80">
                    <ImageUpload 
                      label="Upload or paste image links (multiple supported)"
                      value={newProduct.imageUrl} 
                      onChange={(val) => setNewProduct({...newProduct, imageUrl: val})} 
                      multiple={true}
                    />
                  </div>
                </div>

              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 bg-gray-50/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 z-20 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSaving}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200/60 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-semibold bg-brand-navy hover:bg-blue-900 text-white rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {editingProductId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Attributes Modal */}
      {isAttrModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAttrModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Manage Store Attributes</h3>
                  <p className="text-xs text-gray-500">Configure global brands and frame shapes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAttrModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              {/* Tab Selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setEditingAttrKey('storeBrands')} 
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    editingAttrKey === 'storeBrands' ? 'bg-white shadow-xs text-brand-navy' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Brands ({globalBrands.length})
                </button>
                <button 
                  onClick={() => setEditingAttrKey('storeShapes')} 
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    editingAttrKey === 'storeShapes' ? 'bg-white shadow-xs text-brand-navy' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Shapes ({globalShapes.length})
                </button>
              </div>

              {/* Add Input */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={attrInputValue}
                  onChange={(e) => setAttrInputValue(e.target.value)}
                  placeholder={`Add new ${editingAttrKey === 'storeBrands' ? 'Brand' : 'Shape'}...`} 
                  className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && attrInputValue.trim()) {
                      const newList = editingAttrKey === 'storeBrands' ? [...globalBrands, attrInputValue.trim()] : [...globalShapes, attrInputValue.trim()];
                      if (editingAttrKey === 'storeBrands') setGlobalBrands(newList); else setGlobalShapes(newList);
                      fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingAttrKey]: JSON.stringify(newList) }) });
                      setAttrInputValue('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (!attrInputValue.trim()) return;
                    const newList = editingAttrKey === 'storeBrands' ? [...globalBrands, attrInputValue.trim()] : [...globalShapes, attrInputValue.trim()];
                    if (editingAttrKey === 'storeBrands') setGlobalBrands(newList); else setGlobalShapes(newList);
                    fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingAttrKey]: JSON.stringify(newList) }) });
                    setAttrInputValue('');
                  }}
                  className="px-4 py-2 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-blue-900 transition shadow-xs cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Attributes List */}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-64 pr-1">
                {(editingAttrKey === 'storeBrands' ? globalBrands : globalShapes).map((attr, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100/70 px-3.5 py-2.5 rounded-xl border border-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">{attr}</span>
                    <button 
                      onClick={() => {
                        const newList = (editingAttrKey === 'storeBrands' ? globalBrands : globalShapes).filter((_, i) => i !== idx);
                        if (editingAttrKey === 'storeBrands') setGlobalBrands(newList); else setGlobalShapes(newList);
                        fetchWithAuth(`https://eyevengers-web.onrender.com/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingAttrKey]: JSON.stringify(newList) }) });
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button 
                onClick={() => setIsAttrModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
