import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { supabase } from '../lib/supabaseClient';

const OrderForm = () => {
  const [cartItems, setCartItems] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isPickup, setIsPickup] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setName(profile.full_name || '');
          setPhone(profile.phone_number || '');
        }
        if(error) console.log('error', error)

      }
    };

    fetchUserData();

    const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
    const normalizedCart = guestCart.map(item => {
      if (item.products === undefined) {
        const productData = { ...item };
        delete productData.quantity;
        return {
          id: item.id,
          product_id: item.id,
          quantity: item.quantity,
          products: productData
        };
      }
      return item;
    });
    setCartItems(normalizedCart);
  }, []);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = (item.products && item.products.price) ? item.products.price : 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleRemoveItem = (index) => {
    setCartItems(prev => {
      const next = [...prev];
      next.splice(index, 1);
      localStorage.setItem('guestCart', JSON.stringify(next));
      return next;
    });
  };

  const handleOrder = async () => {
    const totalAmount = calculateTotal();
    const shops = cartItems.reduce((acc, item) => {
      const shopId = item.products?.shop_id || item.products?.vendor_id;
      if (!shopId) {
        alert('Produk belum terhubung ke toko. Silakan pilih produk dari toko yang valid.');
        return acc;
      }
      if (!acc[shopId]) {
        acc[shopId] = [];
      }
      acc[shopId].push(item);
      return acc;
    }, {});

    for (const shopId in shops) {
      const shopItems = shops[shopId];
      const shopTotal = shopItems.reduce((total, item) => {
        const price = (item.products && item.products.price) ? item.products.price : 0;
        return total + price * item.quantity;
      }, 0);

      let orderPayload;
      if (user) {
        orderPayload = {
          user_id: user.id,
          shop_id: shopId,
          total_amount: shopTotal,
          status: 'pending_payment',
          is_pickup: isPickup,
          shipping_address: isPickup ? null : address,
        };
      } else {
        orderPayload = {
          shop_id: shopId,
          guest_name: name,
          guest_phone: phone,
          shipping_address: isPickup ? null : address,
          total_amount: shopTotal,
          status: 'pending_payment',
          is_pickup: isPickup,
        };
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        alert('Gagal membuat pesanan. Silakan coba lagi.');
        return;
      }

      const orderItems = shopItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        price_per_item: item.products.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        alert('Gagal menyimpan item pesanan. Silakan coba lagi.');
        return;
      }

      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: name, phone_number: phone })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      let whatsappUrl = null;
      const { data: vendor } = await supabase
        .from('vendors')
        .select('name, whatsapp_number')
        .eq('id', shopId)
        .maybeSingle();

      if (vendor && vendor.whatsapp_number) {
        const rawPhone = vendor.whatsapp_number.toString();
        const phoneDigits = rawPhone.replace(/[^0-9]/g, '');
        const formattedTotal = new Intl.NumberFormat('id-ID').format(shopTotal);
        const lines = [
          `Halo ${vendor.name || 'Seller'},`,
          '',
          `Saya baru membuat pesanan di platform.`,
          `ID Pesanan: ${orderData.id}`,
          `Total: Rp${formattedTotal}`,
        ];
        const message = encodeURIComponent(lines.join('\n'));
        whatsappUrl = `https://wa.me/${phoneDigits}?text=${message}`;
      }

      localStorage.removeItem('guestCart');
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
      navigate('/MyAccountOrder');
    }
  };

  return (
    <div className="container my-5">
      <h2>Form Pemesanan</h2>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Item Pesanan</h5>
          <ul className="list-group list-group-flush">
            {cartItems.map((item, index) => {
              const product = item.products || {};
              const price = product.price || 0;
              return (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    {product.name || 'Unknown Product'} (x{item.quantity})
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span>Rp{new Intl.NumberFormat('id-ID').format(price * item.quantity)}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              );
            })}
            <li className="list-group-item d-flex justify-content-between align-items-center fw-bold">
              Total
              <span>Rp{new Intl.NumberFormat('id-ID').format(calculateTotal())}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Data Pemesan</h5>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Nama</label>
            <input type="text" className="form-control" id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">No. HP (WhatsApp)</label>
            <PhoneInput
              international
              defaultCountry="ID"
              value={phone}
              onChange={setPhone}
              className="form-control"
            />
          </div>
          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="pickup" checked={isPickup} onChange={(e) => setIsPickup(e.target.checked)} />
            <label className="form-check-label" htmlFor="pickup">Ambil di Toko</label>
          </div>
          {!isPickup && (
            <div className="mb-3">
              <label htmlFor="address" className="form-label">Alamat</label>
              <textarea className="form-control" id="address" rows="3" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleOrder}>Buat Pesanan</button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
