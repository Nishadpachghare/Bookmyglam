import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://bookmyglam-backend.vercel.app";

const PAYMENT_RETURN_DOMAIN =
  import.meta.env.VITE_PAYMENT_RETURN_DOMAIN || window.location.origin;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

const ADMIN_QR_URL = `${import.meta.env.BASE_URL}QR.jpeg`;

const getServiceName = (service) =>
  service?.serviceName ?? service?.service ?? service?.name ?? "";

const normalizeLookup = (value) => value?.toString().trim().toLowerCase() || "";

// ✅ INITIALIZER FUNCTIONS FOR LOCALSTORAGE HYDRATION
const getInitialFormData = () => {
  try {
    const saved = localStorage.getItem("bookingFormData");
    return saved
      ? JSON.parse(saved)
      : {
          stylist: "",
          customerName: "",
          phone: "",
          email: "",
          date: "",
          time: "",
          mode: "offline",
        };
  } catch (err) {
    console.warn("Error loading formData from localStorage:", err);
    return {
      stylist: "",
      customerName: "",
      phone: "",
      email: "",
      date: "",
      time: "",
      mode: "offline",
    };
  }
};

const getInitialSelectedServices = () => {
  try {
    const saved = localStorage.getItem("bookingSelectedServices");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.warn("Error loading selectedServices from localStorage:", err);
    return [];
  }
};

const getInitialCouponCode = () => {
  try {
    const saved = localStorage.getItem("bookingCouponCode");
    return saved ? saved : "";
  } catch (err) {
    console.warn("Error loading couponCode from localStorage:", err);
    return "";
  }
};

const getInitialSelectedOffer = () => {
  try {
    const saved = localStorage.getItem("bookingSelectedOffer");
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn("Error loading selectedOffer from localStorage:", err);
    return null;
  }
};

const getInitialEmailVerified = () => {
  try {
    const saved = localStorage.getItem("bookingEmailVerified");
    return saved ? JSON.parse(saved) : false;
  } catch (err) {
    console.warn("Error loading emailVerified from localStorage:", err);
    return false;
  }
};

const getInitialDiscountData = () => {
  try {
    const saved = localStorage.getItem("bookingDiscountData");
    return saved
      ? JSON.parse(saved)
      : {
          discountPercentage: 0,
          discountAmount: 0,
          finalAmount: 0,
        };
  } catch (err) {
    console.warn("Error loading discountData from localStorage:", err);
    return {
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    };
  }
};

const getInitialCouponValidated = () => {
  try {
    const saved = localStorage.getItem("bookingCouponValidated");
    if (saved) {
      return JSON.parse(saved);
    }
    // If no saved value, check if discountData exists with amount > 0
    const savedDiscountData = localStorage.getItem("bookingDiscountData");
    if (savedDiscountData) {
      const parsed = JSON.parse(savedDiscountData);
      return parsed.discountAmount > 0;
    }
    return false;
  } catch (err) {
    console.warn("Error loading couponValidated from localStorage:", err);
    return false;
  }
};

const getInitialPaymentData = () => {
  try {
    const saved = localStorage.getItem("bookingPaymentData");
    return saved
      ? JSON.parse(saved)
      : {
          orderId: null,
          paymentSessionId: null,
          paymentVerified: false,
        };
  } catch (err) {
    console.warn("Error loading paymentData from localStorage:", err);
    return {
      orderId: null,
      paymentSessionId: null,
      paymentVerified: false,
    };
  }
};

const getInitialPaymentCompleted = () => {
  try {
    // ✅ FIRST - Check explicit localStorage value
    const saved = localStorage.getItem("bookingPaymentCompleted");
    if (saved !== null) {
      const result = JSON.parse(saved);
      console.log(
        "✅ Restored paymentCompleted from explicit storage:",
        result,
      );
      return result;
    }

    // ✅ SECOND - Check if payment in progress (user returned from Cashfree)
    const inProgress = localStorage.getItem("bookingPaymentInProgress");
    if (inProgress === "true") {
      console.log(
        "🔄 Payment in progress - user likely returned from Cashfree",
      );
      // Check if verified payment data exists
      const paymentData = getInitialPaymentData();
      if (paymentData && paymentData.paymentVerified && paymentData.orderId) {
        console.log("✅ Payment verified after return from Cashfree");
        return true;
      }
    }

    // ✅ THIRD - Check if paymentData has verified payment
    const paymentData = getInitialPaymentData();
    const isPaymentVerified =
      paymentData && paymentData.paymentVerified === true;
    const hasOrderId =
      paymentData &&
      paymentData.orderId !== null &&
      paymentData.orderId !== undefined;
    const result = isPaymentVerified && hasOrderId;

    if (result) {
      console.log("✅ Computed paymentCompleted from paymentData:", result, {
        isPaymentVerified,
        hasOrderId,
        paymentData,
      });
    }

    return result;
  } catch (err) {
    console.error("❌ Error loading paymentCompleted from localStorage:", err);
    return false;
  }
};

