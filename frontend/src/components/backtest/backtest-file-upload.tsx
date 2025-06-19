import { Card } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { FileDisplayList } from "./file-components";
import { createDataTransferWithoutFile } from "@/utils/fileUtils";
import { BacktestFormValues } from "./backtest-metadata-fields";

interface BacktestFileUploadProps {
  form: UseFormReturn<BacktestFormValues>;
}

/**
 * Component for handling file uploads in the backtest form
 */
export function BacktestFileUpload({ form }: BacktestFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFolderAlert, setShowFolderAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    onChange: (...event: any[]) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // If nothing is present, user likely dropped a folder (browser limitation)
    const itemsLength = e.dataTransfer.items?.length || 0;
    const filesLength = e.dataTransfer.files?.length || 0;
    if (itemsLength === 0 && filesLength === 0) {
      setShowFolderAlert(true);
      return;
    }

    // Normal file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files);
      onChange(e.dataTransfer.files);
    }
  };

  // Handle file removal
  const handleRemoveFile = (fileToRemove: File) => {
    if (!selectedFiles) return;

    const dt = createDataTransferWithoutFile(selectedFiles, fileToRemove);
    const newFiles = dt.files;

    setSelectedFiles(newFiles.length > 0 ? newFiles : null);
    // Only set the value if there are files, otherwise reset the field
    if (newFiles.length > 0) {
      form.setValue("files", newFiles, { shouldValidate: true });
    } else {
      form.resetField("files");
    }
  };

  // Handle clearing all files
  const handleClearFiles = () => {
    setSelectedFiles(null);
    // Reset the field instead of setting to undefined
    form.resetField("files");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <FormField
        control={form.control}
        name="files"
        render={({ field: { onChange } }) => (
          <FormItem>
            <FormLabel>Backtest Files</FormLabel>
            <FormControl>
              <div
                className="relative"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, onChange)}
              >
                <Card
                  className={`cursor-pointer flex flex-col items-center justify-center p-8 border-dashed border-2 ${selectedFiles && selectedFiles.length > 0 ? "" : "hover:bg-muted"} transition ${isDragging ? "ring-2 ring-primary border-2" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFiles && selectedFiles.length > 0 ? (
                    <FileDisplayList
                      selectedFiles={selectedFiles}
                      onRemoveFile={handleRemoveFile}
                      onClearFiles={handleClearFiles}
                    />
                  ) : (
                    <>
                      <Plus className="w-6 h-6 mb-2 text-muted-foreground" />
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground mb-1">
                          Click to select a folder or drag and drop individual
                          files
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

      <AlertDialog open={showFolderAlert} onOpenChange={setShowFolderAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Folder Drop Not Allowed</AlertDialogTitle>
            <AlertDialogDescription>
              You cannot drag and drop folders directly. Please use the "Click
              to select a folder" button instead to upload folder contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFolderAlert(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
