"use client";
import React, { useState, useEffect } from "react";
import { Input, Button } from "../../components/HeroUIComponents";

/**
 * ProfileForm - Form for creating/editing radar profile
 * @param {Object} props
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onSubmit - Callback with form data
 * @param {boolean} props.loading - Loading state
 */
export default function ProfileForm({ initialData, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    role: initialData?.role || "",
    industry: initialData?.industry || "",
    productFocus: initialData?.productFocus || "",
    audience: initialData?.audience || "",
    geography: initialData?.geography || [],
    priorities: initialData?.priorities || [],
    avoid: initialData?.avoid || [],
  });

  // Sync when initialData changes (e.g., AI prefill)
  useEffect(() => {
    if (initialData) {
      setFormData({
        role: initialData.role || "",
        industry: initialData.industry || "",
        productFocus: initialData.productFocus || "",
        audience: initialData.audience || "",
        geography: Array.isArray(initialData.geography)
          ? initialData.geography
          : initialData.geography
          ? [initialData.geography]
          : [],
        priorities: Array.isArray(initialData.priorities)
          ? initialData.priorities
          : initialData.priorities
          ? [initialData.priorities]
          : [],
        avoid: Array.isArray(initialData.avoid)
          ? initialData.avoid
          : initialData.avoid
          ? [initialData.avoid]
          : [],
      });
    }
  }, [initialData]);

  const [newGeography, setNewGeography] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [newAvoid, setNewAvoid] = useState("");

  const handleAddGeography = () => {
    if (
      newGeography.trim() &&
      !formData.geography.includes(newGeography.trim())
    ) {
      setFormData({
        ...formData,
        geography: [...formData.geography, newGeography.trim()],
      });
      setNewGeography("");
    }
  };

  const handleRemoveGeography = (item) => {
    setFormData({
      ...formData,
      geography: formData.geography.filter((g) => g !== item),
    });
  };

  const handleAddPriority = () => {
    if (
      newPriority.trim() &&
      !formData.priorities.includes(newPriority.trim())
    ) {
      setFormData({
        ...formData,
        priorities: [...formData.priorities, newPriority.trim()],
      });
      setNewPriority("");
    }
  };

  const handleRemovePriority = (item) => {
    setFormData({
      ...formData,
      priorities: formData.priorities.filter((p) => p !== item),
    });
  };

  const handleAddAvoid = () => {
    if (newAvoid.trim() && !formData.avoid.includes(newAvoid.trim())) {
      setFormData({
        ...formData,
        avoid: [...formData.avoid, newAvoid.trim()],
      });
      setNewAvoid("");
    }
  };

  const handleRemoveAvoid = (item) => {
    setFormData({
      ...formData,
      avoid: formData.avoid.filter((a) => a !== item),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Role *
        </label>
        <Input
          type="text"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., Product Manager, Engineer, Designer"
          required
        />
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Industry *
        </label>
        <Input
          type="text"
          value={formData.industry}
          onChange={(e) =>
            setFormData({ ...formData, industry: e.target.value })
          }
          placeholder="e.g., EdTech, Healthcare, Retail"
          required
        />
      </div>

      {/* Product Focus */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Product Focus
        </label>
        <Input
          type="text"
          value={formData.productFocus}
          onChange={(e) =>
            setFormData({ ...formData, productFocus: e.target.value })
          }
          placeholder="e.g., Interactive content, SaaS platform"
        />
      </div>

      {/* Audience */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Audience *
        </label>
        <Input
          type="text"
          value={formData.audience}
          onChange={(e) =>
            setFormData({ ...formData, audience: e.target.value })
          }
          placeholder="e.g., US high school, Enterprise B2B"
          required
        />
      </div>

      {/* Geography */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Geography
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newGeography}
            onChange={(e) => setNewGeography(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddGeography();
              }
            }}
            placeholder="Add geography (e.g., United States)"
          />
          <Button type="button" onClick={handleAddGeography} className="px-4">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.geography.map((geo, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
            >
              {geo}
              <button
                type="button"
                onClick={() => handleRemoveGeography(geo)}
                className="ml-2 text-accent-blue hover:opacity-80"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Priorities */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Topics to Prioritize *
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPriority();
              }
            }}
            placeholder="Add priority topic"
          />
          <Button type="button" onClick={handleAddPriority} className="px-4">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.priorities.map((priority, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-emerald-500/20 text-stone-200 border border-emerald-500/30"
            >
              {priority}
              <button
                type="button"
                onClick={() => handleRemovePriority(priority)}
                className="ml-2 text-emerald-300 hover:text-emerald-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Avoid */}
      <div>
        <label className="block text-sm font-medium text-stone-200 mb-2">
          Topics to Avoid
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={newAvoid}
            onChange={(e) => setNewAvoid(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAvoid();
              }
            }}
            placeholder="Add topic to avoid"
          />
          <Button type="button" onClick={handleAddAvoid} className="px-4">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.avoid.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-red-500/20 text-stone-200 border border-red-500/30"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveAvoid(item)}
                className="ml-2 text-red-300 hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={
            loading ||
            !formData.role ||
            !formData.industry ||
            !formData.audience ||
            formData.priorities.length === 0
          }
          className="w-full"
        >
          {loading ? "Processing..." : "Generate Radar"}
        </Button>
      </div>
    </form>
  );
}
