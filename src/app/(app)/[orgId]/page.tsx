"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";

interface Organization {
    id: string;
    name: string;
    website: string;
    data: any;
    createdAt: Date;
    updatedAt: Date;
}

export default function OrganizationPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const [orgId, setOrgId] = useState<string>("");
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        website: "",
        data: "",
    });

    useEffect(() => {
        params.then((p) => {
            setOrgId(p.orgId);
            fetchOrganization(p.orgId);
        });
    }, [params]);

    const fetchOrganization = async (id: string) => {
        try {
            const response = await fetch(`/api/organizations/${id}`);
            if (response.ok) {
                const data = await response.json();
                setOrganization(data);
                setFormData({
                    name: data.name,
                    website: data.website,
                    data: data.data || "",
                });
            }
        } catch (error) {
            console.error("Error fetching organization:", error);
            toast.error("Failed to load organization");
        } finally {
            setIsFetching(false);
        }
    };

    const handleUpdateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/organizations/${orgId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to update organization");
            }

            const updatedOrg = await response.json();
            setOrganization(updatedOrg);
            setIsDialogOpen(false);
            toast.success("Organization updated successfully");
        } catch (error) {
            toast.error("Failed to update organization");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Manage Organization</h1>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Organization
                    </Button>
                </div>

                <div className="space-y-6 bg-card rounded-lg border p-6">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Organization Name
                        </h3>
                        <p className="text-lg">{organization.name}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Website
                        </h3>
                        <p className="text-lg">{organization.website}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Data
                        </h3>
                        <p className="text-lg whitespace-pre-wrap">
                            {organization.data || "No data available"}
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Organization ID: {organization.id}
                        </p>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                        <DialogDescription>
                            Update the organization information.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateOrganization}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="Enter organization name"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={(e) =>
                                        setFormData({ ...formData, website: e.target.value })
                                    }
                                    placeholder="example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="data">Data</Label>
                                <Textarea
                                    id="data"
                                    value={formData.data}
                                    onChange={(e) =>
                                        setFormData({ ...formData, data: e.target.value })
                                    }
                                    placeholder="Paste any relevant data here..."
                                    rows={12}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

