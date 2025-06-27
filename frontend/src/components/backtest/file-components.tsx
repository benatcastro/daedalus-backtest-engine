import { File, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { processFileStructure } from "@/lib/file-utils";

/**
 * Properties for an individual file item component
 */
interface FileItemProps {
    file: File;
    fileName: string;
    onRemove: (file: File) => void;
}

/**
 * Displays a single file with remove option
 */
export function FileItem({ file, fileName, onRemove }: FileItemProps) {
    return (
        <li className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded group">
            <File className="h-3 w-3 flex-shrink-0" />
            <span className="truncate" title={fileName || file.name}>
                {fileName || file.name}
            </span>
            <button
                type="button"
                className="text-xs opacity-0 group-hover:opacity-100 hover:text-destructive focus:outline-none ml-auto p-1 rounded-full hover:bg-background transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file);
                }}
                aria-label={`Remove ${fileName || file.name}`}
            >
                ✕
            </button>
        </li>
    );
}

/**
 * Properties for the folder tree view component
 */
interface FolderTreeViewProps {
    selectedFiles: FileList;
    onRemoveFile: (fileToRemove: File) => void;
}

/**
 * Displays a hierarchical view of folders and files
 */
export function FolderTreeView({ selectedFiles, onRemoveFile }: FolderTreeViewProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Toggle folder expansion
    const toggleFolder = (folderPath: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(folderPath)) {
                newSet.delete(folderPath);
            } else {
                newSet.add(folderPath);
            }
            return newSet;
        });
    };

    // Process files into a folder structure for display
    const { filesByFolder, allFolderPaths } = processFileStructure(selectedFiles);

    // Create a tree structure for folders
    const folderTree: Record<string, string[]> = {};
    const rootFolders: string[] = [];

    // Identify root folders and child relationships
    allFolderPaths.sort().forEach((path) => {
        const parts = path.split("/");
        if (parts.length === 1) {
            rootFolders.push(path);
        } else {
            const parentPath = parts.slice(0, parts.length - 1).join("/");
            if (!folderTree[parentPath]) {
                folderTree[parentPath] = [];
            }
            folderTree[parentPath].push(path);
        }
    });

    // Add standalone files at root level
    if (filesByFolder[""] && filesByFolder[""].length > 0) {
        rootFolders.unshift("");
    }

    // Recursive function to render a folder and its contents
    const renderFolder = (folderPath: string, depth: number = 0) => {
        const files = filesByFolder[folderPath] || [];
        const isExpanded = expandedFolders.has(folderPath);
        const folderName = folderPath ? folderPath.split("/").pop() : "Files";
        const childFolders = folderTree[folderPath] || [];
        const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : "";

        return (
            <div key={folderPath} className="mb-2">
                {/* Folder header with toggle */}
                <div
                    className={`flex items-center gap-1 hover:bg-muted p-1 rounded cursor-pointer ${indentClass}`}
                    onClick={(e) => toggleFolder(folderPath, e)}
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{folderName || "Root"}</span>
                    <span className="text-xs text-muted-foreground">
                        ({files.length} files
                        {childFolders.length > 0 ? ` + ${childFolders.length} folders` : ""})
                    </span>
                </div>

                {/* Files and subfolders (shown when expanded) */}
                {isExpanded && (
                    <div className="ml-6">
                        {/* First render subfolders */}
                        {childFolders.map((childPath) => renderFolder(childPath, depth + 1))}

                        {/* Then render files */}
                        {files.length > 0 && (
                            <ul className="mt-1">
                                {files.map((file, idx) => {
                                    // Extract just the filename from the path
                                    const fileName = file.webkitRelativePath
                                        ? file.webkitRelativePath.split("/").pop()
                                        : file.name;

                                    return (
                                        <FileItem
                                            key={`${folderPath}-${idx}`}
                                            file={file}
                                            fileName={fileName || file.name}
                                            onRemove={onRemoveFile}
                                        />
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            <div className="max-h-40 overflow-y-auto border rounded p-2">
                {rootFolders.map((folderPath) => renderFolder(folderPath))}
            </div>
        </div>
    );
}

/**
 * Properties for the file display list component
 */
interface FileDisplayListProps {
    selectedFiles: FileList;
    onRemoveFile: (fileToRemove: File) => void;
    onClearFiles: () => void;
}

/**
 * Component to display selected files with clear option
 */
export function FileDisplayList({
    selectedFiles,
    onRemoveFile,
    onClearFiles,
}: FileDisplayListProps) {
    if (!selectedFiles || selectedFiles.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{selectedFiles.length} files selected</span>
                <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClearFiles();
                    }}
                >
                    Clear
                </button>
            </div>
            <FolderTreeView selectedFiles={selectedFiles} onRemoveFile={onRemoveFile} />
        </div>
    );
}
