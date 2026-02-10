import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    RefreshCw,
    Phone,
    User,
    Clock,
    Play,
    FileText,
    Activity,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface CallLog {
    _id: string;
    call_id: string;
    customer_name: string;
    phone_number: string;
    status: string;
    duration: number;
    started_at: string;
    ended_at?: string;
    recording_url?: string;
    summary?: string;
}

const CallLogsTab = () => {
    const { toast } = useToast();
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/call_logs");
            const result = await response.json();

            if (result.data) {
                setLogs(result.data);
            }
        } catch (error: any) {
            toast({
                title: "Error fetching logs",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const syncStatus = async (log: CallLog) => {
        setSyncingId(log._id);
        try {
            const response = await fetch(`http://localhost:5000/api/call_logs/${log._id}/sync`, {
                method: "POST"
            });
            const result = await response.json();

            if (response.ok && result.data) {
                setLogs(prev => prev.map(l => l._id === log._id ? result.data : l));
                toast({
                    title: "Status synced",
                    description: "Latest call details fetched from Bolna AI",
                });
            } else {
                throw new Error(result.error || "Sync failed");
            }
        } catch (error: any) {
            toast({
                title: "Sync failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSyncingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return <Badge className="bg-green-500">Completed</Badge>;
            case "no-answer":
                return <Badge className="bg-orange-500">No Answer</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            case "busy":
                return <Badge className="bg-red-500">Busy</Badge>;
            case "queued":
                return <Badge variant="outline" className="border-blue-500 text-blue-500">Queued</Badge>;
            case "initiated":
                return <Badge className="bg-blue-500">Initiated</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return "-";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <div className="glass-card p-6">
                    <p className="text-muted-foreground text-sm">Total Calls</p>
                    <p className="text-3xl font-bold gradient-text">{logs.length}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-muted-foreground text-sm">Completed</p>
                    <p className="text-3xl font-bold text-green-500">
                        {logs.filter(l => l.status === 'completed').length}
                    </p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-muted-foreground text-sm">No Answer</p>
                    <p className="text-3xl font-bold text-orange-500">
                        {logs.filter(l => l.status === 'no-answer').length}
                    </p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-muted-foreground text-sm">Total Duration</p>
                    <p className="text-3xl font-bold gradient-text">
                        {Math.floor(logs.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60)}m
                    </p>
                </div>
            </motion.div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 flex items-center justify-between"
            >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Call Logs
                </h2>
                <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead>Recording</TableHead>
                                <TableHead className="w-32">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No calls made yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                {format(new Date(log.started_at), "dd MMM, HH:mm")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 font-medium">
                                                    <User className="w-3 h-3 text-primary" />
                                                    {log.customer_name || "Unknown"}
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Phone className="w-3 h-3" />
                                                    {log.phone_number}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{formatDuration(log.duration)}</span>
                                        </TableCell>
                                        <TableCell>
                                            {log.summary ? (
                                                <div className="flex items-start gap-1 max-w-[200px]" title={log.summary}>
                                                    <FileText className="w-3 h-3 mt-1 text-primary shrink-0" />
                                                    <p className="text-xs truncate">{log.summary}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {log.recording_url ? (
                                                <a href={log.recording_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                                    <Play className="w-3 h-3" /> Play
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => syncStatus(log)}
                                                disabled={syncingId === log._id}
                                                className="text-xs h-8"
                                            >
                                                <RefreshCw className={`w-3 h-3 mr-1 ${syncingId === log._id ? 'animate-spin' : ''}`} />
                                                Sync
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>
        </div>
    );
};

export default CallLogsTab;
