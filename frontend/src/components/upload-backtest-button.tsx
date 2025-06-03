import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card } from "./ui/card";
import axiosInstance from "@/lib/axios";
import { Strategy, StrategyEngine } from "@prisma/client";

export async function uploadBacktest(
  strategy_id: number,
  engine: StrategyEngine,
  data: {
    name: string;
    description?: string;
    files: FileList;
  },
) {
  const formData = new FormData();
  console.log("Strategy: ", strategy_id)
  console.log("Engine: ", engine.toString())
  formData.append("name", data.name);
  formData.append("strategy_id", strategy_id.toString())
  formData.append("engine", engine.toString())
  if (data.description) {
    formData.append("description", data.description);
  }

  Array.from(data.files).forEach((file) => {
    formData.append("files", file);
  });

  const url = `${process.env.BACKTEST_API_URL}/backtest/`
  console.log(`BACKTEST_API_URL: ${url}`)
  const res = await axiosInstance.post(
    url,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
}

const formSchema = z.object({
  name: z.string().min(1, 'Backtest name is required'),
  description: z.string().optional(),
  files: z
    .instanceof(FileList)
    .refine((file) => file?.length > 0, 'Backtest file is required'),
});

type UploadBacktestButtonProps = {
  strategy: Strategy;
}

export function UploadBacktestButton( {strategy}: UploadBacktestButtonProps ) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      files: undefined,
    },
  })

  // 2. Define a submit handler.
  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("🧾 Backtest Submission");
    console.log("• Name:", data.name);
    console.log("• Description:", data.description ?? "(no description)");
    console.log("• Files:", data.files);
    const result = await uploadBacktest(strategy.id, strategy.engine, data);
    console.log("Submit Result: ", result)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus/>Upload Backtest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[64rem]">
        <DialogHeader>
          <DialogTitle>Upload a new Backtest</DialogTitle>
          <DialogDescription>
            Upload a new backtest be analyzed
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backtest Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The backtest's names
                  </FormDescription>
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
                  <FormDescription>
                    Backtest's description
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="files"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>Backtest File</FormLabel>
                  <FormControl>
                    <label>
                      <Card className="cursor-pointer flex flex-col items-center justify-center p-8 border-dashed border-2 hover:bg-muted transition">
                        {selectedFiles && selectedFiles.length > 0 ? (
                          <ul className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {Array.from(selectedFiles).map((file, idx) => (
                              <li
                                key={idx}
                                className="px-2 py-1 bg-muted rounded whitespace-nowrap truncate max-w-xs"
                                title={file.webkitRelativePath || file.name}
                              >
                                📄 {file.webkitRelativePath || file.name}
                              </li>
                            ))}
                          </ul>
                          ) : (
                          <>
                            <Plus className="w-6 h-6 mb-2 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Click to upload backtest files
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              webkitdirectory="true"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  setSelectedFiles(e.target.files);
                                  onChange(e.target.files); // sync with react-hook-form
                                }
                              }}
                            />
                          </>
                        )}
                      </Card>
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Upload Backtest</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
