import * as vscode from 'vscode';
import { ConflictDetector } from './conflictDetector';
import { StatusBarManager } from './statusBarManager';

export class ConflictNavigator {
    private readonly conflictedFiles: Set<string> = new Set();
    private readonly lastConflictCount: Map<string, number> = new Map();
    private autoJumpTimer: NodeJS.Timeout | null = null;
    private changeDebounceTimer: NodeJS.Timeout | null = null;

    constructor(
        private readonly conflictDetector: ConflictDetector,
        private readonly statusBarManager: StatusBarManager
    ) {}

    /**
     * Jump to the next conflict in the current file
     */
    public async jumpToNextConflict() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor');
            return;
        }

        const currentLine = editor.selection.active.line;
        const nextConflict = this.conflictDetector.findNextConflict(
            editor.document,
            currentLine
        );

        if (nextConflict) {
            const position = new vscode.Position(nextConflict.startLine, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
            vscode.window.showInformationMessage(
                `Conflict ${this.getCurrentConflictIndex(editor.document, nextConflict.startLine)} of ${this.conflictDetector.getConflictCount(editor.document)}`
            );
        } else {
            vscode.window.showInformationMessage('No more conflicts in this file');
            
            // Check if we should auto-open next file
            if (this.shouldAutoOpenNextFile()) {
                await this.openNextConflictedFile();
            }
        }
    }

    /**
     * Jump to the previous conflict in the current file
     */
    public async jumpToPreviousConflict() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor');
            return;
        }

        const currentLine = editor.selection.active.line;
        const prevConflict = this.conflictDetector.findPreviousConflict(
            editor.document,
            currentLine
        );

        if (prevConflict) {
            const position = new vscode.Position(prevConflict.startLine, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
            vscode.window.showInformationMessage(
                `Conflict ${this.getCurrentConflictIndex(editor.document, prevConflict.startLine)} of ${this.conflictDetector.getConflictCount(editor.document)}`
            );
        } else {
            vscode.window.showInformationMessage('No previous conflicts in this file');
        }
    }

    /**
     * Open the next file with conflicts
     */
    public async openNextConflictedFile() {
        const currentEditor = vscode.window.activeTextEditor;
        const currentFile = currentEditor?.document.uri.fsPath;

        const conflictedFiles = Array.from(this.conflictedFiles);
        
        if (conflictedFiles.length === 0) {
            vscode.window.showInformationMessage('No conflicted files found in workspace');
            return;
        }

        // Find next file
        let nextFile: string | null = null;
        if (currentFile) {
            const currentIndex = conflictedFiles.indexOf(currentFile);
            if (currentIndex >= 0 && currentIndex < conflictedFiles.length - 1) {
                nextFile = conflictedFiles[currentIndex + 1];
            } else {
                nextFile = conflictedFiles[0];
            }
        } else {
            nextFile = conflictedFiles[0];
        }

        if (nextFile) {
            const document = await vscode.workspace.openTextDocument(nextFile);
            const editor = await vscode.window.showTextDocument(document);
            
            // Jump to first conflict
            const firstConflict = this.conflictDetector.findNextConflict(document, -1);
            if (firstConflict) {
                const position = new vscode.Position(firstConflict.startLine, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        }
    }

    /**
     * Show detailed conflict status
     */
    public async showConflictStatus() {
        const totalFiles = this.conflictedFiles.size;
        const currentEditor = vscode.window.activeTextEditor;
        
        let message = `📊 Conflict Status:\n\n`;
        message += `Total conflicted files: ${totalFiles}\n`;

        if (currentEditor) {
            const conflicts = this.conflictDetector.getConflictCount(currentEditor.document);
            message += `Current file conflicts: ${conflicts}\n`;
        }

        message += `\nConflicted files:\n`;
        Array.from(this.conflictedFiles).forEach((file, index) => {
            const fileName = file.split(/[/\\]/).pop() || file;
            message += `${index + 1}. ${fileName}\n`;
        });

        vscode.window.showInformationMessage(message, { modal: false });
    }

    /**
     * Scan workspace for conflicted files
     */
    public async scanWorkspace() {
        this.conflictedFiles.clear();
        
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        
        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                if (this.conflictDetector.hasConflicts(document)) {
                    this.conflictedFiles.add(file.fsPath);
                    this.lastConflictCount.set(file.fsPath, this.conflictDetector.getConflictCount(document));
                }
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        this.statusBarManager.updateConflictCount(this.getTotalConflictCount());
    }

    /**
     * Handle document changes
     */
    public onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
        const document = event.document;
        const filePath = document.uri.fsPath;
        
        // Clear existing debounce timer
        if (this.changeDebounceTimer) {
            clearTimeout(this.changeDebounceTimer);
        }

        // Debounce the change detection to avoid excessive processing
        this.changeDebounceTimer = setTimeout(() => {
            this.processDocumentChange(document, filePath);
        }, 300);
    }

    /**
     * Process document changes after debouncing
     */
    private processDocumentChange(document: vscode.TextDocument, filePath: string) {
        const hasConflicts = this.conflictDetector.hasConflicts(document);
        const previousCount = this.lastConflictCount.get(filePath) || 0;
        const currentCount = this.conflictDetector.getConflictCount(document);

        // Check if a conflict was just resolved (count decreased)
        const conflictResolved = previousCount > currentCount && currentCount >= 0;

        if (hasConflicts) {
            this.conflictedFiles.add(filePath);
            this.lastConflictCount.set(filePath, currentCount);

            // If a conflict was resolved and there are still conflicts in this file
            if (conflictResolved && currentCount > 0 && this.isAutoJumpEnabled()) {
                this.scheduleAutoJump(document);
            }
        } else {
            this.conflictedFiles.delete(filePath);
            this.lastConflictCount.delete(filePath);
            
            // If all conflicts were resolved in this file
            if (previousCount > 0 && currentCount === 0) {
                vscode.window.showInformationMessage(
                    `✅ All conflicts resolved in ${document.fileName.split(/[/\\]/).pop()}!`
                );
                
                // Auto-open next file if enabled
                if (this.isAutoJumpEnabled() && this.shouldAutoOpenNextFile() && this.conflictedFiles.size > 0) {
                    this.scheduleAutoOpenNextFile();
                }
            }
        }

        this.statusBarManager.updateConflictCount(this.getTotalConflictCount());
    }

    /**
     * Schedule auto-jump to next conflict after delay
     */
    private scheduleAutoJump(document: vscode.TextDocument) {
        // Clear any existing timer
        if (this.autoJumpTimer) {
            clearTimeout(this.autoJumpTimer);
        }

        const delay = this.getAutoJumpDelay();
        
        this.autoJumpTimer = setTimeout(async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
                const currentLine = editor.selection.active.line;
                const nextConflict = this.conflictDetector.findNextConflict(document, currentLine);
                
                if (nextConflict) {
                    const position = new vscode.Position(nextConflict.startLine, 0);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(
                        new vscode.Range(position, position),
                        vscode.TextEditorRevealType.InCenter
                    );
                    
                    const conflictIndex = this.getCurrentConflictIndex(document, nextConflict.startLine);
                    const totalConflicts = this.conflictDetector.getConflictCount(document);
                    vscode.window.showInformationMessage(
                        `🔄 Auto-jumped to conflict ${conflictIndex} of ${totalConflicts}`
                    );
                }
            }
        }, delay);
    }

    /**
     * Schedule auto-open next file after delay
     */
    private scheduleAutoOpenNextFile() {
        // Clear any existing timer
        if (this.autoJumpTimer) {
            clearTimeout(this.autoJumpTimer);
        }

        const delay = this.getAutoJumpDelay();
        
        this.autoJumpTimer = setTimeout(async () => {
            await this.openNextConflictedFile();
        }, delay);
    }

    /**
     * Handle active editor changes
     */
    public onActiveEditorChanged(editor: vscode.TextEditor | undefined) {
        if (editor) {
            const conflicts = this.conflictDetector.getConflictCount(editor.document);
            this.statusBarManager.updateConflictCount(this.getTotalConflictCount());
        }
    }

    private getCurrentConflictIndex(document: vscode.TextDocument, line: number): number {
        const conflicts = this.conflictDetector.detectConflicts(document);
        for (let i = 0; i < conflicts.length; i++) {
            if (conflicts[i].startLine === line) {
                return i + 1;
            }
        }
        return 0;
    }

    private getTotalConflictCount(): number {
        return Array.from(this.lastConflictCount.values()).reduce((sum, count) => sum + count, 0);
    }

    private shouldAutoOpenNextFile(): boolean {
        const config = vscode.workspace.getConfiguration('r-auto-jump');
        return config.get<boolean>('autoOpenNextFile', true);
    }

    private isAutoJumpEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('r-auto-jump');
        return config.get<boolean>('autoJumpEnabled', true);
    }

    private getAutoJumpDelay(): number {
        const config = vscode.workspace.getConfiguration('r-auto-jump');
        return config.get<number>('autoJumpDelay', 2000);
    }

    /**
     * Clean up timers
     */
    public dispose() {
        if (this.autoJumpTimer) {
            clearTimeout(this.autoJumpTimer);
        }
        if (this.changeDebounceTimer) {
            clearTimeout(this.changeDebounceTimer);
        }
    }
}
