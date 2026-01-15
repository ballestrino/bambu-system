
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetSectionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    summary?: React.ReactNode;
}

export const BudgetSection = ({ title, isOpen, onToggle, children, summary }: BudgetSectionProps) => {
    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </CardHeader>
            {isOpen ? (
                <CardContent>
                    {children}
                </CardContent>
            ) : (
                summary && (
                    <CardContent className="bg-muted/10 pb-4 pt-0">
                        <div className="pt-4">
                            {summary}
                        </div>
                    </CardContent>
                )
            )}
        </Card>
    );
};
