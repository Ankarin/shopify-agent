"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { SidebarTrigger } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";
import { ModeToggle } from "./ui/toggle";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building2, Plus, ChevronDown, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  website: string;
  data: any;
  shopifyDomain?: string;
  shopifyAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserButtonSkeleton = () => <Skeleton className="h-8 w-8 rounded-full" />;

const Header = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    data: "",
    shopifyDomain: "",
    shopifyAccessToken: "",
  });
  const router = useRouter();
  const params = useParams();
  const currentOrgId = params?.orgId as string | undefined;

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create organization");
      }

      const newOrg = await response.json();
      setOrganizations([newOrg, ...organizations]);
      setIsDialogOpen(false);
      setFormData({ name: "", website: "", data: "", shopifyDomain: "", shopifyAccessToken: "" });
      router.push(`/${newOrg.id}`);
    } catch (error) {
      toast.error("Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{currentOrg?.name || "Select Organization"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => router.push(`/${org.id}`)}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {org.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <div className="h-6 w-px bg-border" />

            <ClerkLoading>
              <UserButtonSkeleton />
            </ClerkLoading>

            <ClerkLoaded>
              <UserButton
                appearance={{
                  elements: {
                    rootBox: "min-w-8 min-h-8",
                    userButtonAvatarBox: "w-8 h-8",
                    userButtonPopoverCard: "shadow-lg border-border/40",
                  },
                }}
                fallback={<UserButtonSkeleton />}
              />
            </ClerkLoaded>
          </div>
        </div>
      </header>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to start managing their data.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrganization}>
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
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Shopify Integration (Optional)</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shopifyDomain">Shopify Domain</Label>
                    <Input
                      id="shopifyDomain"
                      value={formData.shopifyDomain}
                      onChange={(e) =>
                        setFormData({ ...formData, shopifyDomain: e.target.value })
                      }
                      placeholder="your-store.myshopify.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="shopifyAccessToken">Shopify Access Token</Label>
                    <Input
                      id="shopifyAccessToken"
                      type="password"
                      value={formData.shopifyAccessToken}
                      onChange={(e) =>
                        setFormData({ ...formData, shopifyAccessToken: e.target.value })
                      }
                      placeholder="shpat_xxxxxxxxxxxxx"
                    />
                  </div>
                </div>
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
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
