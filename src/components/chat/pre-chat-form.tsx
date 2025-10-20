"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WidgetCustomization } from "@/lib/widget/defaults";

interface PreChatFormProps {
    config: Required<Omit<WidgetCustomization, "logoKey">>;
    onSubmit: (data: { name: string; phone: string }) => void;
}

export function PreChatForm({ config, onSubmit }: PreChatFormProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        phone?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
            newErrors.phone = "Please enter a valid phone number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit({ name, phone });
        }
    };

    return (
        <div className="flex items-center justify-center h-full p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h2
                        className="text-2xl font-semibold"
                        style={{ color: config.textPrimaryColor }}
                    >
                        Welcome to {config.headerTitle}
                    </h2>
                    <p
                        className="text-sm"
                        style={{ color: config.textPrimaryColor, opacity: 0.8 }}
                    >
                        Please provide your details to start chatting
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="name"
                            style={{ color: config.textPrimaryColor }}
                        >
                            Name
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            style={{
                                backgroundColor: config.secondaryColor,
                                color: config.textPrimaryColor,
                                borderColor: errors.name ? "#ef4444" : config.borderColor,
                            }}
                            className="w-full"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="phone"
                            style={{ color: config.textPrimaryColor }}
                        >
                            Phone Number
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+44 7XXX XXXXXX"
                            style={{
                                backgroundColor: config.secondaryColor,
                                color: config.textPrimaryColor,
                                borderColor: errors.phone ? "#ef4444" : config.borderColor,
                            }}
                            className="w-full"
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-500">{errors.phone}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        style={{
                            backgroundColor: config.primaryColor,
                            color: config.textSecondaryColor,
                        }}
                    >
                        Start Chat
                    </Button>
                </form>
            </div>
        </div>
    );
}

