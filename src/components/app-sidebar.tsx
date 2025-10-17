"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, LayoutDashboard, Palette, BarChart3 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { toast } from "sonner"

interface Chat {
    id: string
    organizationId: string
    createdAt: Date
    updatedAt: Date
}

export function AppSidebar() {
    const [chats, setChats] = useState<Chat[]>([])
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const currentOrgId = params?.orgId as string | undefined

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (currentOrgId) {
            fetchChats(currentOrgId)
        }
    }, [currentOrgId])

    useEffect(() => {
        const handleChatCreated = () => {
            if (currentOrgId) {
                fetchChats(currentOrgId)
            }
        }

        window.addEventListener('chatCreated', handleChatCreated)
        return () => window.removeEventListener('chatCreated', handleChatCreated)
    }, [currentOrgId])

    const fetchChats = async (orgId: string) => {
        try {
            const response = await fetch(`/api/organizations/${orgId}/chats`)
            if (response.ok) {
                const data = await response.json()
                setChats(data)
            }
        } catch (error) {
            console.error("Error fetching chats:", error)
        }
    }

    return (
        <Sidebar>
            {currentOrgId ? (
                <>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            onClick={() => router.push(`/${currentOrgId}`)}
                                            isActive={pathname === `/${currentOrgId}`}
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Manage Org</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            onClick={() => router.push(`/${currentOrgId}/dashboard`)}
                                            isActive={pathname === `/${currentOrgId}/dashboard`}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            <span>Analytics</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            onClick={() => router.push(`/${currentOrgId}/widget-settings`)}
                                            isActive={pathname === `/${currentOrgId}/widget-settings`}
                                        >
                                            <Palette className="h-4 w-4" />
                                            <span>Widget Settings</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarGroup>
                            <SidebarGroupLabel>Chats</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {chats.map((chat) => (
                                        <SidebarMenuItem key={chat.id}>
                                            <SidebarMenuButton
                                                onClick={() => router.push(`/${currentOrgId}/dashboard?chatId=${chat.id}`)}
                                                isActive={pathname.includes(`chatId=${chat.id}`)}
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                <span>Chat {new Date(chat.createdAt).toLocaleString()}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter />
                </>
            ) : (
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent className="p-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Select an organization to view chats
                            </p>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            )}
        </Sidebar>
    )
}