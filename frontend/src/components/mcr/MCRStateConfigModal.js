import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  X,
  Settings,
  MapPin,
  Check,
  Search,
  ToggleLeft,
  ToggleRight,
  Save,
  Loader2,
} from "lucide-react";

// All 50 states + DC + territories
const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "AS", name: "American Samoa" }, { code: "GU", name: "Guam" },
  { code: "MP", name: "N. Mariana Islands" },
  { code: "PR", name: "Puerto Rico" }, { code: "VI", name: "US Virgin Islands" },
];

/**
 * MCRStateConfigModal
 *
 * Modal for managing per-state MCR configuration:
 * - Toggle states active/inactive for MCR reporting
 * - Set state-specific NMLS license numbers
 * - Toggle supplemental form requirements
 *
 * Props:
 *   show        - boolean, controls visibility
 *   onClose     - function, called when modal closes
 *   configs     - array of existing MCRStateConfig docs
 *   onSave      - async function(stateCode, data), saves a single state config
 *   onRefresh   - function, reloads configs from backend
 */
const MCRStateConfigModal = ({ show, onClose, configs = [], onSave, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [editingState, setEditingState] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all"); // all | active | inactive

  // Build a lookup of stateCode → config
  const configMap = {};
  configs.forEach((c) => {
    configMap[c.stateCode] = c;
  });

  // Filter states
  const filteredStates = US_STATES.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "active") return configMap[s.code]?.isActive === true;
    if (filter === "inactive") return !configMap[s.code] || configMap[s.code]?.isActive === false;
    return true;
  });

  const activeCount = configs.filter((c) => c.isActive).length;

  const handleToggleActive = async (stateCode) => {
    const current = configMap[stateCode];
    const newActive = current ? !current.isActive : true;
    try {
      await onSave(stateCode, { isActive: newActive });
      toast.success(`${stateCode} ${newActive ? "activated" : "deactivated"} for MCR`);
      onRefresh?.();
    } catch (err) {
      toast.error(`Failed to update ${stateCode}`);
    }
  };

  const handleEditState = (stateCode) => {
    const current = configMap[stateCode] || {};
    setEditForm({
      nmlsLicenseNumber: current.nmlsLicenseNumber || "",
      isActive: current.isActive !== false,
      requiresSupplementalForm: current.requiresSupplementalForm || false,
    });
    setEditingState(stateCode);
  };

  const handleSaveEdit = async () => {
    if (!editingState) return;
    setSaving(true);
    try {
      await onSave(editingState, editForm);
      toast.success(`${editingState} config saved`);
      setEditingState(null);
      onRefresh?.();
    } catch (err) {
      toast.error("Failed to save state config");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">State MCR Configuration</h2>
              <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {activeCount} active
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              {["all", "active", "inactive"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md capitalize transition ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* State List */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {/* Edit Panel (inline) */}
            {editingState && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900 text-sm">
                    Edit {editingState} — {US_STATES.find((s) => s.code === editingState)?.name}
                  </h3>
                  <button
                    onClick={() => setEditingState(null)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      NMLS License #
                    </label>
                    <input
                      type="text"
                      value={editForm.nmlsLicenseNumber}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, nmlsLicenseNumber: e.target.value }))
                      }
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Active for MCR
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.requiresSupplementalForm}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            requiresSupplementalForm: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Requires Supplemental Form
                    </label>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1.5" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            )}

            {filteredStates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No states match your search.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredStates.map((state) => {
                  const config = configMap[state.code];
                  const isActive = config?.isActive === true;
                  const hasLicense = !!config?.nmlsLicenseNumber;

                  return (
                    <div
                      key={state.code}
                      className={`flex items-center justify-between p-3 rounded-lg transition ${
                        editingState === state.code
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggleActive(state.code)}
                          className="focus:outline-none"
                          title={isActive ? "Deactivate" : "Activate"}
                        >
                          {isActive ? (
                            <ToggleRight className="h-6 w-6 text-blue-600" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-300" />
                          )}
                        </button>

                        {/* State Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {state.code}
                            </span>
                            <span className="text-sm text-gray-500">{state.name}</span>
                          </div>
                          {hasLicense && (
                            <span className="text-xs text-gray-400">
                              NMLS# {config.nmlsLicenseNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                        {config?.requiresSupplementalForm && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Supp. Form
                          </span>
                        )}
                        <button
                          onClick={() => handleEditState(state.code)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Edit state config"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {filteredStates.length} state{filteredStates.length !== 1 ? "s" : ""} shown
              {" · "}
              {activeCount} active for MCR reporting
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCRStateConfigModal;
