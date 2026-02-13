// src/pages/Inventory.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";
import { ExportContext } from "../layout/ExportContext";
import {
  filterByDate,
  getAvailableYears,
  formatDisplayDate,
} from "../layout/dateFilterUtils";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = "http://localhost:5000";

const emptyForm = {
  name: "",
  category: "",
  brand: "",
  sku: "",
  unit: "pcs",
  stockQty: 0,
  costPrice: 0,
  salePrice: 0,
  reorderLevel: "",
  supplierName: "",
  notes: "",
  date: "",
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // form errors for validation
  const [formErrors, setFormErrors] = useState({});

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const resp = await axios.get(
        `${API_BASE}/api/inventory${showLowStockOnly ? "?lowStock=true" : ""}`
      );
      if (resp.data?.ok) {
        setItems(resp.data.items || []);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  // fetchInventory is intentionally excluded from deps to avoid re-creating the function each render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchInventory();
  }, [showLowStockOnly]);

  // Export & filtering: provide inventory rows for export, and set available years
  const { setExportData, filterType, filterValue, setAvailableYears } =
    useContext(ExportContext);

  const displayedItems = filterByDate(
    items || [],
    "date",
    filterType,
    filterValue
  );

  // totals for the currently displayed (date-filtered) items
  const totalItems = displayedItems.length;
  const totalStockValue = displayedItems.reduce(
    (sum, it) => sum + Number(it.costPrice || 0) * Number(it.stockQty || 0),
    0
  );

  useEffect(() => {
    const years = getAvailableYears(items || [], "date");
    setAvailableYears(years);
  }, [items, setAvailableYears]);

  const exportRowsInventory = useMemo(() => {
    return (displayedItems || []).map((it) => ({
      Item: it.name || "",
      Category: it.category || "",
      Brand: it.brand || "",
      Date: formatDisplayDate(it.date),
      Stock: `${it.stockQty ?? 0} ${it.unit || ""}`,
      Reorder: it.reorderLevel ?? "",
      Cost: it.costPrice ?? "",
      Supplier: it.supplierName || "",
    }));
  }, [displayedItems]);

  useEffect(() => {
    setExportData(exportRowsInventory);
  }, [exportRowsInventory, setExportData]);

  const handleChange = (field, value) => {
    // clear field-specific error on change
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      category: item.category || "",
      brand: item.brand || "",
      sku: item.sku || "",
      unit: item.unit || "pcs",
      stockQty: item.stockQty ?? 0,
      costPrice: item.costPrice ?? 0,
      salePrice: item.salePrice ?? 0,
      reorderLevel: item.reorderLevel ?? 0,
      supplierName: item.supplierName || "",
      notes: item.notes || "",
      date: item.date ? item.date.slice(0, 10) : "",
    });
    setFormErrors({});
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormErrors({});
  };

  // ============================
  // Validation: required fields (as requested)
  // - name, category, brand, unit, stockQty, costPrice, date, reorderLevel
  // Additional: stockQty must be a non-negative integer (whole number)
  // ============================
  const validateForm = () => {
    const errors = {};

    // name required
    if (!form.name || !form.name.trim()) {
      errors.name = "Item name is required";
    }

    // category required
    if (!form.category || !form.category.trim()) {
      errors.category = "Category is required";
    }

    // brand required
    if (!form.brand || !form.brand.trim()) {
      errors.brand = "Brand is required";
    }

    // unit required
    if (!form.unit || !String(form.unit).trim()) {
      errors.unit = "Unit is required";
    }

    // stockQty required and must be a number >= 0 and integer
    if (
      form.stockQty === "" ||
      form.stockQty === null ||
      form.stockQty === undefined
    ) {
      errors.stockQty = "Stock quantity is required";
    } else {
      const n = Number(form.stockQty);
      if (Number.isNaN(n) || !Number.isFinite(n)) {
        errors.stockQty = "Stock must be a number";
      } else if (n < 0) {
        errors.stockQty = "Stock cannot be negative";
      } else if (!Number.isInteger(n)) {
        errors.stockQty = "Stock must be a whole number";
      }
    }
    // costPrice required and must be >= 0
    if (
      form.costPrice === "" ||
      form.costPrice === null ||
      form.costPrice === undefined
    ) {
      errors.costPrice = "Cost price is required";
    } else {
      const n = Number(form.costPrice);
      if (Number.isNaN(n) || !Number.isFinite(n)) {
        errors.costPrice = "Cost price must be a number";
      } else if (n < 0) {
        errors.costPrice = "Cost price cannot be negative";
      }
    }

    // reorderLevel required and must be >= 0 (can be integer or float depending on your needs)
    if (
      form.reorderLevel === "" ||
      form.reorderLevel === null ||
      form.reorderLevel === undefined
    ) {
      errors.reorderLevel = "Reorder level is required";
    } else {
      const n = Number(form.reorderLevel);
      if (Number.isNaN(n) || !Number.isFinite(n)) {
        errors.reorderLevel = "Reorder level must be a number";
      } else if (n < 0) {
        errors.reorderLevel = "Reorder level cannot be negative";
      }
    }

    // date required and must be valid
    if (!form.date) {
      errors.date = "Date is required";
    } else {
      const d = new Date(form.date);
      if (isNaN(d.getTime())) {
        errors.date = "Please enter a valid date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // validate first
      if (!validateForm()) {
        setSaving(false);
        // focus the first invalid field (optional small UX improvement)
        const firstErrorKey = Object.keys(formErrors)[0];
        if (firstErrorKey) {
          const el = document.querySelector(`[name="${firstErrorKey}"]`);
          if (el) el.focus();
        }
        return;
      }

      const payload = {
        ...form,
        // ensure integer stockQty on submit
        stockQty: parseInt(form.stockQty, 10) || 0,
        costPrice: Number(form.costPrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
      };

      if (editingId) {
        await axios.put(`${API_BASE}/api/inventory/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE}/api/inventory`, payload);
      }
      await fetchInventory();
      resetForm();
    } catch (err) {
      console.error("Error saving item:", err);
      toast.error("Error saving item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`${API_BASE}/api/inventory/${id}`);
      await fetchInventory();
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Unable to delete item.");
    }
  };

  const isLowStock = (item) =>
    item.reorderLevel > 0 && item.stockQty <= item.reorderLevel;

  return (
    <div className="p-6  w-full pl-85 text-sm bg-black text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-purple-700">
            Track salon products, tools and supplies. Get alerted when stock is
            low.
          </p>
        </div>

        <button
          onClick={() => setShowLowStockOnly((prev) => !prev)}
          className={`px-4 py-2 rounded-md text-sm font-semibold border ${
            showLowStockOnly
              ? "bg-red-100 border-red-300 text-red-700"
              : "bg-[#4C0099]   text-white border-gray-700"
          }`}
        >
          {showLowStockOnly ? "Show All Items" : "Show Low Stock Only"}
        </button>
      </div>

      <div className="max-w-8xl mx-auto grid grid-cols-1  gap-6">
        {/* Form */}
        <div className="bg-black border rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Item" : "Add New Item"}
          </h2>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                Item Name *
              </label>
              <input
                name="name"
                type="text"
                className="w-full p-2 border rounded text-sm"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="L'Oréal Shampoo 500ml"
              />
              {formErrors.name && (
                <div className="text-red-500 text-sm mt-1">
                  {formErrors.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <input
                  name="category"
                  type="text"
                  className="w-full p-2 border rounded text-sm"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="Shampoo / Color / Tools"
                />
                {formErrors.category && (
                  <div className="text-red-500 text-sm mt-1">
                    {formErrors.category}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Brand *
                </label>
                <input
                  name="brand"
                  type="text"
                  className="w-full p-2 border rounded text-sm"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  placeholder="L'Oréal, Matrix, etc."
                />
                {formErrors.brand && (
                  <div className="text-red-500 text-sm mt-1">
                    {formErrors.brand}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  name="sku"
                  type="text"
                  className="w-full p-2 border rounded text-sm"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  placeholder="Internal code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit *</label>
                <select
                  name="unit"
                  className="w-full p-2 border rounded text-sm"
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                >
                  <option value="pcs">pcs</option>
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                  <option value="box">box</option>
                </select>
                {formErrors.unit && (
                  <div className="text-red-500 text-sm mt-1">
                    {formErrors.unit}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Stock Qty *
                </label>
                <input
                  name="stockQty"
                  type="number"
                  min="0"
                  step="1"
                  className="w-full p-2 border rounded text-xs"
                  value={form.stockQty}
                  onChange={(e) => handleChange("stockQty", e.target.value)}
                />
                {formErrors.stockQty && (
                  <div className="text-red-500 text-xs mt-1">
                    {formErrors.stockQty}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Cost Price *
                </label>
                <input
                  name="costPrice"
                  type="number"
                  className="w-full p-2 border rounded text-xs"
                  value={form.costPrice}
                  onChange={(e) => handleChange("costPrice", e.target.value)}
                  placeholder="per unit"
                />
                {formErrors.costPrice && (
                  <div className="text-red-500 text-sm mt-1">
                    {formErrors.costPrice}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Sale Price
                </label>
                <input
                  name="salePrice"
                  type="number"
                  className="w-full p-2 border rounded text-xs"
                  value={form.salePrice}
                  onChange={(e) => handleChange("salePrice", e.target.value)}
                  placeholder="optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Reorder Level *
                </label>
                <input
                  name="reorderLevel"
                  type="number"
                  className="w-full p-2 border rounded text-xs"
                  value={form.reorderLevel}
                  onChange={(e) => handleChange("reorderLevel", e.target.value)}
                  placeholder="Alert when below"
                />
                {formErrors.reorderLevel && (
                  <div className="text-red-500 text-xs mt-1">
                    {formErrors.reorderLevel}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  name="date"
                  type="date"
                  className="w-full p-2 border rounded text-sm"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
                {formErrors.date && (
                  <div className="text-red-500 text-xs mt-1">
                    {formErrors.date}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Supplier</label>
              <input
                name="supplierName"
                type="text"
                className="w-full p-2 border rounded text-xs"
                value={form.supplierName}
                onChange={(e) => handleChange("supplierName", e.target.value)}
                placeholder="Vendor name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Notes</label>
              <textarea
                name="notes"
                className="w-full p-2 border rounded text-xs"
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Usage notes, color code, etc."
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-s text-red-500 underline pl-235"
                >
                  Cancel edit
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#4C0099] hover:bg-yellow-500 text-sm font-semibold rounded text-white"
              >
                {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-black border rounded-lg p-5 shadow-sm w-286">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-base font-semibold">
                Inventory Items ({totalItems})
              </h2>
              <div className="text-sm text-gray-600">
                Total stock value: ₹{totalStockValue.toLocaleString()}
              </div>
            </div>
            {loading && (
              <span className="text-sm text-gray-400">Loading...</span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-gray-500 py-10 text-center">
              No items found. Add your first product on the left.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border">
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-center">Date</th>
                    <th className="px-3 py-2 text-center">Stock</th>
                    <th className="px-3 py-2 text-center">Reorder</th>
                    <th className="px-3 py-2 text-center">Cost</th>
                    <th className="px-3 py-2 text-center">Supplier</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="px-3 py-2">
                        <div className="font-semibold">{item.name}</div>
                        {item.sku && (
                          <div className="text-[10px] text-gray-500">
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {item.category || (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {item.brand || <span className="text-gray-400">—</span>}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {item.date ? (
                          formatDisplayDate(item.date)
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] ${
                            isLowStock(item)
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.stockQty} {item.unit}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.reorderLevel || (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.costPrice
                          ? `₹${Number(item.costPrice).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.supplierName || (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-2 py-1 text-blue-600 text-[15px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="px-2 py-1 border border-red-300 text-red-600 rounded text-[15px]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 py-2 font-semibold">Totals</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 text-center font-semibold">
                      {totalItems} items
                    </td>
                    <td className="px-3 py-2 text-center" />
                    <td className="px-3 py-2 text-center" />
                    <td className="px-3 py-2 text-center font-semibold">
                      ₹{totalStockValue.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center" />
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
