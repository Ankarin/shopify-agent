"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WidgetCustomization } from "@/lib/widget/defaults";

interface PreChatFormProps {
    config: Required<Omit<WidgetCustomization, "logoKey">>;
    onSubmit: (data: { name: string; email: string }) => void;
}

export function PreChatForm({ config, onSubmit }: PreChatFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit({ name, email });
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
                            htmlFor="email"
                            style={{ color: config.textPrimaryColor }}
                        >
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            style={{
                                backgroundColor: config.secondaryColor,
                                color: config.textPrimaryColor,
                                borderColor: errors.email ? "#ef4444" : config.borderColor,
                            }}
                            className="w-full"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email}</p>
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

