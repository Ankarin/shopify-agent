import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 flex h-screen w-full flex-col overflow-hidden">
                <Header />
                <div className="flex-1 overflow-hidden">{children}</div>
            </main>
        </SidebarProvider>
    );
}
