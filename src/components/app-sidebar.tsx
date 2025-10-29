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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Chat {
    id: string
    organizationId: string
    customerName: string | null
    customerEmail: string | null
    createdAt: Date
    updatedAt: Date
}

type ChatFilter = 'all' | 'resolved' | 'unresolved'

export function AppSidebar() {
    const [chats, setChats] = useState<Chat[]>([])
    const [filter, setFilter] = useState<ChatFilter>('all')
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const currentOrgId = params?.orgId as string | undefined

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (currentOrgId) {
            fetchChats(currentOrgId, filter)
        }
    }, [currentOrgId, filter])

    useEffect(() => {
        const handleChatCreated = () => {
            if (currentOrgId) {
                fetchChats(currentOrgId, filter)
            }
        }

        window.addEventListener('chatCreated', handleChatCreated)
        return () => window.removeEventListener('chatCreated', handleChatCreated)
    }, [currentOrgId, filter])

    const fetchChats = async (orgId: string, filterType: ChatFilter) => {
        try {
            const response = await fetch(`/api/organizations/${orgId}/chats?filter=${filterType}`)
            if (response.ok) {
                const data = await response.json()
                setChats(data)
            }
        } catch (error) {
            console.error("Error fetching chats:", error)
        }
    }

    const handleCreateNewChat = () => {
        if (!currentOrgId) return
        console.log("🆕 [Sidebar] Creating new chat, navigating to:", `/${currentOrgId}/dashboard/chats/_`)
        router.push(`/${currentOrgId}/dashboard/chats/_`)
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
                                <div className="px-2 pb-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCreateNewChat}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Chat
                                    </Button>
                                </div>
                                <div className="px-2 pb-2">
                                    <Select value={filter} onValueChange={(v) => setFilter(v as ChatFilter)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Chats</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="unresolved">Unresolved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <SidebarMenu>
                                    {chats.map((chat) => (
                                        <SidebarMenuItem key={chat.id}>
                                            <SidebarMenuButton
                                                onClick={() => router.push(`/${currentOrgId}/dashboard/chats/${chat.id}`)}
                                                isActive={pathname.includes(`/dashboard/chats/${chat.id}`)}
                                                className="h-auto py-2"
                                            >
                                                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                                <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                                    <span className="truncate w-full">
                                                        {new Date(chat.createdAt).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground truncate w-full">
                                                        {chat.customerEmail || "No email"}
                                                    </span>
                                                </div>
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