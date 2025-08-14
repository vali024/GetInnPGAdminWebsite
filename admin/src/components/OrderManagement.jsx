import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/order/list');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const response = await axios.post('/api/order/update-status', {
                orderId,
                status: newStatus
            });

            if (response.data.success) {
                setOrders(orders.map(order => 
                    order._id === orderId ? { ...order, status: newStatus } : order
                ));
                toast.success('Order status updated successfully');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        }
    };

    const getFilteredOrders = () => {
        if (filter === 'all') return orders;
        return orders.filter(order => order.status === filter);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (date) => {
        return format(new Date(date), 'PPpp');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Order Management</h1>
                <div className="flex gap-2">
                    {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded ${
                                filter === status
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6">
                {getFilteredOrders().map((order) => (
                    <div key={order._id} className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-gray-600">Order ID: {order._id}</p>
                                <p className="text-sm text-gray-600">
                                    Customer: {order.userId?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Placed on: {formatDate(order.createdAt)}
                                </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <div className="grid gap-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="ml-4">
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Quantity: {item.quantity} ({item.size})
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 mt-4 pt-4">
                            <div className="flex justify-between items-center font-medium">
                                <span>Total Amount:</span>
                                <span>₹{order.amount.toFixed(2)}</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                <p>Payment Method: {order.payment.method}</p>
                                <p>Payment Status: {order.payment.status}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 mt-4 pt-4">
                            <h3 className="font-medium mb-2">Delivery Address:</h3>
                            <div className="text-sm text-gray-600">
                                <p>{order.address.firstName} {order.address.lastName}</p>
                                <p>{order.address.street}</p>
                                <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                                <p>Phone: {order.address.phone}</p>
                            </div>
                        </div>

                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <div className="border-t border-gray-200 mt-4 pt-4">
                                <h3 className="font-medium mb-2">Update Status:</h3>
                                <div className="flex gap-2">
                                    {['confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusUpdate(order._id, status)}
                                            className={`px-3 py-1 rounded text-sm ${
                                                order.status === status
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                            disabled={order.status === status}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderManagement;