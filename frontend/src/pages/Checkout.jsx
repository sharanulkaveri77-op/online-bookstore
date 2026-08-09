import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { useCart } from '../context/CartContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function Checkout() {
  const { refresh } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api('/cart').then(setCart).catch((err) => setError(err.message));
  }, []);

  if (!cart) return <Spinner label="Preparing checkout…" />;

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold text-stone-900">Order placed!</h1>
        <p className="text-stone-500 mt-3">
          Order <span className="font-semibold text-stone-800">#{String(success.order.id).padStart(4, '0')}</span> is confirmed.
          A PDF invoice was generated for your records.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.location.href = `/orders/${success.order.id}`}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm"
          >
            View order &amp; invoice
          </button>
          <Link to="/books" className="px-6 py-2.5 border border-stone-300 rounded-xl font-semibold text-sm text-stone-700 hover:bg-stone-100">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponError(null);
    setCoupon(null);
    try {
      const res = await api('/orders/validate-coupon', { method: 'POST', body: { coupon_code: couponCode } });
      setCoupon(res.coupon);
    } catch (err) {
      setCouponError(err.message);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const res = await api('/orders', { method: 'POST', body: { coupon_code: coupon ? coupon.code : undefined } });
      setSuccess(res);
      await refresh();
    } catch (err) {
      setError(err.message);
      setCart(await api('/cart'));
    } finally {
      setPlacing(false);
    }
  };

  const subtotal = cart.subtotal;
  const discount = coupon ? Math.round(subtotal * coupon.discount_percent) / 100 : 0;
  const total = Math.round((subtotal - discount) * 100) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-stone-900 mb-8">Checkout</h1>
      {error && <Alert message={error} onClose={() => setError(null)} />}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">Items</h2>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.cover_image_url} alt="" className="w-12 h-16 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.title}</p>
                    <p className="text-xs text-stone-500">Qty {item.quantity} × {money(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{money(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-display text-lg font-semibold text-stone-900 mb-2">Payment</h2>
            <p className="text-sm text-stone-500 mb-4">
              This is a demo store — no real payment is processed. Your order will be placed as <span className="font-medium text-stone-700">pending</span>.
            </p>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h2m4 0h4M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-stone-800">Demo card</p>
                <p className="text-xs text-stone-500">4242 4242 4242 4242 — mock only</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-20">
          <h2 className="font-display text-xl font-semibold text-stone-900 mb-4">Order summary</h2>

          <form onSubmit={applyCoupon} className="mb-5">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Coupon code</label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value); setCoupon(null); }}
                placeholder="e.g. WELCOME10"
                className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-600/40"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800">
                Apply
              </button>
            </div>
            {coupon && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                ✓ {coupon.code} applied — {coupon.discount_percent}% off
              </p>
            )}
            {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
          </form>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-medium text-stone-900">{money(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount ({coupon.code})</span>
                <span className="font-medium">−{money(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span className="font-medium text-emerald-700">Free</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
            <span className="font-semibold text-stone-900">Total</span>
            <span className="text-xl font-bold text-stone-900">{money(total)}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={placing || cart.items.length === 0}
            className="mt-5 w-full py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl font-semibold text-sm"
          >
            {placing ? 'Placing order…' : 'Place order'}
          </button>
          <Link to="/cart" className="mt-3 block text-center text-sm font-medium text-stone-500 hover:text-stone-800">
            ← Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
