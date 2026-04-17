import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const orderId = new URLSearchParams(window.location.search).get("order_id");

        if (!orderId) {
          console.warn("❌ No order_id found in URL");
          setTimeout(() => navigate("/dashboard?from_payment=true"), 2000);
          return;
        }

        console.log("✅ Payment Success - Order ID:", orderId);

        // Step 1: Retrieve booking data from localStorage
        const formData = JSON.parse(localStorage.getItem("bookingFormData") || "{}");
        const selectedServices = JSON.parse(localStorage.getItem("bookingSelectedServices") || "[]");
        const couponCode = localStorage.getItem("bookingCouponCode") || "";

        console.log("📦 Retrieved booking data from localStorage:", {
          customerName: formData.customerName,
          email: formData.email,
          servicesCount: selectedServices.length,
          couponCode,
        });

        // Step 2: Validate we have booking data
        if (!selectedServices.length) {
          console.error("❌ No services found in localStorage");
          toast.error("Booking services not found. Please try again.");
          setTimeout(() => navigate("/booking"), 2000);
          return;
        }

        if (!formData.customerName) {
          console.error("❌ No customer name found in localStorage");
          toast.error("Booking data incomplete. Please try again.");
          setTimeout(() => navigate("/booking"), 2000);
          return;
        }

        // Step 3: Create booking with payment verified status
        console.log("📝 Creating booking entry with PAID status...");
        
        const bookingPayload = {
          selectedServices: selectedServices.map(s => ({
            ...s,
            serviceName: s.serviceName || s.service || ""
          })),
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email,
          date: formData.date,
          time: formData.time,
          stylist: formData.stylist,
          mode: "online",
          couponCode: couponCode ? couponCode.trim() : null,
          paymentVerified: true,
          orderId: orderId,
        };

        console.log("📤 Booking Payload:", JSON.stringify(bookingPayload, null, 2));

        try {
          const bookingResponse = await api.post(
            "/api/bookings",
            bookingPayload,
            {
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              timeout: 10000
            }
          );

          console.log("✅ Booking Response Status:", bookingResponse.status);
          console.log("✅ Booking Response Data:", bookingResponse.data);

          if (bookingResponse.data.ok || bookingResponse.status === 201 || bookingResponse.status === 200) {
            console.log("✅✅ Booking created successfully!");
            toast.success("✅ Booking confirmed! Payment received 🎉");

            // Step 4: Clear localStorage
            console.log("🧹 Clearing localStorage...");
            [
              "bookingFormData",
              "bookingSelectedServices",
              "bookingCouponCode",
              "bookingCouponValidated",
              "bookingEmailVerified",
              "bookingDiscountData",
              "bookingPaymentData",
              "bookingPaymentCompleted",
              "bookingPaymentInProgress"
            ].forEach(key => localStorage.removeItem(key));

            // Step 5: Redirect to dashboard with refresh flag
            console.log("🔄 Redirecting to dashboard with refresh...");
            setTimeout(() => {
              navigate("/dashboard?from_payment=true");
            }, 1500);
          } else {
            console.error("❌ Unexpected booking response:", bookingResponse.data);
            toast.error("Booking response invalid. Please check dashboard.");
            setTimeout(() => navigate("/dashboard?from_payment=true"), 2000);
          }
        } catch (bookingError) {
          console.error("❌ Booking Creation Error:", {
            message: bookingError.message,
            response: bookingError.response?.data,
            status: bookingError.response?.status,
            config: {
              url: bookingError.config?.url,
              method: bookingError.config?.method,
              data: bookingError.config?.data
            }
          });
          
          if (bookingError.response?.status === 400) {
            console.error("❌ Validation Error:", bookingError.response.data?.message);
            toast.error(bookingError.response.data?.message || "Booking validation failed");
          } else if (bookingError.response?.status === 500) {
            console.error("❌ Server Error");
            toast.error("Server error. Please try again later.");
          } else {
            toast.error("Error creating booking. Redirecting...");
          }
          
          setTimeout(() => navigate("/dashboard?from_payment=true"), 3000);
        }

      } catch (err) {
        console.error("❌ Unexpected Error in PaymentSuccess:", err);
        toast.error("Unexpected error. Please contact support.");
        setTimeout(() => navigate("/booking"), 3000);
      }
    };

    handlePaymentSuccess();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-4">Payment Successful 🎉</h2>
        <p className="text-gray-400">Creating your booking entry...</p>
        <p className="text-xs text-gray-500 mt-4">Please wait, this may take a few seconds...</p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
