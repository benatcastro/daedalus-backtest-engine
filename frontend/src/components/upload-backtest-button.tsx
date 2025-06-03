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
import { Plus, ChevronRight, ChevronDown, Folder, File } from "lucide-react"
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef } from 'react';
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

  const url = "http://localhost:8000/backtest/"
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
  // Validate that files is a FileList with at least one File
  files: z.custom<FileList>((val): val is FileList => {
    return val instanceof FileList && val.length > 0;
  }, {
    message: 'Backtest file is required and must be a FileList',
  }),
}).strict();

type UploadBacktestButtonProps = {
  strategy: Strategy;
}

// Define the custom input properties for directory selection
interface DirectoryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

export function UploadBacktestButton({strategy}: UploadBacktestButtonProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      files: undefined,
    },
  });

  // Process files to create a folder structure
  const processFileStructure = (files: FileList) => {
    const filesByFolder: Record<string, File[]> = {};

    Array.from(files).forEach(file => {
      const path = file.webkitRelativePath;
      if (path) {
        // For files from a directory input
        const pathParts = path.split('/');
        const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';

        if (folderPath) {
          if (!filesByFolder[folderPath]) {
            filesByFolder[folderPath] = [];
          }
          filesByFolder[folderPath].push(file);
        } else {
          // Root level file
          if (!filesByFolder['']) {
            filesByFolder[''] = [];
          }
          filesByFolder[''].push(file);
        }
      } else {
        // For individually selected files (no folder structure)
        if (!filesByFolder['']) {
          filesByFolder[''] = [];
        }
        filesByFolder[''].push(file);
      }
    });

    return filesByFolder;
  };

  // Toggle folder expansion
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // Handle file removal
  const handleRemoveFile = (fileToRemove: File, onChange: (...event: any[]) => void) => {
    if (!selectedFiles) return;

    const dt = new DataTransfer();
    Array.from(selectedFiles).forEach(file => {
      if (file !== fileToRemove) {
        dt.items.add(file);
      }
    });

    const newFiles = dt.files;
    setSelectedFiles(newFiles.length > 0 ? newFiles : null);
    onChange(newFiles.length > 0 ? newFiles : undefined);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, onChange: (...event: any[]) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Handle dropped files or directories
    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      const fileList = e.dataTransfer.files;

      if (fileList.length > 0) {
        setSelectedFiles(fileList);
        onChange(fileList);
      }
    }
  };

  // Define a submit handler.
  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      console.log("🧾 Backtest Submission");
      console.log("• Name:", data.name);
      console.log("• Description:", data.description ?? "(no description)");
      console.log("• Files:", data.files);
      const result = await uploadBacktest(strategy.id, strategy.engine, data);
      console.log("Submit Result: ", result);
      // You could add success notification here
    } catch (error) {
      console.error("Error uploading backtest:", error);
      // You could add error notification here
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2" />Upload Backtest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[64rem]">
        <DialogHeader>
          <DialogTitle>Upload a new Backtest</DialogTitle>
          <DialogDescription>
            Upload a new backtest to be analyzed
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
                    The backtest's name
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
                  <FormLabel>Backtest Files</FormLabel>
                  <FormControl>
                    <div
                      className="relative"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, onChange)}
                    >
                      <Card
                        className={`cursor-pointer flex flex-col items-center justify-center p-8 border-dashed border-2 hover:bg-muted transition ${isDragging ? 'ring-2 ring-primary border-2' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {selectedFiles && selectedFiles.length > 0 ? (
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{selectedFiles.length} files selected</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles(null);
                                  onChange(undefined);
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground max-h-40 overflow-y-auto border rounded p-2">
                              {selectedFiles && selectedFiles.length > 0 && (
                                <div className="w-full">
                                  {/* Process files into a folder structure for display */}
                                  {(() => {
                                    const filesByFolder = processFileStructure(selectedFiles);
                                    const folderPaths = Object.keys(filesByFolder).sort();

                                    return (
                                      <>
                                        {folderPaths.map(folderPath => {
                                          const files = filesByFolder[folderPath];
                                          const folderName = folderPath ? folderPath.split('/').pop() : 'Files';
                                          const isExpanded = expandedFolders.has(folderPath);

                                          return (
                                            <div key={folderPath} className="mb-2">
                                              {/* Folder header with toggle */}
                                              <div
                                                className="flex items-center gap-1 hover:bg-muted p-1 rounded cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleFolder(folderPath);
                                                }}
                                              >
                                                {isExpanded ?
                                                  <ChevronDown className="h-4 w-4" /> :
                                                  <ChevronRight className="h-4 w-4" />
                                                }
                                                <Folder className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium">{folderName || 'Root'}</span>
                                                <span className="text-xs text-muted-foreground">({files.length} files)</span>
                                              </div>

                                              {/* Files in folder (shown when expanded) */}
                                              {isExpanded && (
                                                <ul className="pl-6">
                                                  {files.map((file, idx) => {
                                                    // Extract just the filename from the path
                                                    const fileName = file.webkitRelativePath
                                                      ? file.webkitRelativePath.split('/').pop()
                                                      : file.name;

                                                    return (
                                                      <li
                                                        key={`${folderPath}-${idx}`}
                                                        className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded group"
                                                      >
                                                        <File className="h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate" title={fileName || file.name}>
                                                          {fileName || file.name}
                                                        </span>
                                                        <button
                                                          type="button"
                                                          className="text-xs opacity-0 group-hover:opacity-100 hover:text-destructive focus:outline-none ml-auto p-1 rounded-full hover:bg-background transition-opacity"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFile(file, onChange);
                                                          }}
                                                          aria-label={`Remove ${fileName || file.name}`}
                                                        >
                                                          ✕
                                                        </button>
                                                      </li>
                                                    );
                                                  })}
                                                </ul>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <Plus className="w-6 h-6 mb-2 text-muted-foreground" />
                            <div className="flex flex-col items-center">
                              <span className="text-muted-foreground mb-1">
                                Click to select a folder or drag and drop
                              </span>
                              <span className="text-xs text-muted-foreground">
                                You can select a folder containing your backtest files
                              </span>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              // @ts-ignore - webkitdirectory is a non-standard attribute
                              webkitdirectory=""
                              // @ts-ignore - directory is a non-standard attribute
                              directory=""
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setSelectedFiles(e.target.files);
                                  onChange(e.target.files);
                                  // Auto-expand folders when files are selected
                                  const filesByFolder = processFileStructure(e.target.files);
                                  // Expand all top-level folders by default
                                  setExpandedFolders(new Set(Object.keys(filesByFolder)));
                                }
                              }}
                            />
                          </>
                        )}
                      </Card>
                    </div>
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
  );
}
