import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

function Attendance() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStylist, setSelectedStylist] = useState(null);
  const [customerList, setCustomerList] = useState([]);

  const [shopStartTime, setShopStartTime] = useState(() => {
    return localStorage.getItem("shopStartTime") || "10:00";
  });

  const getLocalDateStr = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  };

  const todayStr = getLocalDateStr();

  useEffect(() => {
    localStorage.setItem("shopStartTime", shopStartTime);
  }, [shopStartTime]);

  // format time
  const formatTime = (isoTime) => {
    if (!isoTime) return "--";
    return new Date(isoTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const markPresent = (stylistId) => {
    const nowISO = new Date().toISOString();

    localStorage.setItem(`attendance_${todayStr}_${stylistId}`, nowISO);
    localStorage.setItem(`attendance_status_${todayStr}_${stylistId}`, "full");

    setStylists((prev) =>
      prev.map((s) =>
        s._id === stylistId
          ? { ...s, checkInTime: nowISO, status: "full" }
          : s
      )
    );

    toast.success("Marked Full Day");
  };

  const markHalfDay = (stylistId) => {
    const nowISO = new Date().toISOString();

    localStorage.setItem(`attendance_${todayStr}_${stylistId}`, nowISO);
    localStorage.setItem(`attendance_status_${todayStr}_${stylistId}`, "half");

    setStylists((prev) =>
      prev.map((s) =>
        s._id === stylistId
          ? { ...s, checkInTime: nowISO, status: "half" }
          : s
      )
    );

    toast.success("Marked Half Day");
  };

  const markCheckout = (stylistId) => {
    const nowISO = new Date().toISOString();

    localStorage.setItem(`checkout_${todayStr}_${stylistId}`, nowISO);

    setStylists((prev) =>
      prev.map((s) =>
        s._id === stylistId
          ? { ...s, checkoutTime: nowISO }
          : s
      )
    );

    toast.success("Checkout time updated");
  };


  const clearLocalAttendance = () => {
  stylists.forEach((s) => {
    localStorage.removeItem(`attendance_${todayStr}_${s._id}`);
    localStorage.removeItem(`attendance_status_${todayStr}_${s._id}`);
    localStorage.removeItem(`checkout_${todayStr}_${s._id}`);
  });

  setStylists((prev) =>
    prev.map((s) => ({
      ...s,
      checkInTime: null,
      checkoutTime: null,
      status: null,
    }))
  );

  toast.success("Local attendance cleared");
};

  // Fetch data
  const fetchData = async () => {
    try {
      const [stylistRes, bookingRes] = await Promise.all([
        fetch("http://localhost:5000/api/stylists"),
        fetch("http://localhost:5000/api/bookings"),
      ]);

      const stylistData = await stylistRes.json();
      const bookingData = await bookingRes.json();

      const todaysBookings = bookingData.filter(
        (b) => b.date?.slice(0, 10) === todayStr
      );

      const bookingMap = {};
      todaysBookings.forEach((b) => {
        if (!bookingMap[b.stylist]) bookingMap[b.stylist] = [];
        bookingMap[b.stylist].push(b);
      });

      // const withAttendance = stylistData
      //   .filter((s) => s.status === "active")
      //   .map((s) => ({
      //     ...s,
      //     checkInTime: null,
      //     checkoutTime: null,
      //     status: null,
      //     customers: bookingMap[s._id]?.length || 0,
      //     bookings: bookingMap[s._id] || [],
      //   }));

     const withAttendance = stylistData
  .filter((s) => s.status === "active")
  .map((s) => {
    const savedCheckIn = localStorage.getItem(`attendance_${todayStr}_${s._id}`);
    const savedStatus = localStorage.getItem(`attendance_status_${todayStr}_${s._id}`);
    const savedCheckout = localStorage.getItem(`checkout_${todayStr}_${s._id}`);

    return {
      ...s,
      checkInTime: savedCheckIn || null,
      checkoutTime: savedCheckout || null,
      status: savedStatus || null,
      customers: bookingMap[s._id]?.length || 0,
      bookings: bookingMap[s._id] || [],
    };
  });

      setStylists(withAttendance);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCustomers = (stylist) => {
    setSelectedStylist(stylist);
    setCustomerList(stylist.bookings || []);
  };

  const saveAttendance = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stylists }),
      });

      if (!res.ok) throw new Error();
      toast.success("Attendance saved successfully");
    } catch {
      toast.error("Failed to save attendance");
    }
  };

  return (
    <div className="p-10 min-h-screen pl-80 bg-black">
      <h1 className="text-3xl font-semibold text-white mb-6">
        Stylist Attendance
      </h1>

      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 text-white">
        {loading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-300">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Check-in Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Checkout Time</th>
                <th className="py-3 px-4">Customers</th>
                <th className="py-3 px-4 flex justify-center gap-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {stylists.map((s) => (
                <tr key={s._id} className="border-b border-zinc-700">
                  <td className="py-3 px-4">{s.name}</td>

                  <td className="py-3 px-4 text-zinc-300">
                    {formatTime(s.checkInTime)}
                  </td>

                  <td className="py-3 px-4">
                    {!s.checkInTime ? (
                      <span className="px-2 py-1 rounded text-sm bg-zinc-600">
                        Absent
                      </span>
                    ) : s.status === "half" ? (
                      <span className="px-2 py-1 rounded text-sm bg-red-600">
                        Half Day
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-sm bg-green-600">
                        Full Day
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-zinc-300">
                    {formatTime(s.checkoutTime)}
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => openCustomers(s)}
                      className="underline text-purple-400"
                      disabled={s.customers === 0}
                    >
                      {s.customers}
                    </button>
                  </td>

                  <td className="py-3 px-4 flex gap-3">
 <button
  onClick={() => markPresent(s._id)}
  disabled={!!s.checkInTime}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition
    ${
      s.checkInTime
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-500"
    }`}
>
  {s.checkInTime ? "Present" : "Mark Present"}
</button>

<button
  onClick={() => markHalfDay(s._id)}
  disabled={s.status === "half"}
  className={`px-4 py-2 rounded-lg text-sm font-medium transition
    ${
      s.status === "half"
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-red-600 hover:bg-red-500"
    }`}
>
  {s.status === "half" ? "Half Day" : "Half Day"}
</button>                                                 
                    <button
                      onClick={() => markCheckout(s._id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 transition"
                    >
                      Checkout
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6">
          <button
            onClick={saveAttendance}
            className="bg-purple-700 px-6 py-2 rounded hover:bg-purple-600"
          >
            Save Attendance
          </button>
           <button
    onClick={clearLocalAttendance}
    className="bg-red-700 px-6 py-2 rounded hover:bg-red-600"
  >
    Clear Local Data
  </button>
        </div>
      </div>
    </div>
  );
}

export default Attendance;