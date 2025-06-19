import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

// This should match the form schema in the parent component
export const backtestFormSchema = z
  .object({
    name: z.string().min(1, "Backtest name is required"),
    description: z.string().optional(),
    files: z.custom<FileList>(
      (val): val is FileList => {
        return val instanceof FileList && val.length > 0;
      },
      {
        message: "Backtest file is required and must be a FileList",
      },
    ),
  })
  .strict();

export type BacktestFormValues = z.infer<typeof backtestFormSchema>;

interface BacktestMetadataFieldsProps {
  form: UseFormReturn<BacktestFormValues>;
}

/**
 * Component containing the metadata fields for a backtest (name and description)
 */
export function BacktestMetadataFields({ form }: BacktestMetadataFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Backtest Name</FormLabel>
            <FormControl>
              <Input placeholder="Name" {...field} />
            </FormControl>
            <FormDescription>The backtest's name</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Description..." {...field} />
            </FormControl>
            <FormDescription>Backtest's description</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
