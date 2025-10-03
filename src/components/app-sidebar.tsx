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
import { Plus, MessageSquare, LayoutDashboard } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
    const currentOrgId = params?.orgId as string | undefined

    useEffect(() => {
        if (currentOrgId) {
            fetchChats(currentOrgId)
        }
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

    const handleCreateChat = async () => {
        if (!currentOrgId) return

        try {
            const response = await fetch(`/api/organizations/${currentOrgId}/chats`, {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error("Failed to create chat")
            }

            const newChat = await response.json()
            setChats([newChat, ...chats])
            router.push(`/${currentOrgId}/chat/${newChat.id}`)
        } catch (error) {
            toast.error("Failed to create chat")
        }
    }

    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <Button
                    onClick={handleCreateChat}
                    className="w-full"
                    size="sm"
                    disabled={!currentOrgId}
                >
                    <Plus className="h-4 w-4" />
                    New Chat
                </Button>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => router.push(`/${currentOrgId}`)}
                                    isActive={!params?.chatId}
                                    disabled={!currentOrgId}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Manage Org</span>
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
                                        onClick={() => router.push(`/${currentOrgId}/chat/${chat.id}`)}
                                        isActive={params?.chatId === chat.id}
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
        </Sidebar>
    )
}