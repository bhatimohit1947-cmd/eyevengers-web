"use client";

import React, { useState, useEffect } from 'react';
import { Star, Heart, Share2, Ruler, ShieldCheck, ChevronRight, Camera, Glasses, ArrowLeft, CheckCircle2, Info, Loader2, AlertCircle, Tag, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { ARTryOn } from '@/components/ui/ARTryOn';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAddressStore } from '@/store/useAddressStore';
import AddressManager from '@/components/checkout/AddressManager';
import { getEffectivePrice, ACTIVE_OFFERS, UserContext } from '@/utils/pricing';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  
  const { hasItem, toggleItem } = useWishlistStore();
  const isWishlisted = hasItem(id as string);
  
  const { user, membershipTier, membershipBenefits } = useAuthStore();
  
  // Lens Settings from Admin
  const [lensSettings, setLensSettings] = useState<any>(null);
  
  // Checkout Flow State
  const [flowStep, setFlowStep] = useState<'initial' | 'lens_category' | 'lens_product' | 'power_input' | 'address_selection' | 'checkout' | 'success'>('initial');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isFrameOnly, setIsFrameOnly] = useState(false);
  
  // Selections
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedLensProduct, setSelectedLensProduct] = useState<any>(null);
  
  // Eye Power Data
  const [powerData, setPowerData] = useState({
    reSph: '', reCyl: '', reAxis: '', reAdd: '', rePd: '',
    leSph: '', leCyl: '', leAxis: '', leAdd: '', lePd: ''
  });
  
  const [highPowerSurchargeApplied, setHighPowerSurchargeApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod'|'prepaid'>('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Voucher & Rewards State
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
    title: string;
    benefitType?: string;
  } | null>(null);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [showVouchersList, setShowVouchersList] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'none' | 'success' | 'error'; text: string }>({ type: 'none', text: '' });

  const [globalSettings, setGlobalSettings] = useState<any>({});

  useEffect(() => {
    Promise.all([
      fetch(`https://eyevengers-web.onrender.com/api/admin/lenses/settings?t=${Date.now()}`).then(r => r.json()),
      fetch(`https://eyevengers-web.onrender.com/api/admin/settings?t=${Date.now()}`).then(r => r.json())
    ])
      .then(([lensData, globalData]) => {
        setLensSettings(lensData);
        setGlobalSettings(globalData || {});
      })
      .catch(err => console.error(err));
  }, []);

  const [product, setProduct] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('https://eyevengers-web.onrender.com/api/admin/products').then(res => res.json()),
      fetch('https://eyevengers-web.onrender.com/api/offers').then(res => res.json())
    ])
      .then(([data, offersData]) => {
        // Update global offers for pricing utility
        if (Array.isArray(offersData)) {
          ACTIVE_OFFERS.length = 0;
          ACTIVE_OFFERS.push(...offersData);
        }
        const found = data.find((p: any) => p.id === id);
        if (found) {
          const rawImages = found.image_url || found.imageUrl || '';
          const imagesArr = rawImages ? rawImages.split(',').map((u: string) => u.trim()) : [];
          const hasDiscount = found.sku && found.sku.includes('|DISCOUNT:');
          const oldDiscountPercent = hasDiscount ? Number(found.sku.split('|DISCOUNT:')[1]) : 0;
          const mrp = oldDiscountPercent > 0 ? Math.round(found.price / (1 - (oldDiscountPercent / 100))) : found.price;
          // Store the TRUE base price. Stacking and offers are evaluated dynamically at render.
          
          setProduct({
            id: found.id,
            name: found.name,
            brand: found.brand || 'Generic',
            mrp: mrp,
            sellingPrice: found.price,
            discountPercent: oldDiscountPercent,
            rating: 4.5,
            reviewsCount: 128,
            images: imagesArr.length > 0 ? imagesArr : ["", "", "", ""],
            size: "Medium",
            color: "Standard",
            shape: found.category || "Standard",
            imageUrl: imagesArr[0] || '',
            stock: found.stock
          });
        }
        setIsLoadingProduct(false);
      })
      .catch(err => {
        console.error("Failed to load product", err);
        setIsLoadingProduct(false);
      });
  }, [id]);

  const selectedCategory = lensSettings?.categories?.find((c: any) => c.id === selectedCategoryId);
  const availableProductsForCategory = lensSettings?.products?.filter((p: any) => p.categoryId === selectedCategoryId) || [];

  const userContext: UserContext = {
    tier: membershipTier || 'none',
    membershipBenefits
  };

  const dynamicPrice = product ? getEffectivePrice({
    mrp: product.mrp,
    sellingPrice: product.sellingPrice,
    categoryId: product.shape,
    brandId: product.brand
  }, userContext) : null;

  const currentDisplayPrice = dynamicPrice ? dynamicPrice.discountedPrice : product?.sellingPrice;
  const currentDiscountPercent = dynamicPrice && product ? Math.round(((product.mrp - dynamicPrice.discountedPrice) / product.mrp) * 100) : product?.discountPercent;

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedLensProduct(null);
    setFlowStep('lens_product');
  };

  const handleProductSelect = () => {
    if (!selectedCategory) return;
    if (selectedCategory.hasPowerInput) {
      setFlowStep('power_input');
    } else {
      setHighPowerSurchargeApplied(false);
      setFlowStep('address_selection');
    }
  };

  const handlePowerSubmit = () => {
    if (!selectedCategory) return;
    
    // Check if power exceeds category-specific limits
    const limit = selectedCategory.normalLimit;
    const isHighPower = [powerData.reSph, powerData.reCyl, powerData.leSph, powerData.leCyl].some(val => {
      const num = Math.abs(parseFloat(val || '0'));
      return num > limit;
    });

    setHighPowerSurchargeApplied(isHighPower);
    setFlowStep('address_selection');
  };

  const getLensTotal = () => {
    let total = 0;
    if (!isFrameOnly && selectedLensProduct && selectedCategory) {
      total += selectedLensProduct.basePrice;
      if (highPowerSurchargeApplied) {
        total += selectedCategory.highPowerSurcharge;
      }
    }
    return total;
  };

  const getLensDiscountAmount = () => {
    if (globalSettings?.enableLensMembershipDiscount !== true) return 0;
    const lensTotal = getLensTotal();
    const discountPercent = membershipBenefits?.discountPercent || 0;
    return Math.round(lensTotal * (discountPercent / 100));
  };

  const getBaseTotal = () => {
    let total = dynamicPrice ? dynamicPrice.discountedPrice : (product?.sellingPrice || 0);
    total += getLensTotal();
    return total;
  };

  // Fetch active vouchers for logged in customer (Refer & Earn, Spin & Win, Mystery Box)
  useEffect(() => {
    if (user?.phone) {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '').slice(-10);
      fetch(`/api/referral?action=user-info&phone=${cleanPhone}&name=${encodeURIComponent(user.name || '')}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.vouchers)) {
            const activeVouchers = d.vouchers.filter((v: any) => v.status === 'ACTIVE');
            setUserVouchers(activeVouchers);
          }
        })
        .catch(() => {});
    }
  }, [user?.phone, user?.name]);

  const handleApplyVoucher = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    const cleanCode = codeToApply.trim().toUpperCase();
    setVoucherLoading(true);
    setVoucherMessage({ type: 'none', text: '' });

    const baseAmount = getBaseTotal() - getLensDiscountAmount();

    try {
      // 1. Validate with /api/referral (Referral rewards, Games rewards, Welcome gift)
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-voucher', code: cleanCode })
      });
      const data = await res.json();
      if (res.ok && data.valid && data.voucher) {
        let discountVal = 0;
        const bType = data.voucher.benefitType;
        const bVal = Number(data.voucher.benefitValue || 0);

        if (bType === 'FREE_FRAME') {
          const framePrice = dynamicPrice ? dynamicPrice.discountedPrice : (product?.sellingPrice || 0);
          discountVal = Math.min(baseAmount, framePrice);
        } else if (bType === 'PERCENT_DISCOUNT') {
          discountVal = Math.round(baseAmount * ((bVal || 30) / 100));
        } else {
          // FLAT_DISCOUNT
          discountVal = Math.min(baseAmount, bVal || 150);
        }

        const voucherObj = {
          code: cleanCode,
          discount: discountVal,
          title: data.voucher.benefitTitle || `${cleanCode} Applied`,
          benefitType: bType
        };
        setAppliedVoucher(voucherObj);
        setVoucherMessage({ type: 'success', text: `🎉 ${voucherObj.title} applied! Saved ₹${discountVal}` });
        setVoucherInput('');
        setVoucherLoading(false);
        return;
      } else if (data.error && (data.error.includes('Already used') || data.error.includes('expired'))) {
        setVoucherMessage({ type: 'error', text: data.error });
        setVoucherLoading(false);
        return;
      }
    } catch(e) {}

    // 2. Fallback to sitewide promotional offers
    try {
      const offerRes = await fetch('https://eyevengers-web.onrender.com/api/offers/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: cleanCode, 
          cartItems: [{ price: product?.sellingPrice || 0, qty: 1 }], 
          user: { id: user?.id || 'guest', orderCount: 0 } 
        })
      });
      const offerData = await offerRes.json();
      if (offerData.valid) {
        let discountVal = 0;
        if (offerData.offer.discountType === 'percentage') {
          discountVal = Math.round(baseAmount * (offerData.offer.discountValue / 100));
        } else {
          discountVal = Math.min(baseAmount, offerData.offer.discountValue);
        }
        const voucherObj = {
          code: cleanCode,
          discount: discountVal,
          title: `${cleanCode} Applied`,
          benefitType: 'OFFER_COUPON'
        };
        setAppliedVoucher(voucherObj);
        setVoucherMessage({ type: 'success', text: `🎉 ${cleanCode} applied! Saved ₹${discountVal}` });
        setVoucherInput('');
      } else {
        setVoucherMessage({ type: 'error', text: offerData.error || 'Invalid or expired voucher code' });
      }
    } catch(e) {
      setVoucherMessage({ type: 'error', text: 'Failed to apply voucher code' });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherMessage({ type: 'none', text: '' });
  };

  const calculateTotal = () => {
    let frameTotal = dynamicPrice ? dynamicPrice.discountedPrice : (product?.sellingPrice || 0);
    let lensTotal = getLensTotal();
    let lensDiscount = getLensDiscountAmount();
    
    let total = frameTotal + lensTotal - lensDiscount;
    const hasFreeShipping = membershipBenefits?.freeShipping === true;
    const shippingCharge = hasFreeShipping ? 0 : 50;
    const voucherDiscount = appliedVoucher?.discount || 0;
    return Math.max(0, total + shippingCharge - voucherDiscount);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }
    
    setIsPlacingOrder(true);
    
    const { getUserAddresses } = useAddressStore.getState();
    const selectedAddress = getUserAddresses().find(a => a.id === selectedAddressId);
    
    const amount = calculateTotal();
    const orderDetails = {
      frame: product.name,
      imageUrl: product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : ''),
      lensCategory: selectedCategory?.name,
      lensProduct: selectedLensProduct?.name,
      power: !isFrameOnly ? powerData : null,
      customerName: user?.name || 'Guest Customer',
      userPhone: user?.phone || 'N/A',
      address: selectedAddress,
      productId: product.id,
      mrp: product.mrp,
      categoryId: product.shape,
      brandId: product.brand,
      couponApplied: appliedVoucher?.code,
      couponDiscount: appliedVoucher?.discount || 0,
      benefitTitle: appliedVoucher?.title
    };

    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Claim voucher online if applied
      if (appliedVoucher?.code) {
        fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'claim-online',
            code: appliedVoucher.code,
            orderId: orderId,
            channel: 'ONLINE'
          })
        }).catch(console.error);
      }
      const orderPayload = {
        id: orderId,
        amount,
        paymentMethod,
        orderDetails,
        status: 'Order Placed',
        createdAt: new Date().toISOString(),
        items: [{
          title: product.name,
          price: amount,
          qty: 1,
          imageUrl: orderDetails.imageUrl
        }]
      };

      // 1. Save to localStorage for instant Orders retrieval
      try {
        const storedOrders = JSON.parse(localStorage.getItem('eyevengers_mock_orders') || '[]');
        storedOrders.unshift(orderPayload);
        localStorage.setItem('eyevengers_mock_orders', JSON.stringify(storedOrders));
      } catch (e) {}

      // 2. Post to Next.js API for local persistence
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }).catch(console.error);

      if (paymentMethod === 'cod') {
        // Send to Render in background with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          await fetch(`https://eyevengers-web.onrender.com/api/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, paymentMethod, orderDetails }),
            signal: controller.signal
          });
        } catch (e) {
          console.warn('Backend call warning:', e);
        } finally {
          clearTimeout(timeoutId);
        }

        setIsPlacingOrder(false);
        setFlowStep('success');
        return;
      }

      // Prepaid payment flow
      const res = await fetch(`https://eyevengers-web.onrender.com/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod, orderDetails })
      });
      const data = await res.json();

      if (!data.success) {
        alert('Failed to initialize payment.');
        setIsPlacingOrder(false);
        return;
      }

      if (paymentMethod === 'prepaid') {
        // Initialize Razorpay
        const options = {
          key: 'rzp_test_T34XmzvqjTeeXs', // Public Key
          amount: data.razorpayOrder.amount,
          currency: 'INR',
          name: 'Eyevengers',
          description: 'Payment for your order',
          order_id: data.razorpayOrder.id,
          handler: async function (response: any) {
            // Verify Signature
            const verifyRes = await fetch(`https://eyevengers-web.onrender.com/api/orders/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setFlowStep('success');
            } else {
              alert('Payment Verification Failed!');
            }
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com',
            contact: '9999999999'
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [{ method: "upi" }]
                },
                card: {
                  name: "Pay via Card",
                  instruments: [{ method: "card" }]
                },
                netbanking: {
                  name: "Netbanking",
                  instruments: [{ method: "netbanking" }]
                },
                wallet: {
                  name: "Wallets",
                  instruments: [{ method: "wallet" }]
                }
              },
              sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
              preferences: {
                show_default_blocks: true,
              }
            }
          },
          theme: {
            color: '#0B1550' // brand-navy
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any){
          alert('Payment failed! Reason: ' + response.error.description);
        });
        rzp.open();
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while placing order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Eyevengers',
      text: `Check out this amazing ${product?.name} at Eyevengers!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const renderPowerInput = (eye: 're' | 'le', label: string) => {
    if (!selectedCategory) return null;
    return (
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 mb-3">{label}</h3>
        <div className="grid grid-cols-2 gap-3">
          {selectedCategory.powerFields.includes('SPH') && (
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">SPH</label>
              <input type="number" step="0.25" placeholder="0.00" value={powerData[`${eye}Sph` as keyof typeof powerData]} onChange={e=>setPowerData({...powerData, [`${eye}Sph`]: e.target.value})} className="w-full border border-gray-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-brand-navy outline-none" />
            </div>
          )}
          {selectedCategory.powerFields.includes('CYL') && (
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">CYL</label>
              <input type="number" step="0.25" placeholder="0.00" value={powerData[`${eye}Cyl` as keyof typeof powerData]} onChange={e=>setPowerData({...powerData, [`${eye}Cyl`]: e.target.value})} className="w-full border border-gray-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-brand-navy outline-none" />
            </div>
          )}
          {selectedCategory.powerFields.includes('AXIS') && (
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">AXIS</label>
              <input type="number" placeholder="0 - 180" value={powerData[`${eye}Axis` as keyof typeof powerData]} onChange={e=>setPowerData({...powerData, [`${eye}Axis`]: e.target.value})} className="w-full border border-gray-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-brand-navy outline-none" />
            </div>
          )}
          {selectedCategory.powerFields.includes('ADD') && (
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">ADD</label>
              <input type="number" step="0.25" placeholder="+1.00" value={powerData[`${eye}Add` as keyof typeof powerData]} onChange={e=>setPowerData({...powerData, [`${eye}Add`]: e.target.value})} className="w-full border border-gray-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-brand-navy outline-none" />
            </div>
          )}
          {selectedCategory.powerFields.includes('PD') && (
            <div>
              <label className="text-[10px] text-gray-500 font-bold block mb-1">PD</label>
              <input type="number" placeholder="62" value={powerData[`${eye}Pd` as keyof typeof powerData]} onChange={e=>setPowerData({...powerData, [`${eye}Pd`]: e.target.value})} className="w-full border border-gray-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-brand-navy outline-none" />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoadingProduct) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-navy mb-4" size={48} /><p className="text-gray-500 font-medium">Loading product details...</p></div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-xl font-bold text-gray-500">Product not found</p></div>;
  }

  return (
    <div className="bg-white min-h-screen pb-32 md:pb-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-2 px-4 text-xs text-gray-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span>Home</span> <ChevronRight size={12} />
          <span>Eyeglasses</span> <ChevronRight size={12} />
          <span>Vincent Chase</span> <ChevronRight size={12} />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto md:px-4 py-4 md:py-8 flex flex-col md:flex-row gap-8 md:items-start">
        
        {/* Left: Image Gallery */}
        <div className="w-full md:w-3/5 flex flex-col-reverse md:flex-row gap-4 md:sticky md:top-6">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 px-4 md:px-0 overflow-x-auto no-scrollbar snap-x py-2 md:py-0 w-full md:w-24">
            {product.images.map((img: string, i: number) => (
              <div 
                key={i} 
                onClick={() => setActiveImage(i)}
                className={`w-20 h-20 md:w-full md:h-24 flex-shrink-0 bg-white rounded-xl border-2 cursor-pointer flex items-center justify-center snap-center overflow-hidden transition-all ${activeImage === i ? 'border-brand-navy shadow-md ring-2 ring-brand-navy/20' : 'border-gray-200 hover:border-brand-navy/50 opacity-70 hover:opacity-100'}`}
              >
                 {img ? (
                   img.match(/\.(mp4|webm|ogg)$/i) ? (
                     <video src={img} className="w-full h-full object-cover mix-blend-multiply hover:scale-110 transition-transform duration-300" autoPlay loop muted playsInline />
                   ) : (
                     <div className="relative w-full h-full"><OptimizedImage src={img} alt={`View ${i+1}`} fill sizes="96px" className="object-cover mix-blend-multiply hover:scale-110 transition-transform duration-300" /></div>
                   )
                 ) : (
                   <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 )}
              </div>
            ))}
          </div>

          {/* Main Image */}
          <div className="flex-1 bg-white relative aspect-square md:aspect-[4/3] w-full md:rounded-2xl border-b md:border border-gray-100 overflow-hidden flex items-center justify-center group">
            
            {/* Buttons inside the main image */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 opacity-100 transition-opacity">
              <button onClick={() => toggleItem(id as string)} className="w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-red-500 hover:bg-white transition-all transform hover:scale-105 border border-gray-100">
                <Heart size={22} className={isWishlisted ? "fill-red-500 text-red-500 scale-110" : "transition-transform"} />
              </button>
              <button onClick={handleShare} className="w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-gray-600 hover:text-brand-navy hover:bg-white transition-all transform hover:scale-105 border border-gray-100">
                <Share2 size={22} />
              </button>
            </div>
            
            {product.images[activeImage] ? (
              product.images[activeImage].match(/\.(mp4|webm|ogg)$/i) ? (
                <video src={product.images[activeImage]} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" autoPlay loop muted playsInline />
              ) : (
                <OptimizedImage src={product.images[activeImage]} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 600px" className="object-cover transition-transform duration-700 hover:scale-105" />
              )
            ) : (
              <svg className="w-32 h-32 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )}
          </div>
        </div>

        {/* Right: Product Details & Buying Options */}
        <div className="w-full md:w-2/5 px-4 md:px-0 flex flex-col">
          
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{product.brand}</h2>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex items-center gap-1 mb-4">
              <div className="flex items-center bg-[#f5f8ff] text-brand-navy rounded-full px-2 py-1 text-xs font-bold border border-[#e0e8ff]">
                <span>{product.size}</span>
                <span className="mx-1.5 opacity-30">|</span>
                <span className="flex items-center gap-1"><Ruler size={12}/> Size Guide</span>
              </div>
              <div className="flex items-center bg-green-50 text-green-700 rounded-full px-2 py-1 text-xs font-bold border border-green-100">
                <Star size={10} className="fill-current mr-1" />
                <span>{product.rating}</span>
                <span className="ml-1 opacity-50">({product.reviewsCount})</span>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-2xl font-bold text-gray-900">₹{currentDisplayPrice}</span>
              <span className="text-sm text-gray-400 line-through mb-1">₹{product.mrp}</span>
              <span className="text-sm font-bold text-green-600 mb-1">({currentDiscountPercent}% OFF)</span>
            </div>
            
            {dynamicPrice?.reason && dynamicPrice.reason !== 'Standard Price' && (
              <div className="text-xs font-medium text-brand-gold bg-yellow-50 w-fit px-2 py-1 rounded mt-2 mb-2 border border-yellow-100">
                {dynamicPrice.reason}
              </div>
            )}
            
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <div className="mt-2 text-sm font-bold text-red-500 flex items-center gap-1 bg-red-50 w-fit px-3 py-1 rounded-full border border-red-100">
                <AlertCircle size={14} /> Only {product.stock} pieces left in stock!
              </div>
            )}
            
            {product.stock === 0 && (
              <div className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1 bg-red-50 w-fit px-3 py-1 rounded-full border border-red-100">
                <AlertCircle size={14} /> Out of Stock
              </div>
            )}
          </div>

          {/* DYNAMIC CHECKOUT FLOW */}
          <div className="relative">
            {flowStep !== 'initial' && flowStep !== 'success' && (
              <button onClick={() => {
                if (flowStep === 'lens_product') setFlowStep('lens_category');
                else if (flowStep === 'power_input') setFlowStep('lens_product');
                else if (flowStep === 'address_selection' && !isFrameOnly) setFlowStep(selectedCategory?.hasPowerInput ? 'power_input' : 'lens_product');
                else if (flowStep === 'checkout') setFlowStep('address_selection');
                else setFlowStep('initial');
              }} className="flex items-center text-sm font-bold text-brand-navy mb-4 hover:underline">
                <ArrowLeft size={16} className="mr-1" /> Back
              </button>
            )}

            {/* STEP 1: INITIAL */}
            {flowStep === 'initial' && (
              <div className="space-y-4">
                <button onClick={() => { setIsFrameOnly(false); setFlowStep('lens_category'); }} className="w-full bg-brand-navy text-white font-bold text-base rounded-full py-4 shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition flex items-center justify-center gap-2"><Glasses size={18} /> BUY WITH LENSES</button>
                <button onClick={() => { setIsFrameOnly(true); setFlowStep('address_selection'); }} className="w-full bg-white border-2 border-gray-200 text-gray-800 font-bold text-base rounded-full py-4 hover:border-brand-navy hover:text-brand-navy transition flex items-center justify-center gap-2">BUY FRAME ONLY</button>
                <button onClick={() => setIsARModalOpen(true)} className="w-full bg-blue-50 text-blue-700 font-bold py-3 rounded-full hover:bg-blue-100 transition flex items-center justify-center gap-2"><Camera size={18} /> TRY IN 3D</button>
              </div>
            )}

            {/* STEP 2: SELECT LENS CATEGORY */}
            {flowStep === 'lens_category' && lensSettings && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-gray-900 mb-2">Step 1: Select Vision Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {lensSettings.categories.map((cat: any) => (
                    <button 
                      key={cat.id} 
                      onClick={() => handleCategorySelect(cat.id)}
                      className="border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-brand-navy hover:bg-blue-50 transition"
                    >
                      <Glasses className="w-8 h-8 mb-2 text-gray-400" />
                      <span className="font-bold text-gray-900 text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT LENS PRODUCT */}
            {flowStep === 'lens_product' && selectedCategory && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-bold text-gray-900 mb-2">Step 2: Select {selectedCategory.name} Lenses</h3>
                
                {availableProductsForCategory.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm text-gray-500">
                    No products found for this category.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableProductsForCategory.map((lens: any) => (
                      <label key={lens.id} className={`block border-2 rounded-xl p-4 cursor-pointer transition ${selectedLensProduct?.id === lens.id ? 'border-brand-navy bg-[#f5f8ff]' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="lens_product" className="w-4 h-4 text-brand-navy focus:ring-brand-navy" checked={selectedLensProduct?.id === lens.id} onChange={() => setSelectedLensProduct(lens)} />
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">{lens.name}</div>
                            <ul className="text-[10px] text-gray-500 mt-1 list-disc list-inside">
                              {lens.features.map((f:string, i:number)=><li key={i}>{f}</li>)}
                            </ul>
                          </div>
                          <div className="text-sm font-bold text-gray-900">{lens.basePrice > 0 ? `+ ₹${lens.basePrice}` : 'Free'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <button disabled={!selectedLensProduct} onClick={handleProductSelect} className="w-full bg-brand-navy text-white font-bold py-3.5 rounded-xl disabled:opacity-50 transition">
                  {selectedCategory.hasPowerInput ? 'Continue to Eye Power' : 'Proceed to Checkout'}
                </button>
              </div>
            )}

            {/* STEP 4: EYE POWER INPUT */}
            {flowStep === 'power_input' && selectedCategory && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-blue-50 rounded-xl p-4 flex gap-3 border border-blue-100">
                  <Info className="text-blue-600 shrink-0 w-5 h-5" />
                  <p className="text-xs text-blue-800">
                    <strong>{selectedCategory.name} limits:</strong> Powers exceeding ±{selectedCategory.normalLimit} will incur an extra charge of ₹{selectedCategory.highPowerSurcharge}.
                  </p>
                </div>
                
                {renderPowerInput('re', 'Right Eye (OD)')}
                {renderPowerInput('le', 'Left Eye (OS)')}

                <button onClick={handlePowerSubmit} className="w-full bg-brand-navy text-white font-bold py-3.5 rounded-xl transition shadow-md">
                  Continue to Delivery Address
                </button>
              </div>
            )}

            {/* STEP 4.5: ADDRESS SELECTION */}
            {flowStep === 'address_selection' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <AddressManager 
                  selectedAddressId={selectedAddressId} 
                  setSelectedAddressId={setSelectedAddressId} 
                />
                <button 
                  onClick={() => {
                    if (!selectedAddressId) {
                      alert("Please select a delivery address.");
                      return;
                    }
                    if (!user) {
                       useAuthStore.getState().openLoginModal();
                       return;
                    }
                    setFlowStep('checkout');
                  }} 
                  className="w-full bg-brand-navy text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  Proceed to Payment
                </button>
              </div>
            )}

            {/* STEP 5: CHECKOUT */}
            {flowStep === 'checkout' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Order Summary</h3>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-600">Frame: {product.name}</span>
                    <span className="font-bold">₹{dynamicPrice?.originalPrice || product.mrp}</span>
                  </div>
                  
                  {dynamicPrice && (dynamicPrice.originalPrice - dynamicPrice.discountedPrice > 0) && (
                    <div className="flex justify-between text-sm mb-3 text-brand-gold font-medium">
                      <span>Frame Discount ({dynamicPrice.appliedOfferName || 'Membership'})</span>
                      <span>-₹{(dynamicPrice.originalPrice - dynamicPrice.discountedPrice).toFixed(0)}</span>
                    </div>
                  )}
                  {!isFrameOnly && selectedLensProduct && (
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600">Lenses: {selectedLensProduct.name}</span>
                      <span className="font-bold">₹{selectedLensProduct.basePrice}</span>
                    </div>
                  )}
                  {!isFrameOnly && highPowerSurchargeApplied && selectedCategory && (
                    <div className="flex justify-between text-sm mb-3 text-red-600 bg-red-50 p-2 rounded">
                      <span className="font-bold">High Power Surcharge</span>
                      <span className="font-bold">₹{selectedCategory.highPowerSurcharge}</span>
                    </div>
                  )}
                  
                  {getLensDiscountAmount() > 0 && (
                    <div className="flex justify-between text-sm mb-3 text-brand-gold font-medium">
                      <span>Lens Member Discount ({membershipBenefits?.discountPercent}%)</span>
                      <span>-₹{getLensDiscountAmount().toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm mb-3 text-gray-600">
                    <span>Shipping Charges</span>
                    {membershipBenefits?.freeShipping ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-xs text-gray-400">₹50</span>
                        <span className="text-green-600 font-bold">FREE</span>
                      </div>
                    ) : (
                      <span>₹50</span>
                    )}
                  </div>

                  {appliedVoucher && appliedVoucher.discount > 0 && (
                    <div className="flex justify-between text-sm mb-3 text-emerald-600 font-bold">
                      <span>Voucher Discount ({appliedVoucher.title || appliedVoucher.code})</span>
                      <span>-₹{appliedVoucher.discount.toFixed(0)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-base font-black text-gray-900 mt-4 pt-4 border-t border-gray-200">
                    <span>Total Amount</span>
                    <span>₹{calculateTotal().toFixed(0)}</span>
                  </div>
                </div>

                {/* Discounts, Referrals & Games Vouchers Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-blue-50 text-brand-navy">
                        <Tag size={14} />
                      </span>
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Coupons & Rewards</h4>
                    </div>
                    {userVouchers.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {userVouchers.length} Rewards Unlocked
                      </span>
                    )}
                  </div>

                  {/* If voucher is applied: Show sleek applied badge */}
                  {appliedVoucher && appliedVoucher.discount > 0 ? (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-gray-900 truncate">
                              {appliedVoucher.code}
                            </span>
                            <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full shrink-0">
                              Applied ✓
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 font-semibold truncate mt-0.5">
                            {appliedVoucher.title} (-₹{appliedVoucher.discount.toFixed(0)})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveVoucher}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                          <input
                            type="text"
                            value={voucherInput}
                            onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                            placeholder="Enter coupon or reward code"
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl uppercase font-mono text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy transition"
                          />
                        </div>
                        <button
                          onClick={() => handleApplyVoucher(voucherInput)}
                          disabled={voucherLoading || !voucherInput.trim()}
                          className="bg-brand-navy hover:bg-[#002b4d] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition shrink-0 disabled:opacity-50"
                        >
                          {voucherLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {voucherMessage.type === 'error' && (
                        <p className="text-red-600 text-xs font-semibold mt-1.5">{voucherMessage.text}</p>
                      )}
                      {voucherMessage.type === 'success' && (
                        <p className="text-emerald-700 text-xs font-semibold mt-1.5">{voucherMessage.text}</p>
                      )}
                    </div>
                  )}

                  {/* Available customer rewards (Refer & Earn, Spin & Win, Mystery Box) */}
                  {userVouchers.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                      <button
                        onClick={() => setShowVouchersList(!showVouchersList)}
                        className="w-full flex items-center justify-between text-xs font-bold text-brand-navy hover:text-blue-900 transition py-0.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-amber-500" />
                          <span>Your available rewards & game vouchers ({userVouchers.length})</span>
                        </span>
                        {showVouchersList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {(showVouchersList || !appliedVoucher) && (
                        <div className="space-y-2 mt-2 max-h-44 overflow-y-auto pr-1">
                          {userVouchers.map((v) => {
                            const isCurrent = appliedVoucher?.code?.toUpperCase() === v.code?.toUpperCase();
                            const isGame = v.source === 'game' || (v.referrerName && (v.referrerName.includes('Wheel') || v.referrerName.includes('Mystery Box')));
                            const isWelcome = v.source === 'welcome' || v.code?.startsWith('REF-WELCOME');
                            const originLabel = isGame ? '🎡 Spin & Win' : isWelcome ? '🎉 Welcome' : '👥 Refer';

                            return (
                              <div
                                key={v.code}
                                className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition text-xs ${
                                  isCurrent ? 'bg-emerald-50/70 border-emerald-300' : 'bg-gray-50/80 border-gray-200 hover:bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-gray-900 text-[11px]">{v.code}</span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100/80 text-blue-900">
                                      {originLabel}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-600 truncate mt-0.5 font-medium">{v.benefitTitle}</div>
                                </div>
                                {isCurrent ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                                    Applied ✓
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleApplyVoucher(v.code)}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition shrink-0 shadow-xs"
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Select Payment Method</h3>
                  <div className="space-y-2">
                    <label className={`block border rounded-xl p-3 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-brand-navy bg-[#f5f8ff]' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-brand-navy" />
                        <span className="font-bold text-sm text-gray-900">Cash on Delivery / Pay at Store</span>
                      </div>
                    </label>
                    {globalSettings.enableOnlinePrepaid !== false && (
                      <label className={`block border rounded-xl p-3 cursor-pointer transition ${paymentMethod === 'prepaid' ? 'border-brand-navy bg-[#f5f8ff]' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={paymentMethod === 'prepaid'} onChange={() => setPaymentMethod('prepaid')} className="text-brand-navy" />
                          <span className="font-bold text-sm text-gray-900">Pay Online (UPI, Cards)</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder} 
                  disabled={isPlacingOrder}
                  className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#002b4d] transition-colors text-lg flex items-center justify-center disabled:opacity-70 mt-4"
                >
                  {isPlacingOrder ? <Loader2 className="animate-spin mr-2" /> : null}
                  Place Order • ₹{calculateTotal().toFixed(0)}
                </button>
              </div>
            )}

            {/* STEP 6: SUCCESS */}
            {flowStep === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in zoom-in-95 mt-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed!</h2>
                <p className="text-gray-600 text-sm mb-6">Your glasses are being prepared. We will notify you once dispatched.</p>
                <button onClick={() => setFlowStep('initial')} className="text-brand-navy font-bold hover:underline">
                  Continue Shopping
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      <ARTryOn isOpen={isARModalOpen} onClose={() => setIsARModalOpen(false)} productName="Midnight Blue Square Frame" />
    </div>
  );
}
