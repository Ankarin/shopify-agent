"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ai-elements/loader";
import { WebsiteWidget } from "@/components/chat/website-widget";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DEFAULT_WIDGET_CONFIG,
  type WidgetCustomization,
} from "@/lib/widget/defaults";

interface Chat {
  id: string;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WidgetCustomizerProps {
  orgId: string;
  chat: Chat | null;
}

export function WidgetCustomizer({ orgId, chat }: WidgetCustomizerProps) {
  const [settings, setSettings] = useState<WidgetCustomization>({
    ...DEFAULT_WIDGET_CONFIG,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showRemoveLogoDialog, setShowRemoveLogoDialog] = useState(false);

  // Load settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `/api/organizations/${orgId}/widget-settings`,
        );
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [orgId]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const finalSettings = { ...settings };

      if (selectedLogoFile) {
        // Delete old logo file from storage if exists
        if (settings.logoKey) {
          try {
            const deleteResponse = await fetch("/api/upload", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ filename: settings.logoKey }),
            });

            if (!deleteResponse.ok) {
              console.warn("Failed to delete old logo file");
            }
          } catch (deleteError) {
            console.warn("Error deleting old logo:", deleteError);
          }
        }

        // Upload new logo file
        const formData = new FormData();
        formData.append("file", selectedLogoFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalSettings.logoKey = uploadData.key;
        } else {
          const error = await uploadResponse.json();
          toast.error(`Failed to upload logo: ${error.error}`);
          setIsSaving(false);
          return;
        }
      }

      // Save settings to database
      const response = await fetch(
        `/api/organizations/${orgId}/widget-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalSettings),
        },
      );

      if (response.ok) {
        const savedData = await response.json();
        setSettings(savedData);
        setSelectedLogoFile(null);
        setLogoPreviewUrl(null);
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (
    key: keyof WidgetCustomization,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = async () => {
    setIsSaving(true);

    try {
      // Delete logo file from storage if exists
      if (settings.logoKey) {
        try {
          const deleteResponse = await fetch("/api/upload", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ filename: settings.logoKey }),
          });

          if (!deleteResponse.ok) {
            console.warn("Failed to delete logo file");
          }
        } catch (deleteError) {
          console.warn("Error deleting logo:", deleteError);
        }
      }

      // Reset to default settings
      const response = await fetch(
        `/api/organizations/${orgId}/widget-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(DEFAULT_WIDGET_CONFIG),
        },
      );

      if (response.ok) {
        const savedData = await response.json();
        setSettings(savedData);
        setSelectedLogoFile(null);
        setLogoPreviewUrl(null);
        toast.success("Settings reset to defaults successfully!");
      } else {
        toast.error("Failed to reset settings");
      }
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsSaving(true);

    try {
      // Delete logo file from storage if exists
      if (settings.logoKey) {
        const deleteResponse = await fetch("/api/upload", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filename: settings.logoKey }),
        });

        if (!deleteResponse.ok) {
          console.warn("Failed to delete logo file");
        }
      }

      // Update settings to remove logo
      const updatedSettings = {
        ...settings,
        logoKey: "",
        logoUrl: "",
      };

      const response = await fetch(
        `/api/organizations/${orgId}/widget-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedSettings),
        },
      );

      if (response.ok) {
        const savedData = await response.json();
        setSettings(savedData);
        setSelectedLogoFile(null);
        setLogoPreviewUrl(null);
        toast.success("Logo removed successfully!");
      } else {
        toast.error("Failed to remove logo");
      }
    } catch (error) {
      console.error("Failed to remove logo:", error);
      toast.error("Failed to remove logo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview URL
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    // Store file for later upload
    setSelectedLogoFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Widget Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your chat widget appearance
          </p>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="texts">Texts</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>
                  Choose colors for your widget. Changes apply in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          updateSetting("primaryColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) =>
                          updateSetting("backgroundColor", e.target.value)
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.backgroundColor}
                        onChange={(e) =>
                          updateSetting("backgroundColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) =>
                          updateSetting("secondaryColor", e.target.value)
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) =>
                          updateSetting("secondaryColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textPrimaryColor">Text Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textPrimaryColor"
                        type="color"
                        value={settings.textPrimaryColor}
                        onChange={(e) =>
                          updateSetting("textPrimaryColor", e.target.value)
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.textPrimaryColor}
                        onChange={(e) =>
                          updateSetting("textPrimaryColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textSecondaryColor">Text Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textSecondaryColor"
                        type="color"
                        value={settings.textSecondaryColor}
                        onChange={(e) =>
                          updateSetting("textSecondaryColor", e.target.value)
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.textSecondaryColor}
                        onChange={(e) =>
                          updateSetting("textSecondaryColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderColor">Border Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="borderColor"
                        type="color"
                        value={settings.borderColor}
                        onChange={(e) =>
                          updateSetting("borderColor", e.target.value)
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.borderColor}
                        onChange={(e) =>
                          updateSetting("borderColor", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
                <CardDescription>
                  Upload your company logo (max 5MB, image files only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoFile">Upload Logo</Label>
                  <Input
                    id="logoFile"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    disabled={isSaving}
                  />
                  <p className="text-sm text-muted-foreground">
                    Logo will be uploaded when you click "Save Settings"
                  </p>
                </div>

                {(logoPreviewUrl || settings.logoUrl) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Logo Preview</Label>
                      {settings.logoUrl && !logoPreviewUrl && (
                        <Button
                          onClick={() => setShowRemoveLogoDialog(true)}
                          disabled={isSaving}
                          variant="destructive"
                          size="sm"
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                      <Image
                        src={logoPreviewUrl || settings.logoUrl || ""}
                        alt="Logo preview"
                        width={settings.logoWidth || 40}
                        height={settings.logoHeight || 40}
                        className="object-contain"
                      />
                    </div>
                    {logoPreviewUrl && (
                      <p className="text-sm text-amber-600">
                        New logo selected - click "Save Settings" to upload
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoWidth">Width (px)</Label>
                    <Input
                      id="logoWidth"
                      type="number"
                      value={settings.logoWidth || 40}
                      onChange={(e) =>
                        updateSetting(
                          "logoWidth",
                          Number.parseInt(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoHeight">Height (px)</Label>
                    <Input
                      id="logoHeight"
                      type="number"
                      value={settings.logoHeight || 40}
                      onChange={(e) =>
                        updateSetting(
                          "logoHeight",
                          Number.parseInt(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoBorderRadius">Border Radius (px)</Label>
                    <Input
                      id="logoBorderRadius"
                      type="number"
                      min="0"
                      value={settings.logoBorderRadius ?? 8}
                      onChange={(e) =>
                        updateSetting(
                          "logoBorderRadius",
                          e.target.value === "" ? 0 : Number.parseInt(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="texts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Widget Texts</CardTitle>
                <CardDescription>
                  Customize the text displayed in your widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headerTitle">Header Title</Label>
                  <Input
                    id="headerTitle"
                    type="text"
                    value={settings.headerTitle || ""}
                    onChange={(e) =>
                      updateSetting("headerTitle", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerSubtitle">Header Subtitle</Label>
                  <Input
                    id="headerSubtitle"
                    type="text"
                    value={settings.headerSubtitle || ""}
                    onChange={(e) =>
                      updateSetting("headerSubtitle", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inputPlaceholder">Input Placeholder</Label>
                  <Input
                    id="inputPlaceholder"
                    type="text"
                    value={settings.inputPlaceholder || ""}
                    onChange={(e) =>
                      updateSetting("inputPlaceholder", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialMessage">Initial Message</Label>
                  <Input
                    id="initialMessage"
                    type="text"
                    value={settings.initialMessage || ""}
                    onChange={(e) =>
                      updateSetting("initialMessage", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The first message shown to users when they open the chat
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      id="showBranding"
                      type="checkbox"
                      checked={settings.showBranding !== false}
                      onChange={(e) =>
                        updateSetting("showBranding", e.target.checked)
                      }
                      className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor="showBranding" className="cursor-pointer">
                        Show Branding Footer
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Display "Powered By Sevensocials" at the bottom of the widget
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
//
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          <Button
            onClick={() => setShowResetDialog(true)}
            disabled={isSaving}
            size="lg"
            variant="outline"
            className="flex-1"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Widget Preview */}
      <div className="lg:sticky lg:top-8 h-fit">
        <WebsiteWidget
          orgId={orgId}
          chatId={chat?.id || "demo-chat"}
          customization={{
            ...settings,
            logoUrl: logoPreviewUrl || settings.logoUrl,
          }}
        />
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleReset}
        title="Reset to Defaults"
        description="Are you sure you want to reset all settings to default? This will delete your logo and restore all default values. This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmDialog
        open={showRemoveLogoDialog}
        onOpenChange={setShowRemoveLogoDialog}
        onConfirm={handleRemoveLogo}
        title="Remove Logo"
        description="Are you sure you want to remove the logo? This will permanently delete the logo file from storage."
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
