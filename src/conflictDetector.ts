import * as vscode from 'vscode';

export interface ConflictMarker {
    line: number;
    type: 'start' | 'middle' | 'end';
    text: string;
}

export interface ConflictBlock {
    startLine: number;
    middleLine: number;
    endLine: number;
}

export class ConflictDetector {
    private conflictMarkers = {
        start: '<<<<<<<',
        middle: '=======',
        end: '>>>>>>>'
    };

    constructor() {
        this.loadConfiguration();
    }

    private loadConfiguration() {
        const config = vscode.workspace.getConfiguration('r-auto-jump');
        const markers = config.get<any>('conflictMarkers');
        if (markers) {
            this.conflictMarkers = markers;
        }
    }

    /**
     * Detect all conflict blocks in a document
     */
    public detectConflicts(document: vscode.TextDocument): ConflictBlock[] {
        const conflicts: ConflictBlock[] = [];
        const markers: ConflictMarker[] = [];

        // Find all conflict markers
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            if (text.startsWith(this.conflictMarkers.start)) {
                markers.push({ line: i, type: 'start', text: line.text });
            } else if (text.startsWith(this.conflictMarkers.middle)) {
                markers.push({ line: i, type: 'middle', text: line.text });
            } else if (text.startsWith(this.conflictMarkers.end)) {
                markers.push({ line: i, type: 'end', text: line.text });
            }
        }

        // Group markers into conflict blocks
        let startMarker: ConflictMarker | null = null;
        let middleMarker: ConflictMarker | null = null;

        for (const marker of markers) {
            if (marker.type === 'start') {
                startMarker = marker;
                middleMarker = null;
            } else if (marker.type === 'middle' && startMarker) {
                middleMarker = marker;
            } else if (marker.type === 'end' && startMarker && middleMarker) {
                conflicts.push({
                    startLine: startMarker.line,
                    middleLine: middleMarker.line,
                    endLine: marker.line
                });
                startMarker = null;
                middleMarker = null;
            }
        }

        return conflicts;
    }

    /**
     * Check if a document has any conflicts
     */
    public hasConflicts(document: vscode.TextDocument): boolean {
        return this.detectConflicts(document).length > 0;
    }

    /**
     * Find the next conflict after a given line
     */
    public findNextConflict(
        document: vscode.TextDocument,
        currentLine: number
    ): ConflictBlock | null {
        const conflicts = this.detectConflicts(document);
        
        for (const conflict of conflicts) {
            if (conflict.startLine > currentLine) {
                return conflict;
            }
        }

        return conflicts.length > 0 ? conflicts[0] : null;
    }

    /**
     * Find the previous conflict before a given line
     */
    public findPreviousConflict(
        document: vscode.TextDocument,
        currentLine: number
    ): ConflictBlock | null {
        const conflicts = this.detectConflicts(document);
        
        for (let i = conflicts.length - 1; i >= 0; i--) {
            if (conflicts[i].startLine < currentLine) {
                return conflicts[i];
            }
        }

        return conflicts.length > 0 ? conflicts[conflicts.length - 1] : null;
    }

    /**
     * Get conflict count in a document
     */
    public getConflictCount(document: vscode.TextDocument): number {
        return this.detectConflicts(document).length;
    }
}
