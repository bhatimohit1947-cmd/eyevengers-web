"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MoreVertical, X, Loader2 } from 'lucide-react';

export default function ProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
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
    fetch(`https://eyevengers-web.onrender.com/api/admin/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setIsLoading(false);
      });
      
    // Fetch Settings
    fetch(`https://eyevengers-web.onrender.com/api/admin/settings`)
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
    setNewProduct({ name: '', sku: '', category: 'Eyeglasses', brand: globalBrands[0] || '', shape: globalShapes[0] || '', gender: 'Unisex', price: '', discount: '', stock: '', imageUrl: '' });
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
      name: product.name,
      sku: realSku,
      category: product.category,
      brand: product.brand || '',
      shape: shapeVal,
      gender: product.gender || 'Unisex',
      price: product.price.toString(),
      discount: discountVal,
      stock: product.stock.toString(),
      imageUrl: product.image_url || product.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`https://eyevengers-web.onrender.com/api/admin/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProductId 
      ? `https://eyevengers-web.onrender.com/api/admin/products/${editingProductId}` 
      : `https://eyevengers-web.onrender.com/api/admin/products`;
    const method = editingProductId ? 'PUT' : 'POST';

    // Store discount and shape in SKU
    let payloadSku = newProduct.sku;
    if (newProduct.discount) payloadSku += `|DISCOUNT:${newProduct.discount}`;
    if (newProduct.shape) payloadSku += `|SHAPE:${newProduct.shape}`;
    
    const { discount, shape, ...restProduct } = newProduct;
    const payload = { ...restProduct, sku: payloadSku };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const savedProduct = await res.json();
        if (editingProductId) {
          setProducts(products.map(p => p.id === editingProductId ? savedProduct : p));
        } else {
          setProducts([...products, savedProduct]);
        }
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save product:", err);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Manage your inventory, prices, and product details.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAttrModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm whitespace-nowrap"
          >
            Manage Attributes
          </button>
          <button 
            onClick={openAddModal}
            className="bg-brand-navy text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-900 transition shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-brand-navy text-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
              <option>All Categories</option>
              <option>Eyeglasses</option>
              <option>Sunglasses</option>
              <option>Contact Lenses</option>
              <option>Lens Cleaner</option>
              <option>Contact Lens Solution</option>
              <option>Kids</option>
              <option>Eyevengers Special</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="animate-spin text-brand-navy" size={48} />
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-white text-gray-700 uppercase font-bold sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category & Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                          {product.image_url || product.imageUrl ? <img src={(product.image_url || product.imageUrl).split(',')[0].trim()} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-[8px] text-gray-400">IMG</span>}
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {product.sku && product.sku.includes('|DISCOUNT:') ? product.sku.split('|DISCOUNT:')[0] : product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{product.category}</div>
                      <div className="text-xs text-gray-400 font-medium">{product.brand || 'Generic'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.gender || 'Unisex'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <span className={product.stock > 10 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(product)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 rounded transition">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white">
          <div>Showing 1 to {products.length} of {products.length} products</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>

      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input required type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy" placeholder="e.g. Midnight Blue Frame" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (comma separated for multiple)</label>
                <textarea rows={2} value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy" placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input required type="text" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy" placeholder="e.g. E-10055" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy">
                    <option value="Eyeglasses">Eyeglasses</option>
                    <option value="Sunglasses">Sunglasses</option>
                    <option value="Contact Lenses">Contact Lenses</option>
                    <option value="Lens Cleaner">Lens Cleaner</option>
                    <option value="Contact Lens Solution">Contact Lens Solution</option>
                    <option value="Kids">Kids</option>
                    <option value="Eyevengers Special">Eyevengers Special</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <select value={newProduct.brand} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy">
                    <option value="">Select Brand</option>
                    {globalBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                  <select value={newProduct.shape} onChange={(e) => setNewProduct({...newProduct, shape: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy">
                    <option value="">Select Shape</option>
                    {globalShapes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={newProduct.gender} onChange={(e) => setNewProduct({...newProduct, gender: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy">
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input required type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy" placeholder="0" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                  <input type="number" value={newProduct.discount} onChange={(e) => setNewProduct({...newProduct, discount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy" placeholder="e.g. 50" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input required type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy" placeholder="0" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-blue-900 font-medium shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Attributes Modal */}
      {isAttrModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Manage Attributes</h3>
              <button onClick={() => setIsAttrModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="flex gap-2 border-b border-gray-200">
                <button 
                  onClick={() => setEditingAttrKey('storeBrands')} 
                  className={`pb-2 px-2 font-medium text-sm ${editingAttrKey === 'storeBrands' ? 'border-b-2 border-brand-navy text-brand-navy' : 'text-gray-500'}`}
                >
                  Brands
                </button>
                <button 
                  onClick={() => setEditingAttrKey('storeShapes')} 
                  className={`pb-2 px-2 font-medium text-sm ${editingAttrKey === 'storeShapes' ? 'border-b-2 border-brand-navy text-brand-navy' : 'text-gray-500'}`}
                >
                  Shapes
                </button>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={attrInputValue}
                  onChange={(e) => setAttrInputValue(e.target.value)}
                  placeholder={`Add new ${editingAttrKey === 'storeBrands' ? 'Brand' : 'Shape'}...`} 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && attrInputValue.trim()) {
                      const newList = editingAttrKey === 'storeBrands' ? [...globalBrands, attrInputValue.trim()] : [...globalShapes, attrInputValue.trim()];
                      if (editingAttrKey === 'storeBrands') setGlobalBrands(newList); else setGlobalShapes(newList);
                      fetch(`https://eyevengers-web.onrender.com/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingAttrKey]: JSON.stringify(newList) }) });
                      setAttrInputValue('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (!attrInputValue.trim()) return;
                    const newList = editingAttrKey === 'storeBrands' ? [...globalBrands, attrInputValue.trim()] : [...globalShapes, attrInputValue.trim()];
                    if (editingAttrKey === 'storeBrands') setGlobalBrands(newList); else setGlobalShapes(newList);
                    fetch(`https://eyevengers-web.onrender.com/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingAttrKey]: JSON.stringify(newList) }) });
                    setAttrInputValue('');
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mt-2">
                {(editingAttrKey === 'storeBrands' ? globalBrands : globalShapes).map((attr, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{attr}</span>
                    <button 
                      onClick={() => {
                        const newList = (editingAttrKey === 'storeBrands' ? globalBrands : globalShapes).filter((_, i) => i !== idx);
                        if (editingAttrKey === 'storeBrands') setGlobalBrands(newList); else setGlobalShapes(newList);
                        fetch(`https://eyevengers-web.onrender.com/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingAttrKey]: JSON.stringify(newList) }) });
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
