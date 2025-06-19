import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Strategy } from "@prisma/client";
import { BacktestForm } from "./backtest/backtest-form";

type UploadBacktestButtonProps = {
  strategy: Strategy;
};

/**
 * Button component that opens a dialog for uploading a new backtest
 */
export function UploadBacktestButton({ strategy }: UploadBacktestButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2" />
          Upload Backtest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[64rem]">
        <DialogHeader>
          <DialogTitle>Upload a new Backtest</DialogTitle>
          <DialogDescription>
            Upload a new backtest to be analyzed
          </DialogDescription>
        </DialogHeader>
        <BacktestForm strategy={strategy} />
      </DialogContent>
    </Dialog>
  );
}
