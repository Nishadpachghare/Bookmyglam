import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("order_id");

    if (!orderId) return;

    axios
      .post("http://localhost:5000/api/bookings/verify-payment", {
        orderId,
      })
      .then(() => {
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      })
      .catch((err) => {
        console.error("Verification failed:", err);
      });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <h2 className="text-3xl font-semibold">Payment Successful 🎉</h2>
    </div>
  );
}

export default PaymentSuccess;
