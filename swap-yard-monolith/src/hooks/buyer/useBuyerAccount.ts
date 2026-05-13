"use client";

import { useEffect, useRef, useState } from "react";

export type EditingSection =
  | "personal"
  | "address"
  | "notifications"
  | null;

export type BuyerAccountFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: "BUYER" | "SELLER" | "";
  bio: string;
  deliveryAddress: string;
  stateCountry: string;
};

const initialFormData: BuyerAccountFormData = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  role: "",
  bio: "",
  deliveryAddress: "",
  stateCountry: "",
};

export function useBuyerAccount() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI STATE
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingSection, setEditingSection] =
    useState<EditingSection>(null);

  const [notifyOrderConfirm, setNotifyOrderConfirm] = useState(true);
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(false);
  const [notifyOrderDelivered, setNotifyOrderDelivered] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);

  const [profileImageFile, setProfileImageFile] =
    useState<File | null>(null);

  const [profileImageUrl, setProfileImageUrl] =
    useState<string | null>(null);

  const [formData, setFormData] =
    useState<BuyerAccountFormData>(initialFormData);

  const [originalFormData, setOriginalFormData] =
    useState<BuyerAccountFormData>(initialFormData);


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setError("");

        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        const user = data.user;

        const nextFormData: BuyerAccountFormData = {
          firstName: user.firstname || "",
          lastName: user.lastname || "",
          phone: user.phoneNumber || "",
          email: user.email || "",
          role: user.role || "",
          bio: user.bio || "",
          deliveryAddress: user.deliveryAddress || "",
          stateCountry: user.state || "",
        };

        setFormData(nextFormData);
        setOriginalFormData(nextFormData);
        setProfileImageUrl(user.image || null);

      } catch (err: any) {
        setError(
          err.message || "Failed to connect to backend"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);


  useEffect(() => {
    return () => {
      if (profileImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  }, [profileImageUrl]);


  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    setProfileImageFile(file);

    if (profileImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImageUrl);
    }

    setProfileImageUrl(
      URL.createObjectURL(file)
    );
  };


  const handleCancelEdit = () => {
    setFormData(originalFormData);
    setError("");
    setSuccess("");
    setEditingSection(null);
  };


  const handleSave = async (
    section: EditingSection
  ) => {
    if (!section) return;

    if (section === "notifications") {
      setEditingSection(null);
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const payload: Record<string, string> = {};

      if (section === "personal") {
        payload.firstname = formData.firstName;
        payload.lastname = formData.lastName;
        payload.phoneNumber = formData.phone;
        payload.bio = formData.bio;
      }

      if (section === "address") {
        payload.deliveryAddress =
          formData.deliveryAddress;

        payload.state =
          formData.stateCountry;
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type":"application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.errors) {
          const firstError =
            Object.values(data.errors).flat()[0];

          throw new Error(
            typeof firstError === "string"
              ? firstError
              : "Validation failed"
          );
        }

        throw new Error(
          data.message || "Failed to save changes"
        );
      }

      setOriginalFormData(formData);
      setSuccess(
        "Profile updated successfully!"
      );
      setEditingSection(null);

    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to connect to backend"
      );
    } finally {
      setIsSaving(false);
    }
  };


  return {
    state: {
      formData,
      originalFormData,
      isLoading,
      isSaving,
      error,
      success,
      editingSection,

      profileImageFile,
      profileImageUrl,

      notifyOrderConfirm,
      notifyOrderStatus,
      notifyOrderDelivered,
      notifyEmail,
    },

    setters: {
      setEditingSection,
      setFormData,
      setError,
      setSuccess,

      setNotifyOrderConfirm,
      setNotifyOrderStatus,
      setNotifyOrderDelivered,
      setNotifyEmail,
    },

    refs: {
      fileInputRef,
    },

    handlers: {
      handleInputChange,
      handleImageChange,
      handleSave,
      handleCancelEdit,
    },
  };
}