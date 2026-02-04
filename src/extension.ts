import * as vscode from 'vscode';
import { ConflictNavigator } from './conflictNavigator';
import { ConflictDetector } from './conflictDetector';
import { StatusBarManager } from './statusBarManager';

let conflictNavigator: ConflictNavigator;
let conflictDetector: ConflictDetector;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('R Auto Jump extension is now active!');

    // Initialize managers
    conflictDetector = new ConflictDetector();
    statusBarManager = new StatusBarManager();
    conflictNavigator = new ConflictNavigator(conflictDetector, statusBarManager);

    // Register commands
    const jumpToNextConflict = vscode.commands.registerCommand(
        'r-auto-jump.jumpToNextConflict',
        () => conflictNavigator.jumpToNextConflict()
    );

    const jumpToPreviousConflict = vscode.commands.registerCommand(
        'r-auto-jump.jumpToPreviousConflict',
        () => conflictNavigator.jumpToPreviousConflict()
    );

    const openNextConflictedFile = vscode.commands.registerCommand(
        'r-auto-jump.openNextConflictedFile',
        () => conflictNavigator.openNextConflictedFile()
    );

    const showConflictStatus = vscode.commands.registerCommand(
        'r-auto-jump.showConflictStatus',
        () => conflictNavigator.showConflictStatus()
    );

    // Listen to document changes
    const onDocumentChange = vscode.workspace.onDidChangeTextDocument((event) => {
        conflictNavigator.onDocumentChanged(event);
    });

    // Listen to active editor changes
    const onActiveEditorChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
        conflictNavigator.onActiveEditorChanged(editor);
    });

    // Listen to configuration changes
    const onConfigChange = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('r-auto-jump')) {
            statusBarManager.updateConfiguration();
        }
    });

    // Initial scan
    conflictNavigator.scanWorkspace();

    // Add to subscriptions
    context.subscriptions.push(
        jumpToNextConflict,
        jumpToPreviousConflict,
        openNextConflictedFile,
        showConflictStatus,
        onDocumentChange,
        onActiveEditorChange,
        onConfigChange,
        statusBarManager
    );
}

export function deactivate() {
    if (statusBarManager) {
        statusBarManager.dispose();
    }
    if (conflictNavigator) {
        conflictNavigator.dispose();
    }
}
