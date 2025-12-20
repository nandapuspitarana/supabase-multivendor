import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import product1 from '../images/category-baby-care.jpg'
import product2 from '../images/category-atta-rice-dal.jpg'
import product3 from '../images/category-bakery-biscuits.jpg'
import product4 from '../images/category-chicken-meat-fish.jpg'
import product5 from '../images/category-cleaning-essentials.jpg'
import product6 from '../images/category-dairy-bread-eggs.jpg'
import product7 from '../images/category-instant-food.jpg'
import product8 from '../images/category-pet-care.jpg'
import product9 from '../images/category-snack-munchies.jpg'
import product10 from '../images/category-tea-coffee-drinks.jpg'
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabaseClient'

const ProductItem = () => {
  const [items, setItems] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const iconMap = {
    'baby-care': product1,
    'atta-rice-dal': product2,
    'bakery-biscuits': product3,
    'chicken-meat-fish': product4,
    'cleaning-essentials': product5,
    'dairy-bread-eggs': product6,
    'instant-food': product7,
    'pet-care': product8,
    'snack-munchies': product9,
    'tea-coffee-drinks': product10
  }
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,image_url,shop_id,vendor_id,product_categories(name,slug)')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) {
        setErrorMsg(error.message)
      } else {
        setItems(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])


  const handleAddClick = async (product) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      // User is logged in, add to supabase cart
      const { data: cartItem, error } = await supabase
        .from('cart')
        .insert([
          { 
            product_id: product.id, 
            user_id: session.user.id,
            quantity: 1,
            price: product.price
          }
        ]);

      if (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: "Could not add product to cart: " + error.message,
          showConfirmButton: true,
        });
      } else {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart',
          text: "Product has been added to your cart!",
          showConfirmButton: true,
          timer: 3000,
        });
      }
    } else {
      // User is a guest, add to local storage
      let guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
      const existingItem = guestCart.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        const newCartItem = {
          id: product.id, 
          product_id: product.id,
          quantity: 1,
          products: product 
        };
        guestCart.push(newCartItem);
      }

      localStorage.setItem('guestCart', JSON.stringify(guestCart));

      window.dispatchEvent(new CustomEvent('cartUpdated'));

      Swal.fire({
        icon: 'success',
        title: 'Added to Cart',
        text: "Product has been added to your cart as a guest!",
        showConfirmButton: true,
        timer: 3000,
      });
    }
  };
  return (
    <div>
      {/* Popular Products Start*/}
      <section className="my-lg-14 my-8">
        <div className="container">
          <div className="row">
            <div className="col-12 mb-6">
            <div className="section-head text-center mt-8" >
              <h3 className='h3style' data-title="Popular Products">Popular Products</h3>
              <div className="wt-separator bg-primarys">
              </div>
              <div className="wt-separator2 bg-primarys">
              </div>
              {/* <p>Connecting with entrepreneurs online, is just a few clicks away.</p> */}
            </div>
            </div>
          </div>
          {errorMsg ? <div className="text-danger small">Supabase error: {errorMsg}</div> : null}
          {items.length > 0 ? (
            <div className="row g-4 row-cols-lg-5 row-cols-2 row-cols-md-3">
              {items.map((p, idx) => {
                const cat = p.product_categories
                const slug = cat?.slug
                const img = (p.image_url && p.image_url.startsWith('http')) ? p.image_url : (slug ? iconMap[slug] : product1)
                return (
                  <div className="col fade-zoom" key={p.id || idx}>
                    <div className="card card-product">
                      <div className="card-body">
                        <div className="text-center position-relative ">
                          <Link to="#!">
                            <img src={img} alt={p.name} className="mb-3 img-fluid " />
                          </Link>
                          <div className="card-product-action">
                            <Link to="#!" className="btn-action" data-bs-toggle="modal" data-bs-target="#quickViewModal">
                              <i className="bi bi-eye" data-bs-toggle="tooltip" data-bs-html="true" title="Quick View" />
                           </Link>
                            <button onClick={() => handleAddClick(p)} className="btn-action" data-bs-toggle="tooltip" data-bs-html="true" title="Wishlist">
                              <i className="bi bi-heart" />
                            </button>
                            <button className="btn-action" data-bs-toggle="tooltip" data-bs-html="true" title="Compare">
                              <i className="bi bi-arrow-left-right" />
                            </button>
                          </div>
                        </div>
                        <div className="text-small mb-1">
                          <Link to="#!" className="text-decoration-none text-muted">
                            <small>{cat?.name || 'Category'}</small>
                          </Link>
                        </div>
                        <h2 className="fs-6">
                          <Link to="#!" className="text-inherit text-decoration-none">
                            {p.name}
                          </Link>
                        </h2>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span className="text-dark">Rp{new Intl.NumberFormat('id-ID').format(p.price)}</span>
                          </div>
                          <div>
                           <button className="btn btn-primary btn-sm" onClick={() => handleAddClick(p)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus">
                                <line x1={12} y1={5} x2={12} y2={19} />
                                <line x1={5} y1={12} x2={19} y2={12} />
                              </svg>{" "}
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
          <div className="row g-4 row-cols-lg-5 row-cols-2 row-cols-md-3">
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative ">
                    <div className=" position-absolute top-0 start-0">
                      <span className="badge bg-danger">Sale</span>
                    </div>
                    <Link href="#!">
                      {" "}
                      <img
                        src={product1}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid "
                      />
                    </Link>
                    <div className="card-product-action">
                      <button
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </button>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Snack &amp; Munchies</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Haldiram's Sev Bhujia
                    </Link>
                  </h2>
                  <div>
                    <small className="text-warning">
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                    </small>{" "}
                    <span className="text-muted small">4.5(149)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">Rp18.000</span>
                    </div>
                    <div>
                     <button className="btn btn-primary btn-sm" onClick={() => handleAddClick({id: 1, name: "Haldiram's Sev Bhujia", price: 18})}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    <div className=" position-absolute top-0 start-0">
                      <span className="badge bg-success">14%</span>
                    </div>
                    <Link href="#!">
                      <img
                        src={product2}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Bakery &amp; Biscuits</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      NutriChoice Digestive{" "}
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                    </small>{" "}
                    <span className="text-muted small">4.5 (25)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">Rp24.000</span>
                    </div>
                    <div>
                     <button className="btn btn-primary btn-sm" onClick={() => handleAddClick({id: 2, name: "NutriChoice Digestive", price: 24})}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product3}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Bakery &amp; Biscuits</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Cadbury 5 Star Chocolate
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                    </small>{" "}
                    <span className="text-muted small">5 (469)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">Rp32.000</span>{" "}
                      <span className="text-decoration-line-through text-muted">
                        Rp35.000
                      </span>
                    </div>
                    <div>
                     <button className="btn btn-primary btn-sm" onClick={() => handleAddClick({id: 3, name: "Cadbury 5 Star Chocolate", price: 32})}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product4}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                    <div className=" position-absolute top-0 start-0">
                      <span className="badge bg-danger">Hot</span>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Snack &amp; Munchies</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Onion Flavour Potato
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                      <i className="bi bi-star" />
                    </small>{" "}
                    <span className="text-muted small">3.5 (456)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">$3</span>{" "}
                      <span className="text-decoration-line-through text-muted">
                        $5
                      </span>
                    </div>
                    <div>
                     <button href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product5}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Instant Food</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Salted Instant Popcorn{" "}
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                    </small>{" "}
                    <span className="text-muted small">4.5 (39)</span>
                  </div>
                  <div className="d-flex justify-content-between mt-4">
                    <div>
                      <span className="text-dark">Rp13.000</span>
                    </div>
                    <div>
                     <Link href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative ">
                    <div className=" position-absolute top-0 start-0">
                      <span className="badge bg-danger">Sale</span>
                    </div>
                    <Link href="#!">
                      {" "}
                      <img
                        src={product6}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Dairy, Bread &amp; Eggs</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Blueberry Greek Yogurt
                    </Link>
                  </h2>
                  <div>
                    <small className="text-warning">
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                    </small>{" "}
                    <span className="text-muted small">4.5 (189)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">$18</span>{" "}
                      <span className="text-decoration-line-through text-muted">
                        $24
                      </span>
                    </div>
                    <div>
                     <Link href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product7}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Dairy, Bread &amp; Eggs</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Britannia Cheese Slices
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                    </small>{" "}
                    <span className="text-muted small">5 (345)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">$24</span>
                    </div>
                    <div>
                     <Link href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product8}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Instant Food</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Kellogg's Original Cereals
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                    </small>{" "}
                    <span className="text-muted small">4 (90)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">Rp32.000</span>
                    </div>
                    <div>
                     <Link href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product9}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Snack &amp; Munchies</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Slurrp Millet Chocolate{" "}
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                    </small>{" "}
                    <span className="text-muted small">4.5 (67)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span className="text-dark">$3</span>{" "}
                      <span className="text-decoration-line-through text-muted">
                        $5
                      </span>
                    </div>
                    <div>
                     <Link href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col fade-zoom">
              <div className="card card-product">
                <div className="card-body">
                  <div className="text-center position-relative">
                    {" "}
                    <Link href="#!">
                      <img
                        src={product10}
                        alt="Grocery Ecommerce Template"
                        className="mb-3 img-fluid"
                      />
                    </Link>
                    <div className="card-product-action">
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="modal"
                        data-bs-target="#quickViewModal"
                      >
                        <i
                          className="bi bi-eye"
                          data-bs-toggle="tooltip"
                          data-bs-html="true"
                          title="Quick View"
                        />
                      </Link>
                      <Link
                        href="#"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Wishlist"
                      >
                        <i className="bi bi-heart" />
                      </Link>
                      <Link
                        href="#!"
                        className="btn-action"
                        data-bs-toggle="tooltip"
                        data-bs-html="true"
                        title="Compare"
                      >
                        <i className="bi bi-arrow-left-right" />
                      </Link>
                    </div>
                  </div>
                  <div className="text-small mb-1">
                    <Link href="#!" className="text-decoration-none text-muted">
                      <small>Dairy, Bread &amp; Eggs</small>
                    </Link>
                  </div>
                  <h2 className="fs-6">
                    <Link
                      href="#!"
                      className="text-inherit text-decoration-none"
                    >
                      Amul Butter - 500 g
                    </Link>
                  </h2>
                  <div className="text-warning">
                    <small>
                      {" "}
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-half" />
                      <i className="bi bi-star" />
                    </small>{" "}
                    <span className="text-muted small">3.5 (89)</span>
                  </div>
                  <div className="d-flex justify-content-between mt-4">
                    <div>
                      <span className="text-dark">$13</span>{" "}
                      <span className="text-decoration-line-through text-muted">
                        $18
                      </span>
                    </div>
                    <div>
                     <Link href="#!" className="btn btn-primary btn-sm  "onClick={handleAddClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="feather feather-plus"
                        >
                          <line x1={12} y1={5} x2={12} y2={19} />
                          <line x1={5} y1={12} x2={19} y2={12} />
                        </svg>{" "}
                        Add
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>
      {/* Popular Products End*/}
    </div>
  );
};

export default ProductItem;
