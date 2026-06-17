/**
 * Utility functions for file handling in backtest uploads
 */

/**
 * Process files to create a folder structure
 * @param files FileList to process
 * @returns Object containing files grouped by folder and all folder paths
 */
export const processFileStructure = (files: FileList) => {
    const filesByFolder: Record<string, File[]> = {};
    // Keep track of all unique folder paths for proper nesting
    const allFolderPaths = new Set<string>();

    Array.from(files).forEach((file) => {
        // Get the file path relative to the root folder
        const relativePath = file.webkitRelativePath;
        // Extract the folder path from the relative path
        const folderPath = relativePath.split("/").slice(0, -1).join("/");

        // Add the file to its corresponding folder
        if (!filesByFolder[folderPath]) {
            filesByFolder[folderPath] = [];
        }
        filesByFolder[folderPath].push(file);

        // Add the folder and all parent folders to allFolderPaths
        if (folderPath) {
            // Add the current folder
            allFolderPaths.add(folderPath);

            // Add all parent folders
            let parentPath = folderPath;
            while (parentPath.includes("/")) {
                parentPath = parentPath.split("/").slice(0, -1).join("/");
                allFolderPaths.add(parentPath);
            }
        }
    });

    return { filesByFolder, allFolderPaths: Array.from(allFolderPaths) };
};

/**
 * Create a DataTransfer object from files excluding a specific file
 * @param files Original FileList
 * @param fileToRemove File to exclude
 * @returns New DataTransfer object with the remaining files
 */
export const createDataTransferWithoutFile = (
    files: FileList,
    fileToRemove: File,
): DataTransfer => {
    const dt = new DataTransfer();
    Array.from(files).forEach((file) => {
        if (file !== fileToRemove) {
            dt.items.add(file);
        }
    });
    return dt;
};

/**
 * Gets the parent folder path of a given folder path
 * @param folderPath The folder path to get the parent of
 * @returns The parent folder path or null if it's a root folder
 */
export const getParentFolder = (folderPath: string): string | null => {
    if (!folderPath.includes("/")) {
        return null; // This is a root folder
    }
    return folderPath.split("/").slice(0, -1).join("/");
};

/**
 * Gets the folder name from a full folder path
 * @param folderPath The full folder path
 * @returns The folder name (last segment of the path)
 */
export const getFolderName = (folderPath: string): string => {
    return folderPath.split("/").pop() || folderPath;
};

/**
 * Check if a folder is a direct child of another folder
 * @param folderPath The folder path to check
 * @param parentFolderPath The potential parent folder path
 * @returns True if folderPath is a direct child of parentFolderPath
 */
export const isDirectChild = (folderPath: string, parentFolderPath: string | null): boolean => {
    if (parentFolderPath === null) {
        // If parent is null, check if this is a top-level folder
        return !folderPath.includes("/");
    }

    const folderParts = folderPath.split("/");
    const parentParts = parentFolderPath.split("/");

    return (
        folderParts.length === parentParts.length + 1 &&
        folderPath.startsWith(parentFolderPath + "/")
    );
};
