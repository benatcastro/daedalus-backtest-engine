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
import { BacktestForm } from "./backtest-form";
import { useState } from "react";
import { toast } from "sonner";
import Backtest from "@/types/backtest";
type UploadBacktestButtonProps = {
  strategy: Strategy;
};

/**
 * Button component that opens a dialog for uploading a new backtest
 */
export function UploadBacktestButton({
  strategy,
  onNewBacktest,
}: UploadBacktestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const onSuccessHandler = (backtest?: Backtest) => {
    setIsOpen(!isOpen);
    if (!backtest) {
      toast("Upload succesfull");
    } else {
      toast("Upload succesfull", {
        description: `Backtest "${backtest.name} created succesfully"`,
      });
    }

    if (onNewBacktest) {
      onNewBacktest();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2" />
            Upload Backtest
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[64rem] h-4/6">
          <DialogHeader>
            <DialogTitle>Upload a new Backtest</DialogTitle>
            <DialogDescription>
              Upload a new backtest to be analyzed
            </DialogDescription>
          </DialogHeader>
          <BacktestForm strategy={strategy} onSuccess={onSuccessHandler} />
        </DialogContent>
      </Dialog>
    </>
  );
}
