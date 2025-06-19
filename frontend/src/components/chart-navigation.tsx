import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from "lucide-react";
import { DateRange } from "@/utils/sample-data-generator";

interface ChartNavigationProps {
  currentRange: DateRange;
  backtestRange: DateRange;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loading: boolean;
  onLoadNext: () => Promise<void>;
  onLoadPrevious: () => Promise<void>;
  onJumpToDate?: (date: Date) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function ChartNavigation({
  currentRange,
  backtestRange,
  hasNextPage,
  hasPreviousPage,
  loading,
  onLoadNext,
  onLoadPrevious,
  onJumpToDate,
  onRefresh,
}: ChartNavigationProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const calculateProgress = () => {
    const totalDuration =
      backtestRange.end.getTime() - backtestRange.start.getTime();
    const currentStart =
      currentRange.start.getTime() - backtestRange.start.getTime();
    return Math.max(0, Math.min(100, (currentStart / totalDuration) * 100));
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={onLoadPrevious}
        disabled={!hasPreviousPage || loading}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onLoadNext}
        disabled={!hasNextPage || loading}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Progress Indicator */}
      <div className="flex-1 mx-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>{formatDate(currentRange.start)}</span>
          <span>-</span>
          <span>{formatDate(currentRange.end)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      {/* Jump to Start/End */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onJumpToDate?.(backtestRange.start)}
          disabled={loading}
          title="Jump to backtest start"
        >
          Start
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onJumpToDate?.(backtestRange.end)}
          disabled={loading}
          title="Jump to backtest end"
        >
          End
        </Button>
      </div>
    </div>
  );
}
