import React, { useState } from 'react';
import OrderStatus from '../Component/OrderStatus';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          {!submitted ? (
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Lacak Pesanan Anda</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="orderId" className="form-label">Masukkan ID Pesanan</label>
                    <input
                      type="text"
                      className="form-control"
                      id="orderId"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Contoh: 12345XYZ"
                      required
                    />
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary">Lacak</button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <OrderStatus orderId={orderId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
