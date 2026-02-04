import * as vscode from 'vscode';

export class StatusBarManager {
    private readonly statusBarItem: vscode.StatusBarItem;
    private isEnabled: boolean = true;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'r-auto-jump.showConflictStatus';
        this.updateConfiguration();
    }

    public updateConfiguration() {
        const config = vscode.workspace.getConfiguration('r-auto-jump');
        this.isEnabled = config.get<boolean>('showStatusBar', true);
        
        if (!this.isEnabled) {
            this.statusBarItem.hide();
        }
    }

    public updateConflictCount(count: number) {
        if (!this.isEnabled) {
            return;
        }

        if (count > 0) {
            this.statusBarItem.text = `$(warning) ${count} conflict${count !== 1 ? 's' : ''}`;
            this.statusBarItem.tooltip = `${count} unresolved merge conflict${count !== 1 ? 's' : ''} in workspace. Click for details.`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.show();
        } else {
            this.statusBarItem.text = `$(check) No conflicts`;
            this.statusBarItem.tooltip = 'No merge conflicts found';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.show();
        }
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}
