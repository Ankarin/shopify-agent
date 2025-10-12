"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, MessageSquare, DollarSign, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface ClientBreakdown {
    id: string;
    name: string;
    totalChats: number;
    totalMessages: number;
    totalConversions: number;
    totalRevenue: number;
    escalated: number;
    resolved: number;
    conversionRate: number;
}

interface OverallAnalytics {
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    overall: {
        totalChats: number;
        totalMessages: number;
        totalConversions: number;
        conversionRate: number;
        revenue: Record<string, number>;
        escalated: number;
        resolved: number;
        inProgress: number;
    };
    topQuestions: Array<{
        question: string;
        count: number;
    }>;
    clientBreakdown: ClientBreakdown[];
}

export default function OverallDashboardPage() {
    const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(30);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/analytics?days=${period}`);
                if (response.ok) {
                    const data = await response.json();
                    setAnalytics(data);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [period]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">No Data Available</h1>
                </div>
            </div>
        );
    }

    const totalRevenue = Object.values(analytics.overall.revenue).reduce((a, b) => a + b, 0);
    const mainCurrency = Object.keys(analytics.overall.revenue)[0] || 'USD';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Overall Analytics Dashboard</h1>
                <Tabs value={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
                    <TabsList>
                        <TabsTrigger value="7">7 Days</TabsTrigger>
                        <TabsTrigger value="30">30 Days</TabsTrigger>
                        <TabsTrigger value="90">90 Days</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overall.totalChats}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.overall.totalMessages} total messages
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mainCurrency} ${totalRevenue.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.overall.totalConversions} conversions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overall.conversionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            across all clients
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.clientBreakdown.length}</div>
                        <p className="text-xs text-muted-foreground">
                            organizations
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversation Status (All Clients)</CardTitle>
                        <CardDescription>Overall breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="font-medium">Resolved</span>
                            </div>
                            <span className="text-2xl font-bold">{analytics.overall.resolved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <span className="font-medium">Escalated</span>
                            </div>
                            <span className="text-2xl font-bold">{analytics.overall.escalated}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Questions Across All Clients</CardTitle>
                        <CardDescription>Most common inquiries</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.topQuestions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No questions yet</p>
                        ) : (
                            <div className="space-y-2">
                                {analytics.topQuestions.slice(0, 5).map((q, idx) => (
                                    <div key={idx} className="flex items-start justify-between pb-2 border-b last:border-0">
                                        <p className="text-sm flex-1 pr-2">{q.question}</p>
                                        <span className="text-xs text-muted-foreground">{q.count}x</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Client Breakdown</CardTitle>
                    <CardDescription>Per-client performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    {analytics.clientBreakdown.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No clients yet</p>
                    ) : (
                        <div className="space-y-4">
                            {analytics.clientBreakdown.map((client) => (
                                <Link
                                    key={client.id}
                                    href={`/${client.id}/dashboard`}
                                    className="block"
                                >
                                    <div className="p-4 border rounded-lg hover:bg-accent transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-lg">{client.name}</h3>
                                            <span className="text-sm text-muted-foreground">
                                                {client.conversionRate}% conversion
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Chats</p>
                                                <p className="font-semibold">{client.totalChats}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Conversions</p>
                                                <p className="font-semibold">{client.totalConversions}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Revenue</p>
                                                <p className="font-semibold">${client.totalRevenue.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Status</p>
                                                <p className="font-semibold">
                                                    {client.resolved}R / {client.escalated}E
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}