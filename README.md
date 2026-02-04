# R Auto Jump - Merge Conflict Navigator

Automatically navigate through merge conflicts in your codebase with ease! Resolve conflicts faster with smart auto-jump that automatically takes you to the next conflict after you resolve the current one.

## ✨ Features

- ⚡ **Smart Auto-Jump** - After resolving a conflict, automatically jumps to the next one after 2 seconds (configurable)
- 🚀 **Manual Navigation** - Press `Ctrl+Alt+N` (or `Cmd+Alt+N` on Mac) to jump to the next conflict marker anytime
- 📂 **Auto-open Next File** - When you resolve all conflicts in the current file, automatically opens the next conflicted file
- 📊 **Status Bar Indicator** - See at a glance how many conflicts remain in your workspace
- ⌨️ **Keyboard Shortcuts** - Navigate quickly with intuitive keybindings
- 🎯 **Smart Detection** - Detects standard Git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`
- ⚙️ **Fully Configurable** - Customize auto-jump delay, enable/disable features, and more

## 🎬 How It Works

1. **Merge** your branches and conflicts appear
2. **Open** a file with conflicts
3. **Resolve** a conflict by clicking "Accept Current" or "Accept Incoming"
4. **Wait 2 seconds** - Extension automatically jumps to the next conflict! 🎯
5. **Repeat** until all conflicts are resolved
6. **Next file** opens automatically when current file is done

No need to manually search for conflicts anymore!

## 📖 Usage

### Commands

All commands are available via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Jump to Next Conflict** (`Ctrl+Alt+N` / `Cmd+Alt+N`) - Navigate to the next unresolved conflict in the current file
- **Jump to Previous Conflict** (`Ctrl+Alt+P` / `Cmd+Alt+P`) - Navigate to the previous conflict
- **Open Next Conflicted File** - Manually open the next file with conflicts
- **Show Conflict Status** - Display detailed conflict statistics (click status bar icon)

### Typical Workflow

1. After a merge with conflicts, open any conflicted file
2. Resolve the first conflict (Accept Current/Incoming/Both)
3. **Wait 2 seconds** → Extension automatically jumps to next conflict ⚡
4. Continue resolving conflicts
5. When all conflicts in the file are resolved, the next conflicted file opens automatically!

### Manual Navigation

Don't want to wait? Press `Ctrl+Alt+N` anytime to jump immediately!

## ⚙️ Configuration

Configure the extension through VS Code settings (`Ctrl+,` / `Cmd+,`):

```json
{
  // Enable/disable automatic jumping after conflict resolution
  "r-auto-jump.autoJumpEnabled": true,
  
  // Delay in milliseconds before auto-jumping (500-10000)
  "r-auto-jump.autoJumpDelay": 2000,
  
  // Automatically open next conflicted file when current is resolved
  "r-auto-jump.autoOpenNextFile": true,
  
  // Show conflict count in status bar
  "r-auto-jump.showStatusBar": true,
  
  // Custom conflict markers (advanced)
  "r-auto-jump.conflictMarkers": {
    "start": "<<<<<<<",
    "middle": "=======",
    "end": ">>>>>>>"
  }
}
```

### Settings Details

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoJumpEnabled` | boolean | `true` | Enable automatic jumping to next conflict after resolution |
| `autoJumpDelay` | number | `2000` | Milliseconds to wait before auto-jumping (500-10000ms) |
| `autoOpenNextFile` | boolean | `true` | Open next conflicted file when current file is fully resolved |
| `showStatusBar` | boolean | `true` | Display conflict count in status bar |
| `conflictMarkers` | object | Git defaults | Custom conflict markers for non-standard merge tools |

## 📋 Requirements

- VS Code 1.85.0 or higher
- Git (for merge conflicts)

## 🐛 Known Issues

None yet! Please report issues on [GitHub](https://github.com/your-username/r-auto-jump/issues).

## 📝 Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 0.1.0 (Latest)

Initial release with smart auto-jump features:
- ⚡ Automatic jumping to next conflict after resolution (2-second delay)
- 🚀 Manual navigation with keyboard shortcuts
- 📂 Auto-open next conflicted file
- 📊 Status bar indicator
- ⚙️ Fully configurable settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request on [GitHub](https://github.com/your-username/r-auto-jump).

## 📄 License

MIT - See [LICENSE](LICENSE) file for details

## 💡 Tips

- **Fast workflow**: Resolve conflicts quickly, extension handles navigation automatically
- **Customize delay**: Prefer faster? Set `autoJumpDelay` to `1000` (1 second)
- **Manual control**: Press `Ctrl+Alt+N` anytime to jump without waiting
- **Status bar**: Click the conflict counter for detailed statistics

---

**Enjoy faster merge conflict resolution!** ⚡ If you find this extension helpful, please consider leaving a review on the marketplace!
