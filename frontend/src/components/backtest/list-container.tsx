import { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface ListContainerProps {
    title?: string;
    description?: string;
    children?: ReactNode;
    isLoading?: boolean;
    childrenClassNames?: string;
}

export function ListContainer({
    title,
    description,
    isLoading,
    children,
    childrenClassNames,
}: ListContainerProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div
                        className={cn(
                            "h-full overflow-y-scroll scrollbar-custom",
                            childrenClassNames,
                        )}
                    >
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