function Booking() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // track any field-specific validation errors (email in particular)
  const [formErrors, setFormErrors] = useState({});

  // ✅ USE INITIALIZER FUNCTIONS TO HYDRATE FROM LOCALSTORAGE
  const [formData, setFormData] = useState(() => getInitialFormData());
  const [selectedServices, setSelectedServices] = useState(() =>
    getInitialSelectedServices(),
  );
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availableOffers, setAvailableOffers] = useState([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState(() => getInitialCouponCode());
  const [couponValidated, setCouponValidated] = useState(() =>
    getInitialCouponValidated(),
  );
  const [couponError, setCouponError] = useState("");
  const [discountData, setDiscountData] = useState(() =>
    getInitialDiscountData(),
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const showCouponSuggestions = false;

  // Offer state
  const [selectedOffer, setSelectedOffer] = useState(() =>
    getInitialSelectedOffer(),
  );

  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(() =>
    getInitialEmailVerified(),
  );
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpTimerRef = useRef(null);

  // ✅ PAYMENT STATE FOR TRACKING ONLINE PAYMENTS
  const [paymentData, setPaymentData] = useState(() => getInitialPaymentData());

  // ✅ TRACK IF PAYMENT WAS JUST COMPLETED (TO SHOW "ADD BOOKING" BUTTON)
  const [paymentCompleted, setPaymentCompleted] = useState(() =>
    getInitialPaymentCompleted(),
  );
  const paymentSubmissionRef = useRef({
    orderId: null,
    inFlight: false,
  });

  // keep cooldown ticking down
  useEffect(() => {
    if (otpCooldown <= 0) return;
    otpTimerRef.current = setInterval(() => {
      setOtpCooldown((c) => {
        if (c <= 1) {
          clearInterval(otpTimerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(otpTimerRef.current);
  }, [otpCooldown]);

  // QR Modal state
  const [showQR, setShowQR] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [dateDisplay, setDateDisplay] = useState("");

  // ✅ SAVE FORMDATA TO LOCALSTORAGE WHENEVER IT CHANGES
  useEffect(() => {
    localStorage.setItem("bookingFormData", JSON.stringify(formData));
  }, [formData]);

  // ✅ SAVE SELECTED SERVICES TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem(
      "bookingSelectedServices",
      JSON.stringify(selectedServices),
    );
  }, [selectedServices]);

  // ✅ VALIDATE COUPON/OFFER WHEN SERVICES CHANGE
  // If services no longer match offer criteria, clear the discount
  useEffect(() => {
    if (!couponValidated || selectedServices.length === 0) {
      return;
    }

    // Check if current offer still applies to selected services
    if (
      selectedOffer &&
      Array.isArray(selectedOffer.services) &&
      selectedOffer.services.length > 0
    ) {
      const currentServiceNames = selectedServices
        .map((s) => normalizeLookup(getServiceName(s)))
        .filter(Boolean);

      const offerServiceNames = selectedOffer.services
        .map((s) => normalizeLookup(s))
        .filter(Boolean);

      // Check if at least one selected service matches offer
      const hasMatch = currentServiceNames.some((name) =>
        offerServiceNames.includes(name),
      );

      if (!hasMatch) {
        // Offer no longer applies - clear it
        setCouponCode("");
        setCouponValidated(false);
        setSelectedOffer(null);
        setDiscountData({
          discountPercentage: 0,
          discountAmount: 0,
          finalAmount: 0,
        });
        toast.error(`Offer no longer applies - no matching services selected`);
      } else {
        // Offer still applies, but services changed - RE-VALIDATE to update calculation
        // This ensures discount is recalculated based on new total
        handleValidateCoupon(couponCode);
      }
    }

    // Check if current coupon still applies to selected services
    if (couponCode && availableCoupons.length > 0) {
      const coupon = availableCoupons.find(
        (c) => normalizeLookup(c.code) === normalizeLookup(couponCode),
      );

      if (
        coupon &&
        Array.isArray(coupon.services) &&
        coupon.services.length > 0
      ) {
        const currentServiceNames = selectedServices
          .map((s) => normalizeLookup(getServiceName(s)))
          .filter(Boolean);

        const couponServiceNames = coupon.services
          .map((s) => normalizeLookup(s))
          .filter(Boolean);

        const hasMatch = currentServiceNames.some((name) =>
          couponServiceNames.includes(name),
        );

        if (!hasMatch) {
          // Coupon no longer applies
          setCouponCode("");
          setCouponValidated(false);
          setSelectedOffer(null);
          setDiscountData({
            discountPercentage: 0,
            discountAmount: 0,
            finalAmount: 0,
          });
          toast.error(
            `Coupon no longer applies - no matching services selected`,
          );
        } else {
          // Coupon still applies, but services changed - RE-VALIDATE
          handleValidateCoupon(couponCode);
        }
      }
    }
  }, [
    selectedServices,
    couponValidated,
    couponCode,
    selectedOffer,
    availableCoupons,
  ]);

  // ✅ SAVE COUPON DATA TO LOCALSTORAGE
  useEffect(() => {
    if (couponCode) {
      localStorage.setItem("bookingCouponCode", couponCode);
    } else {
      localStorage.removeItem("bookingCouponCode");
    }
  }, [couponCode]);

  // ✅ SAVE SELECTED OFFER TO LOCALSTORAGE
  useEffect(() => {
    if (selectedOffer) {
      localStorage.setItem(
        "bookingSelectedOffer",
        JSON.stringify(selectedOffer),
      );
    } else {
      localStorage.removeItem("bookingSelectedOffer");
    }
  }, [selectedOffer]);

  useEffect(() => {
    const trimmedCode = couponCode.trim();

    if (!trimmedCode) {
      if (selectedOffer) {
        setSelectedOffer(null);
        return true;
      }
      return;
    }

    const matchedOffer =
      availableOffers.find(
        (offer) =>
          offer.title?.trim().toLowerCase() === trimmedCode.toLowerCase(),
      ) || null;

    if (matchedOffer?._id !== selectedOffer?._id) {
      setSelectedOffer(matchedOffer);
    }
  }, [couponCode, availableOffers, selectedOffer]);

  // ✅ SAVE EMAIL VERIFICATION STATUS TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("bookingEmailVerified", JSON.stringify(emailVerified));
  }, [emailVerified]);

  // ✅ SAVE COUPON VALIDATED STATUS TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem(
      "bookingCouponValidated",
      JSON.stringify(couponValidated),
    );
  }, [couponValidated]);

  // ✅ SAVE DISCOUNT DATA TO LOCALSTORAGE
  useEffect(() => {
    if (discountData.discountAmount > 0) {
      localStorage.setItem("bookingDiscountData", JSON.stringify(discountData));
      // Auto-set couponValidated to true when discount is applied
      setCouponValidated(true);
    }
  }, [discountData]);

  // ✅ RESTORE COUPON VALIDATED STATUS ON MOUNT (check if discountData exists)
  useEffect(() => {
    try {
      const savedDiscountData = localStorage.getItem("bookingDiscountData");
      if (savedDiscountData) {
        const parsed = JSON.parse(savedDiscountData);
        if (parsed.discountAmount > 0) {
          setCouponValidated(true);
        }
      }
    } catch (err) {
      console.warn("Error restoring coupon validation:", err);
    }
  }, []);

  // ✅ SAVE PAYMENT DATA TO LOCALSTORAGE
  useEffect(() => {
    console.log("💾 Saving paymentData:", paymentData);
    localStorage.setItem("bookingPaymentData", JSON.stringify(paymentData));
  }, [paymentData]);

  // ✅ SAVE PAYMENT COMPLETED STATUS TO LOCALSTORAGE
  useEffect(() => {
    console.log("💾 Saving paymentCompleted:", paymentCompleted);
    localStorage.setItem(
      "bookingPaymentCompleted",
      JSON.stringify(paymentCompleted),
    );
  }, [paymentCompleted]);

  // ✅ DEBUG LOG ON MOUNT - Check what was restored
  useEffect(() => {
    const storedPaymentData = localStorage.getItem("bookingPaymentData");
    const storedPaymentCompleted = localStorage.getItem(
      "bookingPaymentCompleted",
    );

    console.log("🔄 COMPONENT MOUNTED - Current state:");
    console.log("  paymentCompleted:", paymentCompleted);
    console.log("  paymentData:", paymentData);
    console.log("  📦 Stored paymentData in localStorage:", storedPaymentData);
    console.log(
      "  📦 Stored paymentCompleted in localStorage:",
      storedPaymentCompleted,
    );
    console.log("  formData.mode:", formData.mode);
    console.log("  emailVerified:", emailVerified);

    // Log parsed values
    if (storedPaymentData) {
      try {
        const parsed = JSON.parse(storedPaymentData);
        console.log("  ✅ Parsed paymentData:", parsed);

        // ✅ IF WE HAVE VALID PAYMENT DATA FROM LOCALSTORAGE, ENSURE STATES ARE SET
        if (parsed.paymentVerified && parsed.orderId) {
          console.log(
            "✅ Valid payment data found! Forcing payment state sync...",
          );
          // Force update of payment data from localStorage
          setPaymentData({
            orderId: parsed.orderId,
            paymentSessionId: parsed.paymentSessionId,
            paymentVerified: true,
          });
          // Force update of paymentCompleted
          setPaymentCompleted(true);
          console.log("✅ Payment state synced!");
        }
      } catch (e) {
        console.error("  ❌ Error parsing paymentData:", e);
      }
    }
  }, []);

  // ✅ VALIDATE PAYMENT STATE CONSISTENCY
  useEffect(() => {
    console.log("📊 Payment state changed:");
    console.log("  paymentCompleted:", paymentCompleted);
    console.log("  paymentData:", paymentData);

    if (paymentData.paymentVerified && !paymentCompleted) {
      console.warn(
        "⚠️  Payment is verified but paymentCompleted is false! Setting it...",
      );
      setPaymentCompleted(true);
    }
  }, [paymentData.paymentVerified, paymentCompleted, paymentData.orderId]);

  // ✅ ON MOUNT - ENSURE CASHFREE REDIRECT HANDLED PROPERLY
  useEffect(() => {
    console.log("🔍 Checking if this is a Cashfree redirect return...");
    const paymentData = getInitialPaymentData();
    const paymentCompleted = getInitialPaymentCompleted();

    console.log("  Computed from localStorage on mount:");
    console.log("    paymentData:", paymentData);
    console.log("    paymentCompleted:", paymentCompleted);

    // If payment is verified, make sure component state reflects it
    if (paymentData.paymentVerified && paymentData.orderId) {
      console.log("✅ CASHFREE RETURN DETECTED! Setting payment completion...");
      setPaymentData(paymentData);
      setPaymentCompleted(true);
    }
  }, []);

  // ✅ AGGRESSIVE PAYMENT STATE MONITOR - Check localStorage every 500ms for new payments
  useEffect(() => {
    let checkInterval;
    let checkCount = 0;
    const maxChecks = 20; // Check for max 10 seconds (20 * 500ms)

    const checkForPaymentCompletion = () => {
      checkCount++;
      if (checkCount > maxChecks) {
        clearInterval(checkInterval);
        return;
      }

      const storedCompleted = localStorage.getItem("bookingPaymentCompleted");
      const storedPaymentData = localStorage.getItem("bookingPaymentData");

      if (
        storedCompleted === "true" ||
        (storedPaymentData &&
          JSON.parse(storedPaymentData).paymentVerified &&
          !paymentCompleted)
      ) {
        console.log("✅ PAYMENT COMPLETED DETECTED! Syncing state...", {
          storedCompleted,
          storedPaymentData,
          currentPaymentCompleted: paymentCompleted,
        });

        try {
          const paymentData = JSON.parse(storedPaymentData || "{}");
          if (paymentData.paymentVerified && paymentData.orderId) {
            console.log("🔄 Updating state to reflect completed payment");
            setPaymentData(paymentData);
            setPaymentCompleted(true);
          }
        } catch (e) {
          console.error("Error parsing stored payment data:", e);
        }

        clearInterval(checkInterval);
      }
    };

    // Start checking after a small delay to let Cashfree callback complete
    const timeoutId = setTimeout(() => {
      checkInterval = setInterval(checkForPaymentCompletion, 500);
      checkForPaymentCompletion(); // Check immediately
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(checkInterval);
    };
  }, [paymentCompleted]);

  // ✅ LISTEN FOR LOCALSTORAGE CHANGES (from Cashfree or other windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        e.key === "bookingPaymentCompleted" ||
        e.key === "bookingPaymentData"
      ) {
        console.log("🔔 Storage event detected:", e.key, e.newValue);

        if (e.key === "bookingPaymentCompleted" && e.newValue === "true") {
          console.log("✅ Payment marked complete from storage event");
          const paymentData = getInitialPaymentData();
          if (paymentData.paymentVerified && paymentData.orderId) {
            setPaymentData(paymentData);
            setPaymentCompleted(true);
          }
        }

        if (e.key === "bookingPaymentData") {
          try {
            const newData = JSON.parse(e.newValue);
            if (newData.paymentVerified && newData.orderId) {
              console.log("✅ Payment verified from storage event");
              setPaymentData(newData);
              setPaymentCompleted(true);
            }
          } catch (err) {
            console.error(
              "Error parsing payment data from storage event:",
              err,
            );
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const totalPrice = selectedServices.reduce(
    (total, s) => total + Number(s.price || 0),
    0,
  );
  const payableAmount = couponValidated ? discountData.finalAmount : totalPrice;

  const selectedServiceNames = selectedServices
    .map((service) => getServiceName(service))
    .filter(Boolean);
  const selectedServicePayload = selectedServices.map((service) => ({
    serviceName: getServiceName(service),
    price: Number(service?.price || 0),
  }));

  const getCouponCriteriaError = (coupon) => {
    const now = new Date();

    if (!coupon?.active) {
      return "Coupon code is not active";
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return "Coupon code has expired";
    }

    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return "Coupon is not yet valid";
    }

    if (coupon.validTill && new Date(coupon.validTill) < now) {
      return "Coupon code has expired";
    }

    if (coupon.minAmount && totalPrice < coupon.minAmount) {
      return `Minimum booking amount of Rs.${coupon.minAmount} required for this coupon`;
    }

    // ✅ NEW: Check service criteria for coupons (if specified)
    if (Array.isArray(coupon.services) && coupon.services.length > 0) {
      const couponServices = coupon.services.map((service) =>
        normalizeLookup(service),
      );

      const hasApplicableService = selectedServiceNames.some((serviceName) =>
        couponServices.includes(normalizeLookup(serviceName)),
      );

      if (!hasApplicableService) {
        return `Coupon only applicable for: ${coupon.services.join(", ")}`;
      }
    }

    return "";
  };

  const getOfferCriteriaError = (offer) => {
    const now = new Date();

    if (!offer?.active || !offer.published) {
      return "Offer is not available";
    }

    if (offer.startDate && new Date(offer.startDate) > now) {
      return "Offer has not started yet";
    }

    if (offer.endDate && new Date(offer.endDate) < now) {
      return "Offer has ended";
    }

    // ✅ FIX: Offer MUST have services configured
    if (!Array.isArray(offer.services) || offer.services.length === 0) {
      return "This offer is not properly configured";
    }

    const offerServices = offer.services.map((service) =>
      normalizeLookup(service),
    );

    // ✅ FIX: Check if at least ONE selected service matches the offer services
    const hasApplicableService = selectedServiceNames.some((serviceName) =>
      offerServices.includes(normalizeLookup(serviceName)),
    );

    if (!hasApplicableService) {
      return `Offer is only applicable for: ${offer.services.join(", ")}`;
    }

    return "";
  };

  const eligibleCoupons = availableCoupons.filter(
    (coupon) => !getCouponCriteriaError(coupon),
  );

  const eligibleOffers = availableOffers.filter(
    (offer) => !getOfferCriteriaError(offer),
  );

  const activeDiscountOptions = [
    ...availableCoupons.map((coupon) => ({
      key: `coupon:${coupon._id}`,
      type: "coupon",
      item: coupon,
      value: coupon.code,
      label: `${coupon.code} - Save ${coupon.discount}%${coupon.minAmount > 0 ? ` (Min: Rs.${coupon.minAmount})` : ""}`,
    })),
    ...availableOffers.map((offer) => ({
      key: `offer:${offer._id}`,
      type: "offer",
      item: offer,
      value: offer.title,
      label: `${offer.title} - Save ${offer.discount}% (Offer)`,
    })),
  ];

  const selectedDiscountOptionValue =
    activeDiscountOptions.find(
      (option) => normalizeLookup(option.value) === normalizeLookup(couponCode),
    )?.key || "";

  // Convert yyyy-mm-dd to dd-mm-yyyy
  const formatDateToDisplay = (yyyymmdd) => {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return yyyymmdd;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Handle date input with calendar picker
  const handleDateInput = (e) => {
    const value = e.target.value; // This will be in YYYY-MM-DD format from date input
    if (value) {
      setFormData({ ...formData, date: value });
      setDateDisplay(value);
    } else {
      setFormData({ ...formData, date: "" });
      setDateDisplay("");
    }
  };

  useEffect(() => {
    fetchServices();
    fetchStylists();
    fetchAvailableCoupons();
    fetchAvailableOffers();
  }, []);

  useEffect(() => {
    if (!couponValidated || !couponCode.trim()) {
      return;
    }

    const matchedCoupon = availableCoupons.find(
      (coupon) => normalizeLookup(coupon.code) === normalizeLookup(couponCode),
    );
    const matchedOffer = availableOffers.find(
      (offer) => normalizeLookup(offer.title) === normalizeLookup(couponCode),
    );

    const criteriaError = matchedCoupon
      ? getCouponCriteriaError(matchedCoupon)
      : matchedOffer
        ? getOfferCriteriaError(matchedOffer)
        : "Select a valid coupon or offer from the list";

    if (!criteriaError) {
      return;
    }

    setCouponValidated(false);
    setSelectedOffer(null);
    setCouponError(criteriaError);
    setDiscountData({
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    });
  }, [
    couponValidated,
    couponCode,
    totalPrice,
    selectedServices,
    availableCoupons,
    availableOffers,
  ]);

  const fetchAvailableCoupons = async () => {
    try {
      console.log("🔄 Fetching coupons from /api/coupons");
      const res = await api.get("/api/coupons");
      console.log("📦 Raw coupons response:", res.data);

      const data = res.data?.data || res.data || [];
      console.log(
        "  Total coupons found:",
        Array.isArray(data) ? data.length : 0,
      );

      if (Array.isArray(data)) {
        data.forEach((coupon, idx) => {
          console.log(
            `  [${idx + 1}] ${coupon.code} - Active: ${coupon.active} - Discount: ${coupon.discount}% - Min: ₹${coupon.minAmount || 0}`,
          );
        });
      }

      // Filter only active coupons
      const activeCoupons = Array.isArray(data)
        ? data.filter((c) => c.active === true)
        : [];

      console.log(`✅ Active coupons: ${activeCoupons.length}`);
      activeCoupons.forEach((c, idx) => {
        console.log(`  [${idx + 1}] ${c.code} - ${c.discount}%`);
      });

      setAvailableCoupons(activeCoupons);
    } catch (err) {
      console.warn("❌ Failed to fetch coupons:", err);
      console.error("  Error:", err.message);
      console.error("  Response:", err.response?.data);
    }
  };

  const fetchAvailableOffers = async () => {
    try {
      const res = await api.get("/api/offers/active");
      const data = res.data?.data || res.data || [];
      const activeOffers = Array.isArray(data) ? data : [];
      setAvailableOffers(activeOffers);
    } catch (err) {
      console.warn("Failed to fetch offers:", err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get("/api/manageservices");
      // backend returns objects with a `service` field but many parts
      // of the client expect `serviceName`.  Normalize here so the rest
      // of the component doesn't need to worry about it.
      const data = res.data?.data || res.data || [];
      const normalized = data.map((s) => ({
        ...s,
        serviceName: s.serviceName ?? s.service ?? "",
      }));
      setServices(normalized);
    } catch {
      toast.error("Unable to load services");
    }
  };

  const fetchStylists = async () => {
    try {
      // only active stylists are relevant when creating a booking
      const res = await api.get("/api/stylists", {
        params: { status: "active" },
      });
      const payload = res.data;
      let list = payload?.data ?? payload;
      if (!Array.isArray(list)) list = [];
      // extra guard in case server doesn't filter
      const activeOnly = list.filter(
        (s) => (s.status || "").toString().toLowerCase() === "active",
      );
      setStylists(activeOnly);
    } catch (err) {
      console.error("Booking fetchStylists error:", err);
      toast.error("Unable to load stylists");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "service") {
      const service = services.find((s) => s._id === value);
      if (service && !selectedServices.some((s) => s._id === service._id)) {
        setSelectedServices([...selectedServices, service]);
      }
      return;
    }

    // clear any existing error for this field, then update value
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (name === "email") {
      if (emailVerified) {
        // user changed email after verifying; require re-verification
        setEmailVerified(false);
      }
      setOtpCode("");
      setOtpCooldown(0);
      clearInterval(otpTimerRef.current);
    }
  };

  const removeService = (id) => {
    // When removing a service, check if it invalidates the current coupon/offer
    const removedService = selectedServices.find((s) => s._id === id);

    setSelectedServices((prev) => prev.filter((s) => s._id !== id));

    // Check if removing this service breaks the coupon/offer eligibility
    if (removedService && couponValidated && (couponCode || selectedOffer)) {
      const remainingServices = selectedServices.filter((s) => s._id !== id);

      // If no services remain, clear coupon/offer
      if (remainingServices.length === 0) {
        setCouponCode("");
        setCouponValidated(false);
        setSelectedOffer(null);
        setDiscountData({
          discountPercentage: 0,
          discountAmount: 0,
          finalAmount: 0,
        });
        return;
      }

      // Check if offer still applies
      if (
        selectedOffer &&
        Array.isArray(selectedOffer.services) &&
        selectedOffer.services.length > 0
      ) {
        const remainingServiceNames = remainingServices
          .map((s) => normalizeLookup(getServiceName(s)))
          .filter(Boolean);

        const offerServiceNames = selectedOffer.services
          .map((s) => normalizeLookup(s))
          .filter(Boolean);

        const hasMatch = remainingServiceNames.some((name) =>
          offerServiceNames.includes(name),
        );

        if (!hasMatch && removedService) {
          // Check if removed service was the only one matching
          const removedName = normalizeLookup(getServiceName(removedService));
          const wasOnlyMatch = offerServiceNames.includes(removedName);

          if (wasOnlyMatch) {
            setCouponCode("");
            setCouponValidated(false);
            setSelectedOffer(null);
            setDiscountData({
              discountPercentage: 0,
              discountAmount: 0,
              finalAmount: 0,
            });
            toast.info("Offer cleared - no matching services remain");
          }
        }
      }
    }
  };

  const sendOtpEmail = async () => {
    const email = formData.email?.trim();
    if (!email) return toast.error("Enter email first");
    if (otpCooldown > 0) {
      toast.error(`Please wait ${otpCooldown}s before resending`);
      return;
    }

    try {
      setOtpLoading(true);
      const res = await api.post("/api/auth/send-otp", {
        to: email,
        channel: "email",
      });
      if (res.data.ok) {
        toast.success("OTP Sent");
        setOtpCooldown(60);
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "OTP failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpEmail = async () => {
    const email = formData.email?.trim();
    if (!email) return toast.error("Enter email first");
    if (!otpCode) return toast.error("Enter OTP");

    try {
      setOtpLoading(true);
      const res = await api.post("/api/auth/verify-otp", {
        to: email,
        code: otpCode.trim(),
        // channel is ignored by the server but harmless
        channel: "email",
      });

      if (res.data.ok) {
        setEmailVerified(true);
        toast.success("Email verified ✅");
      } else {
        toast.error(res.data.message || "OTP verification failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleValidateCoupon = async (inputCode = couponCode) => {
    // Ensure inputCode is a string (handle when it's called with an event object)
    const codeValue =
      typeof inputCode === "string"
        ? inputCode
        : inputCode?.target?.value || couponCode || "";
    const code = codeValue.trim();

    console.log("🎫 VALIDATE COUPON:", {
      inputCode: code,
      totalPrice,
      selectedServices: selectedServicePayload,
    });

    if (!code) {
      setCouponError("Enter coupon code or select an offer");
      return false;
    }

    if (totalPrice === 0) {
      setCouponError("Select services first");
      return false;
    }

    const matchedCoupon = availableCoupons.find(
      (coupon) => normalizeLookup(coupon.code) === normalizeLookup(code),
    );
    const matchedOffer = availableOffers.find(
      (offer) => normalizeLookup(offer.title) === normalizeLookup(code),
    );

    if (matchedCoupon) {
      const criteriaError = getCouponCriteriaError(matchedCoupon);
      if (criteriaError) {
        setCouponError(criteriaError);
        setCouponValidated(false);
        setSelectedOffer(null);
        setDiscountData({
          discountPercentage: 0,
          discountAmount: 0,
          finalAmount: 0,
        });
        return false;
      }
    } else if (matchedOffer) {
      const criteriaError = getOfferCriteriaError(matchedOffer);
      if (criteriaError) {
        setCouponError(criteriaError);
        setCouponValidated(false);
        setSelectedOffer(null);
        setDiscountData({
          discountPercentage: 0,
          discountAmount: 0,
          finalAmount: 0,
        });
        return false;
      }
    } else {
      setCouponError("Select a valid coupon or offer from the list");
      setCouponValidated(false);
      setSelectedOffer(null);
      setDiscountData({
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: 0,
      });
      return false;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const res = await api.post("/api/coupons/validate-discount", {
        code,
        totalAmount: totalPrice,
        selectedServices: selectedServicePayload,
      });

      console.log("✅ Validation response:", res.data);

      if (res.data.success) {
        const appliedCode = res.data.data.code || code;
        const discount = Number(res.data.data.discount) || 0;
        const discountAmount = Number(res.data.data.discountAmount) || 0;
        const apiResponseFinalAmount = Number(res.data.data.finalAmount) || 0;

        // ✅ CRITICAL: Always recalculate final amount to ensure correctness
        // finalAmount must = totalPrice - discountAmount (never applicableAmount - discountAmount)
        const correctFinalAmount = totalPrice - discountAmount;

        console.log("💰 FINAL PRICE VALIDATION:", {
          totalPrice,
          discountAmount,
          apiResponseFinalAmount,
          correctCalculatedFinal: correctFinalAmount,
          match: apiResponseFinalAmount === correctFinalAmount,
        });

        setCouponCode(appliedCode);
        setDiscountData({
          type: res.data.type,
          discountPercentage: discount,
          discountAmount: Math.max(0, discountAmount),
          finalAmount: Math.max(0, correctFinalAmount), // ✅ Use calculated value, not API response
          applicableAmount:
            Number(res.data.data.applicableAmount) || totalPrice,
          appliedServices: res.data.data.appliedServices || [],
        });
        setCouponValidated(true);
        setSelectedOffer(
          res.data.type === "offer"
            ? availableOffers.find(
                (offer) =>
                  normalizeLookup(offer.title) === normalizeLookup(appliedCode),
              ) || null
            : null,
        );
        const discountType = res.data.type === "coupon" ? "Coupon" : "Offer";
        console.log(
          `✨ ${discountType} applied! Save ₹${res.data.data.discountAmount}`,
        );
        toast.success(
          `${discountType} applied! Save ₹${res.data.data.discountAmount}`,
        );
      }
      return Boolean(res.data.success);
    } catch (err) {
      const msg = err.response?.data?.message;
      console.error("❌ Validation failed:", {
        message: msg,
        error: err.response?.data,
      });
      setCouponError(msg || "Invalid coupon code or offer");
      setCouponValidated(false);
      setSelectedOffer(null);
      setDiscountData({
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: 0,
      });
      toast.error(msg || "Validation failed");
      return false;
    } finally {
      setCouponLoading(false);
    }

    return false;
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponValidated(false);
    setCouponError("");
    setSelectedOffer(null);
    setDiscountData({
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    });
    toast.success("Coupon/Offer removed");
  };

  const handleSelectCoupon = async (coupon) => {
    if (totalPrice === 0) {
      toast.error("Select services first");
      return;
    }

    setSelectedOffer(null);
    setCouponCode(coupon.code);
    setCouponError("");
    await handleValidateCoupon(coupon.code);
  };

  const handleSelectOffer = async (offer) => {
    if (totalPrice === 0) {
      toast.error("Select services first");
      return;
    }
    setSelectedOffer(offer);
    setCouponCode(offer.title);
    setCouponValidated(false);
    setCouponError("");
    setDiscountData({
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    });
    await handleValidateCoupon(offer.title);
  };

  const handleSelectDiscountOption = async (e) => {
    const optionKey = e.target.value;
    if (!optionKey) {
      return;
    }

    const selectedOption = activeDiscountOptions.find(
      (option) => option.key === optionKey,
    );

    if (!selectedOption) {
      return;
    }

    if (selectedOption.type === "coupon") {
      await handleSelectCoupon(selectedOption.item);
      return;
    }

    await handleSelectOffer(selectedOption.item);
  };

  const validateForm = () => {
    // clear previous errors
    setFormErrors({});

    if (!formData.stylist?.trim()) {
      setFormErrors((prev) => ({ ...prev, stylist: "Stylist is required" }));
      toast.error("❌ Please select a stylist to proceed");
      return false;
    }
    if (!formData.email?.trim()) {
      setFormErrors((prev) => ({ ...prev, email: "Email is required" }));
      toast.error("Enter email");
      return false;
    }
    if (!emailVerified) {
      toast.error("Verify your email first");
      return false;
    }
    if (selectedServices.length === 0) {
      toast.error("Select at least one service");
      return false;
    }
    if (!formData.customerName) {
      toast.error("Enter customer name");
      return false;
    }
    if (!formData.phone) {
      toast.error("Enter phone number");
      return false;
    }
    if (!formData.date) {
      toast.error("Select date");
      return false;
    }
    if (!formData.time) {
      toast.error("Select time");
      return false;
    }
    return true;
  };

  const syncVerifiedPaymentState = (orderId, paymentSessionId = null) => {
    if (!orderId) return null;

    const verifiedPaymentState = {
      orderId,
      paymentSessionId:
        paymentSessionId ?? paymentData.paymentSessionId ?? null,
      paymentVerified: true,
    };

    localStorage.setItem(
      "bookingPaymentData",
      JSON.stringify(verifiedPaymentState),
    );
    localStorage.setItem("bookingPaymentCompleted", JSON.stringify(true));
    localStorage.removeItem("bookingPaymentInProgress");

    setPaymentData(verifiedPaymentState);
    setPaymentCompleted(true);

    return verifiedPaymentState;
  };

  const verifyPaidOrder = async (orderId, attempts = 3) => {
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const res = await api.post("/api/payment/verify-order", { orderId });

        if (res.data?.verified) {
          return res.data;
        }

        lastError = new Error("Payment not verified yet");
      } catch (error) {
        lastError = error;
      }

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    throw lastError || new Error("Unable to verify payment");
  };

  // Handle online payment via Cashfree
  const handleOnlinePayment = async () => {
    // ✅ SDK check (IMPORTANT)
    if (!window.Cashfree) {
      toast.error("Payment gateway not loaded");
      return;
    }

    // ✅ VALIDATE AMOUNT
    if (!payableAmount || payableAmount <= 0) {
      toast.error("Invalid payment amount. Please check your booking details.");
      console.error("❌ Invalid payableAmount:", payableAmount);
      return;
    }

    try {
      // 1. Create order from backend
      const createOrderPayload = {
        amount: payableAmount,
        customer: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
        },
        clientOrigin: PAYMENT_RETURN_DOMAIN,
      };

      console.log("📤 Sending create-order request:", createOrderPayload);

      const res = await api.post(
        "/api/payment/create-order",
        createOrderPayload,
      );

      const { payment_session_id, order_id } = res.data;

      if (!payment_session_id || !order_id) {
        toast.error("Invalid payment response from server");
        console.error("❌ Missing payment_session_id or order_id:", res.data);
        return;
      }

      // ✅ ENSURE ALL BOOKING DATA IS SAVED TO LOCALSTORAGE (for PaymentSuccess page)
      console.log(
        "💾 Saving all booking data to localStorage before Cashfree opens...",
      );
      localStorage.setItem("bookingFormData", JSON.stringify(formData));
      localStorage.setItem(
        "bookingSelectedServices",
        JSON.stringify(selectedServices),
      );
      localStorage.setItem("bookingCouponCode", couponCode);
      localStorage.setItem(
        "bookingCouponValidated",
        JSON.stringify(couponValidated),
      );
      localStorage.setItem(
        "bookingEmailVerified",
        JSON.stringify(emailVerified),
      );
      localStorage.setItem("bookingDiscountData", JSON.stringify(discountData));

      // ✅ SAVE PAYMENT STATE TO LOCALSTORAGE BEFORE CASHFREE OPENS
      // This ensures state persists even if user is redirected
      const paymentState = {
        orderId: order_id,
        paymentSessionId: payment_session_id,
        paymentVerified: false,
      };

      console.log(
        "💾 PRE-SAVING payment state to localStorage (before Cashfree opens):",
        paymentState,
      );
      localStorage.setItem("bookingPaymentData", JSON.stringify(paymentState));
      localStorage.setItem("bookingPaymentInProgress", JSON.stringify(true));

      // ALSO UPDATE STATE
      setPaymentData(paymentState);

      // 2. Initialize Cashfree
      const cashfree = window.Cashfree({
        mode: "sandbox", // change to production later
      });

      // 3. Open payment UI with callbacks
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        onSuccess: async (data) => {
          console.log("✅ Payment successful (callback fired):", data);
          console.log("🔐 Setting payment as verified with orderId:", order_id);
          toast.success("Payment successful. Verifying booking...");
          // Close the modal
          setShowQR(false);
          await submitPaidBooking(order_id, payment_session_id);
        },
        onFailure: (data) => {
          console.error("Payment failed:", data);
          toast.error("Payment failed. Please try again.");
          localStorage.removeItem("bookingPaymentInProgress");
          localStorage.removeItem("bookingPaymentCompleted");
          localStorage.removeItem("bookingPaymentData");
          setPaymentCompleted(false);
          setPaymentData({
            orderId: null,
            paymentSessionId: null,
            paymentVerified: false,
          });
        },
        onClose: () => {
          console.log("Payment checkout closed");
        },
      });
    } catch (err) {
      console.error("❌ Payment initialization error:", {
        message: err.message,
        status: err?.response?.status,
        responseData: err?.response?.data,
        config: {
          url: err?.config?.url,
          method: err?.config?.method,
        },
      });
      localStorage.removeItem("bookingPaymentInProgress");
      const errorMsg =
        err?.response?.data?.error ||
        err.message ||
        "Payment failed to initialize";
      toast.error(errorMsg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🔘 Form submitted - checking state:", {
      paymentCompleted,
      paymentVerified: paymentData.paymentVerified,
      orderId: paymentData.orderId,
    });

    // ✅ IF PAYMENT WAS COMPLETED, SUBMIT WITH PAYMENT DETAILS (SKIP NORMAL VALIDATION)
    if (
      paymentCompleted &&
      paymentData.paymentVerified &&
      paymentData.orderId
    ) {
      console.log(
        "✅ Submitting paid booking with orderId:",
        paymentData.orderId,
      );
      await submitPaidBooking(
        paymentData.orderId,
        paymentData.paymentSessionId,
      );
      // Note: resetForm will be called after successful booking
      return;
    }

    // Otherwise, validate form normally
    if (!validateForm()) return;

    // If online → proceed with payment
    if (formData.mode === "online") {
      await handleOnlinePayment();
      return;
    }

    // Offline → submit directly
    await submitBooking(null, false);
  };

  const submitBooking = async (orderId, isPaymentVerified) => {
    try {
      setQrLoading(true);

      // ✅ VALIDATE REQUIRED FIELDS BEFORE SUBMISSION
      if (!selectedServices || selectedServices.length === 0) {
        toast.error("Please select at least one service");
        setQrLoading(false);
        return;
      }

      if (!formData.customerName?.trim()) {
        toast.error("Please enter customer name");
        setQrLoading(false);
        return;
      }

      if (!formData.phone?.trim()) {
        toast.error("Please enter phone number");
        setQrLoading(false);
        return;
      }

      if (!formData.email?.trim()) {
        toast.error("Please enter email");
        setQrLoading(false);
        return;
      }

      // ✅ EMAIL VERIFICATION CHECK (required for database OTP validation on backend)
      if (!emailVerified) {
        toast.error("Please verify your email first");
        setQrLoading(false);
        return;
      }

      if (!formData.date) {
        toast.error("Please select date");
        setQrLoading(false);
        return;
      }

      if (!formData.time) {
        toast.error("Please select time");
        setQrLoading(false);
        return;
      }

      const bookingPayload = {
        // ensure services payload matches API expectations
        selectedServices: selectedServices.map((s) => ({
          ...s,
          serviceName: getServiceName(s),
        })),
        ...formData,
        couponCode: couponValidated ? couponCode.trim() : null,
      };

      // ✅ ADD PAYMENT DETAILS IF ONLINE PAYMENT
      if (formData.mode === "online" && isPaymentVerified && orderId) {
        bookingPayload.paymentVerified = true;
        bookingPayload.orderId = orderId;
      }

      console.log("Submitting booking:", bookingPayload);

      const res = await api.post("/api/bookings", bookingPayload);

      console.log("Booking response:", res.data);

      if (res.data.ok) {
        toast.success(
          formData.mode === "online" && isPaymentVerified
            ? "Booking saved successfully."
            : formData.mode === "online"
              ? "Booking submitted! Admin will verify your payment."
              : "Booking confirmed! Pay at salon 💇",
        );
        resetForm();
        setShowQR(false);
        // Reset payment data
        setPaymentData({
          orderId: null,
          paymentSessionId: null,
          paymentVerified: false,
        });
        paymentSubmissionRef.current = { orderId: null, inFlight: false };
        const redirectPath =
          formData.mode === "online" && isPaymentVerified
            ? `/booking?order_id=${orderId}`
            : "/booking";
        const redirectDelay =
          formData.mode === "online" && isPaymentVerified ? 1200 : 2000;

        setTimeout(() => navigate(redirectPath), redirectDelay);
        return true;
      } else {
        toast.error(res.data.message || "Booking creation failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      console.error("submitBooking error:", err);
      toast.error(msg || "Booking failed. Try again.");
    } finally {
      setQrLoading(false);
    }

    return false;
  };

  const submitPaidBooking = async (orderId, paymentSessionId = null) => {
    if (!orderId) return false;

    if (
      paymentSubmissionRef.current.inFlight &&
      paymentSubmissionRef.current.orderId === orderId
    ) {
      return false;
    }

    paymentSubmissionRef.current = {
      orderId,
      inFlight: true,
    };

    try {
      await verifyPaidOrder(orderId);
    } catch (error) {
      console.error("verifyPaidOrder error:", error);
      toast.error(
        "Payment verification failed. Please wait a moment and try again.",
      );
      paymentSubmissionRef.current = {
        orderId: null,
        inFlight: false,
      };
      return false;
    }

    syncVerifiedPaymentState(orderId, paymentSessionId);

    const success = await submitBooking(orderId, true);

    if (!success) {
      paymentSubmissionRef.current = {
        orderId: null,
        inFlight: false,
      };
    }

    return success;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedOrderId = params.get("order_id");

    if (!returnedOrderId) {
      return;
    }

    console.log(
      "🔄 Payment redirect detected on booking page. Saving booking for order:",
      returnedOrderId,
    );

    void submitPaidBooking(returnedOrderId, paymentData.paymentSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setSelectedServices([]);
    setEmailVerified(false);
    setOtpCode("");
    setSelectedOffer(null);
    setCouponCode("");
    setCouponValidated(false);
    setCouponError("");
    setDiscountData({
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 0,
    });
    setDateDisplay("");
    setFormData({
      stylist: "",
      customerName: "",
      phone: "",
      email: "",
      date: "",
      time: "",
      mode: "offline",
    });
    // ✅ RESET PAYMENT STATES
    setPaymentData({
      orderId: null,
      paymentSessionId: null,
      paymentVerified: false,
    });
    setPaymentCompleted(false);

    // ✅ CLEAR ALL LOCALSTORAGE DATA
    localStorage.removeItem("bookingFormData");
    localStorage.removeItem("bookingSelectedServices");
    localStorage.removeItem("bookingCouponCode");
    localStorage.removeItem("bookingCouponValidated");
    localStorage.removeItem("bookingEmailVerified");
    localStorage.removeItem("bookingDiscountData");
    localStorage.removeItem("bookingPaymentData");
    localStorage.removeItem("bookingPaymentCompleted");
    localStorage.removeItem("bookingPaymentInProgress");
  };

  return (
    <div className="flex items-center justify-center min-h-screen pl-55 bg-black">
      <div className="bg-zinc-900 p-6 rounded-xl w-[420px] text-white">
        <h2 className="text-2xl text-center mb-5 font-semibold">New Booking</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SERVICE SELECT */}
          <select
            name="service"
            onChange={handleChange}
            className="w-full bg-black border border-zinc-700 p-2 rounded text-white"
          >
            <option value="">Select Service</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.serviceName} ₹{s.price}
              </option>
            ))}
          </select>
          {selectedServices.map((s) => (
            <div
              key={s._id}
              className="flex justify-between text-sm bg-zinc-800 px-3 py-2 rounded"
            >
              <span>
                {s.serviceName} ₹{s.price}
              </span>
              <button
                type="button"
                onClick={() => removeService(s._id)}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          ))}

          {selectedServices.length > 0 && (
            <div className="text-right text-purple-400 font-medium">
              Total: ₹{totalPrice}
            </div>
          )}

          {/* COUPON SECTION */}
          {selectedServices.length > 0 && (
            <div className="bg-zinc-800 p-4 rounded border border-zinc-700 space-y-3">
              <div className="text-sm text-zinc-300 font-semibold">
                Apply Offer/Coupon
              </div>

              {!couponValidated ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Select coupon or offer"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError("");
                      }}
                      className="flex-1 bg-black border border-zinc-700 p-2 rounded text-white placeholder-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 rounded text-white font-semibold transition-colors"
                    >
                      {couponLoading ? "Checking..." : "Apply"}
                    </button>
                    {discountData.type === "offer" &&
                      discountData.appliedServices?.length > 0 && (
                        <p className="text-xs text-blue-300 mt-1">
                          Offer applied only on:{" "}
                          {discountData.appliedServices.join(", ")}
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-400 font-semibold">
                      Choose From Dropdown
                    </label>
                    <select
                      value={selectedDiscountOptionValue}
                      onChange={handleSelectDiscountOption}
                      disabled={
                        couponLoading ||
                        totalPrice === 0 ||
                        activeDiscountOptions.length === 0
                      }
                      className="w-full bg-black border border-zinc-700 p-2 rounded text-white disabled:text-zinc-500"
                    >
                      <option value="">
                        {totalPrice === 0
                          ? "Select services first"
                          : activeDiscountOptions.length > 0
                            ? "Choose active offer or coupon"
                            : "No active offer or coupon available"}
                      </option>
                      {activeDiscountOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-zinc-400">
                      When you select from the dropdown, the offer/coupon will
                      be automatically applied.
                    </p>
                  </div>

                  {/* Available Coupons & Offers Section - Always Show */}
                  {(availableCoupons.length > 0 ||
                    availableOffers.length > 0) && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-300">
                          ✅ Click to Apply: Available Coupons & Offers
                        </p>
                        <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">
                          {availableCoupons.length + availableOffers.length}{" "}
                          options
                        </span>
                      </div>

                      {/* Eligible Coupons */}
                      {availableCoupons.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-purple-300 font-semibold">
                            🎫 Coupons:
                          </p>
                          {availableCoupons.map((coupon) => (
                            <button
                              key={`coupon-${coupon._id}`}
                              type="button"
                              onClick={() => handleSelectCoupon(coupon)}
                              className="w-full text-left px-2 py-1.5 text-xs bg-purple-900 hover:bg-purple-700 rounded text-purple-100 hover:text-white transition-colors border border-purple-700 hover:border-purple-500"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-purple-300">
                                    {coupon.code}
                                  </span>
                                  <span className="text-purple-200 ml-2">
                                    Save {coupon.discount}%
                                  </span>
                                </div>
                                {coupon.minAmount > 0 && (
                                  <span className="text-xs text-purple-400 bg-purple-800 px-1.5 py-0.5 rounded">
                                    Min: ₹{coupon.minAmount}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Eligible Offers */}
                      {availableOffers.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-green-300 font-semibold">
                            🎁 Offers:
                          </p>
                          {availableOffers.map((offer) => {
                            const error = getOfferCriteriaError(offer);
                            return (
                              <button
                                key={`offer-${offer._id}`}
                                type="button"
                                onClick={() =>
                                  !error && handleSelectOffer(offer)
                                }
                                disabled={!!error}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors border ${
                                  error
                                    ? "bg-zinc-700 border-zinc-600 text-zinc-400 cursor-not-allowed opacity-50"
                                    : "bg-green-900 hover:bg-green-700 border-green-700 hover:border-green-500 text-green-100 hover:text-white"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-bold text-green-300">
                                      {offer.title}
                                    </span>
                                    <span className="text-green-200 ml-2">
                                      Save {offer.discount}%
                                    </span>
                                  </div>
                                  {offer.services?.length > 0 && (
                                    <span className="text-xs text-green-400 bg-green-800 px-1.5 py-0.5 rounded">
                                      {offer.services.slice(0, 2).join(", ")}
                                      {offer.services.length > 2 ? "..." : ""}
                                    </span>
                                  )}
                                </div>
                                {error && (
                                  <p className="text-xs text-red-300 mt-1">
                                    ❌ {error}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-900 border border-green-700 p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="text-green-400 font-semibold">
                      ✓ {couponCode} Applied
                    </p>
                    <p className="text-sm text-green-300">
                      Save ₹{discountData.discountAmount}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <div className="bg-red-950 border border-red-700 p-3 rounded text-sm">
                  <p className="text-red-300 font-semibold mb-2">
                    ⚠️ {couponError}
                  </p>
                  <p className="text-red-200 text-xs">
                    💡 Tip: Click on a coupon or offer from the list below to
                    apply it automatically
                  </p>
                </div>
              )}

              {couponValidated && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-300">
                    <span>Subtotal:</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  {discountData.type === "offer" &&
                    discountData.applicableAmount > 0 &&
                    discountData.applicableAmount < totalPrice && (
                      <div className="flex justify-between text-blue-300">
                        <span>Offer Applied On:</span>
                        <span>₹{discountData.applicableAmount}</span>
                      </div>
                    )}
                  <div className="flex justify-between text-red-400">
                    <span>Discount ({discountData.discountPercentage}%):</span>
                    <span>-₹{discountData.discountAmount}</span>
                  </div>
                  <div className="border-t border-zinc-600 pt-2 flex justify-between font-semibold text-green-400">
                    <span>Final Price:</span>
                    <span>₹{discountData.finalAmount}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMER INFO */}
          <input
            name="customerName"
            placeholder="Customer Name"
            value={formData.customerName}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
          />

          {/* Email + OTP (email only) */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={`flex-1 border ${
                  formErrors.email ? "border-red-500" : "border-gray-300"
                } rounded-md px-4 py-3 bg-[#000000]`}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={sendOtpEmail}
                  disabled={otpLoading || otpCooldown > 0}
                  className="px-3 py-2 bg-[#4C0099] rounded text-white font-semibold"
                >
                  {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : "Send OTP"}
                </button>
                {otpCooldown > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCooldown(0);
                      setOtpCode("");
                      setEmailVerified(false);
                      toast("OTP cancelled", { icon: "⚠️" });
                    }}
                    className="px-2 py-2 border rounded text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}

            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 bg-000000"
              />
              <button
                type="button"
                onClick={verifyOtpEmail}
                disabled={otpLoading || !otpCode}
                className={`px-3 py-2 rounded text-white ${
                  emailVerified ? "bg-purple-900" : "bg-purple-900"
                }`}
              >
                {emailVerified ? "Verified" : "Verify"}
              </button>
            </div>
            {otpCooldown > 0 && !emailVerified && (
              <p className="text-sm text-slate-500 mt-2">
                OTP sent — please check your inbox. Expires in {otpCooldown}s.
              </p>
            )}
          </div>

          {emailVerified && (
            <p className="text-green-400 text-sm">✅ Email verified</p>
          )}

          {/* DATE & TIME */}
          <div className="space-y-3">
            {/* DATE INPUT - CALENDAR PICKER */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Booking Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={handleDateInput}
                min={getTodayDate()}
                className="w-full p-2 bg-black border border-zinc-700 rounded text-white cursor-pointer"
                style={{
                  colorScheme: "dark",
                }}
              />
              {formData.date && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ {formatDateToDisplay(formData.date)}
                </p>
              )}
            </div>

            {/* TIME INPUT */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Booking Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full p-2 bg-black border border-zinc-700 rounded text-white"
              />
            </div>
          </div>

          {/* STYLIST */}
          {stylists.length > 0 ? (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Select Stylist
              </label>
              <select
                name="stylist"
                value={formData.stylist}
                onChange={handleChange}
                className={`w-full bg-black border p-2 rounded text-white ${
                  formErrors.stylist ? "border-red-500" : "border-zinc-700"
                }`}
              >
                <option value="">-- Choose a Stylist --</option>
                {stylists.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name}
                  </option>
                ))}
              </select>
              {formErrors.stylist && (
                <p className="text-red-500 text-sm mt-1">
                  {formErrors.stylist}
                </p>
              )}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">No stylist available</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, mode: "offline" })}
              className={`flex-1 py-2 rounded border transition-all ${
                formData.mode === "offline"
                  ? "bg-gray-600 border-gray-400 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-gray-500"
              }`}
            >
              💵 Pay After
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, mode: "online" })}
              className={`flex-1 py-2 rounded border transition-all ${
                formData.mode === "online"
                  ? "bg-green-700 border-green-500 text-white"
                  : "bg-transparent border-zinc-700 text-zinc-400 hover:border-green-700"
              }`}
            >
              📱 Pay Online (UPI)
            </button>
          </div>

          {formData.mode === "online" && (
            <p className="text-xs text-zinc-400 text-center">
              A QR code will appear — scan & pay, then submit your booking.
            </p>
          )}

          {/* ✅ SHOW SUCCESS MESSAGE AFTER PAYMENT */}
          {paymentCompleted && paymentData.paymentVerified && (
            <div className="bg-green-900 border border-green-600 p-3 rounded text-center">
              <p className="text-green-300 font-semibold">
                ✅ Payment Successful!
              </p>
              <p className="text-xs text-green-200 mt-1">
                Click "Add Booking" to confirm your booking
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={qrLoading}
            className={`w-full py-3 rounded font-semibold transition-colors ${
              // Show green "Add Booking" if payment is verified
              paymentCompleted && paymentData.paymentVerified
                ? "bg-green-600 hover:bg-green-500 text-white"
                : // Show purple "Proceed to Pay" if online mode
                  formData.mode === "online"
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : // Otherwise show purple "Add Booking" for offline
                    "bg-purple-600 hover:bg-purple-500 text-white"
            }`}
          >
            {qrLoading
              ? "Saving Booking..."
              : paymentCompleted && paymentData.paymentVerified
                ? "Saving Paid Booking..."
                : formData.mode === "online"
                  ? "Proceed to Pay →"
                  : "Add Booking"}
          </button>
        </form>
      </div>
      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-[360px] text-white text-center shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-1">Scan & Pay</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Pay{" "}
              <span className="text-green-400 font-bold text-lg">
                ₹{payableAmount}
              </span>{" "}
              using any UPI app
            </p>
            {/* QR CODE */}
            <div className="bg-white p-3 rounded-xl inline-block mb-4">
              <img
                src={ADMIN_QR_URL}
                alt="UPI QR Code"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                style={{ display: "none" }}
                className="w-48 h-48 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-600 text-sm"
              >
                <span className="text-3xl mb-2">📷</span>
                <span>Add QR image</span>
                <span className="text-xs mt-1">at /public/upi-qr.png</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-6">
              After payment, click the button below to confirm your booking.
              Admin will verify within a few minutes.
            </p>

            {/* Steps */}
            <div className="text-left bg-zinc-800 rounded-lg p-3 mb-6 space-y-1 text-sm text-zinc-300">
              <p>1️⃣ Open PhonePe / GPay / Paytm</p>
              <p>2️⃣ Scan this QR code</p>
              <p>3️⃣ Pay ₹{payableAmount}</p>
              <p>4️⃣ Click "I've Paid" below</p>
            </div>

            {/* Confirm button */}
            <button
              onClick={submitBooking}
              disabled={qrLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900 py-3 rounded-lg font-semibold transition-colors"
            >
              {qrLoading ? "Submitting..." : "✅ I've Paid — Confirm Booking"}
            </button>

            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-sm py-2"
            >
              Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;
