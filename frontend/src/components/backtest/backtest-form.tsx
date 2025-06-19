import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Strategy, StrategyEngine } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BacktestFormValues,
  BacktestMetadataFields,
  backtestFormSchema,
} from "./backtest-metadata-fields";
import { BacktestFileUpload } from "./backtest-file-upload";
import axiosInstance from "@/lib/axios";

interface BacktestFormProps {
  strategy: Strategy;
  onSuccess?: () => void;
}

/**
 * Function to upload a backtest to the server
 */
async function uploadBacktest(
  strategy_id: number,
  engine: StrategyEngine,
  data: BacktestFormValues,
) {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("strategy_id", strategy_id.toString());
  formData.append("engine", engine.toString());

  if (data.description) {
    formData.append("description", data.description);
  }

  Array.from(data.files).forEach((file) => {
    formData.append("files", file);
  });

  const url = `${process.env.NEXT_PUBLIC_BACKTEST_BACKEND_URL}/api/v1/backtest/`;
  const response = await axiosInstance.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/**
 * Form component for uploading backtests
 */
export function BacktestForm({ strategy, onSuccess }: BacktestFormProps) {
  const form = useForm<BacktestFormValues>({
    resolver: zodResolver(backtestFormSchema),
    defaultValues: {
      name: "",
      description: "",
      files: undefined,
    },
  });

  // Form submission handler
  async function onSubmit(data: BacktestFormValues) {
    try {
      console.log("🧾 Backtest Submission");
      console.log("• Name:", data.name);
      console.log("• Description:", data.description ?? "(no description)");
      console.log("• Files:", data.files);

      const result = await uploadBacktest(strategy.id, strategy.engine, data);
      console.log("Upload result:", result);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error uploading backtest:", error);
      // Here you could add error handling or user notifications
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <BacktestMetadataFields form={form} />
        <BacktestFileUpload form={form} />
        <div className="flex justify-end">
          <Button type="submit">Upload Backtest</Button>
        </div>
      </form>
    </Form>
  );
}
