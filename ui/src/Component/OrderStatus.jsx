
import React from 'react';

const OrderStatus = ({ orderId }) => {
    return (
        <div>
            <h2>Status Pesanan untuk ID: {orderId}</h2>
            <p>Pesanan Anda sedang diproses.</p>
        </div>
    );
};

export default OrderStatus;
