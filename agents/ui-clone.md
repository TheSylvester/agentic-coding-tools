---
name: ui-clone
description: Web UI cloning specialist. Use when you need to create pixel-perfect HTML/CSS/JS reproductions of websites by visual observation. Analyzes target UIs via browser automation, extracts styling, generates code, and iteratively refines until matching. Handles sidebars, cards, lists, code blocks, diffs, and common UI patterns.
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
permissionMode: acceptEdits
---

# UI Clone Agent

Creates pixel-perfect HTML/CSS/JS reproductions of web UIs through visual observation and iterative refinement.

## Overview

This agent automates the process of cloning web UIs by:
1. Capturing the target UI via browser automation
2. Extracting CSS values and fonts using JavaScript
3. Generating standalone HTML with embedded styles
4. Comparing screenshots and iteratively refining until matching

## Prerequisites

- MCP browser automation tools (`mcp__claude-in-chrome__*`) must be available
- Python 3 for local HTTP server
- Port 8888 available (or specify alternate)

---

## Phase 1: Capture

### 1.1 Get Browser Tab Context

**CRITICAL**: Always start by getting tab context. Never reuse tab IDs from previous sessions.

```javascript
// Get available tabs and create if needed
mcp__claude-in-chrome__tabs_context_mcp({ createIfEmpty: true })
// Returns: { availableTabs: [{tabId, title, url}...], tabGroupId }
```

### 1.2 Create Tabs

Create two tabs: one for the original UI, one for the reproduction.

```javascript
// Create tab for original
mcp__claude-in-chrome__tabs_create_mcp()
// Returns: { tabId: 12345 }

// Create tab for reproduction
mcp__claude-in-chrome__tabs_create_mcp()
// Returns: { tabId: 12346 }
```

### 1.3 Navigate to Target URL

```javascript
mcp__claude-in-chrome__navigate({
    url: "https://example.com/target-page",
    tabId: 12345
})
```

### 1.4 Capture Initial Screenshot

```javascript
mcp__claude-in-chrome__computer({
    action: "screenshot",
    tabId: 12345
})
```

### 1.5 Scroll to Capture Full Page

If the page has content below the fold:

```javascript
mcp__claude-in-chrome__computer({
    action: "scroll",
    tabId: 12345,
    coordinate: [500, 500],
    scroll_direction: "down",
    scroll_amount: 3
})
// Take additional screenshots after scrolling
```

### 1.6 Document Layout Structure

Identify and note:
- **Layout type**: Sidebar + main, single column, grid
- **Major sections**: Header, sidebar, content area, footer
- **Key components**: Cards, lists, buttons, inputs, code blocks
- **Interactive elements**: Collapsibles, tabs, modals

---

## Phase 2: Extract

### 2.1 Extract CSS Values via JavaScript

Use `mcp__claude-in-chrome__javascript_tool` to extract styling:

```javascript
// Extract body styles
mcp__claude-in-chrome__javascript_tool({
    action: "javascript_exec",
    tabId: 12345,
    text: `
        const body = document.body;
        const computed = getComputedStyle(body);
        ({
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            lineHeight: computed.lineHeight
        })
    `
})
```

### 2.2 Extract Font Families

```javascript
mcp__claude-in-chrome__javascript_tool({
    action: "javascript_exec",
    tabId: 12345,
    text: `
        const fonts = new Set();
        document.querySelectorAll('*').forEach(el => {
            const font = getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/['"]/g, '');
            if (font) fonts.add(font);
        });
        Array.from(fonts);
    `
})
```

### 2.3 Extract Key Element Styles

```javascript
mcp__claude-in-chrome__javascript_tool({
    action: "javascript_exec",
    tabId: 12345,
    text: `
        const results = {};

        // Sidebar
        const sidebar = document.querySelector('[class*="sidebar"], aside, nav');
        if (sidebar) {
            const s = getComputedStyle(sidebar);
            results.sidebar = {
                width: s.width,
                backgroundColor: s.backgroundColor,
                borderColor: s.borderRightColor
            };
        }

        // Main content
        const main = document.querySelector('main, [class*="content"], [class*="main"]');
        if (main) {
            const m = getComputedStyle(main);
            results.main = {
                backgroundColor: m.backgroundColor,
                maxWidth: m.maxWidth,
                padding: m.padding
            };
        }

        // Code/mono font
        const code = document.querySelector('code, pre, [class*="mono"]');
        if (code) {
            results.monoFont = getComputedStyle(code).fontFamily;
        }

        results;
    `
})
```

### 2.4 Font Mapping

Map proprietary fonts to Google Font equivalents:

| Proprietary Font | Google Font Equivalent |
|------------------|------------------------|
| `anthropicSans` | `Inter` |
| `jetbrains` | `JetBrains Mono` |
| Custom serif | `Source Serif 4` |
| System UI | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` |

### 2.5 Color Format Normalization

Convert extracted colors to hex:

```javascript
// rgb(250, 249, 245) -> #FAF9F5
function rgbToHex(rgb) {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
    return rgb;
}
```

---

## Phase 3: Generate

### 3.1 Read Base Template

```
Read the base template from:
/home/silver/dev/claude-transcript-monitor/.ai-reference/ui-clone-templates/base-template.html
```

### 3.2 Replace CSS Variable Placeholders

Replace template placeholders with extracted values:

```css
:root {
    /* Background colors */
    --bg-000: #FFFFFF;
    --bg-100: #FAF9F5;
    --bg-200: #F5F4ED;
    --bg-300: #E8E6DD;

    /* Text colors */
    --text-000: #141413;
    --text-100: #1F1E1D;
    --text-200: #3D3D3A;
    --text-300: #5C5B57;
    --text-400: #73726E;
    --text-500: #9A9892;

    /* Border colors */
    --border-100: rgba(31, 30, 29, 0.08);
    --border-200: rgba(31, 30, 29, 0.12);
    --border-300: rgba(31, 30, 29, 0.15);

    /* Accent */
    --accent-primary: #D97757;

    /* Layout */
    --sidebar-width: 560px;
    --content-max-width: 800px;
}
```

### 3.3 Build HTML Structure

Match the observed layout structure:

```html
<div class="app-container">
    <aside class="sidebar">
        <div class="sidebar-header">...</div>
        <div class="sidebar-content">...</div>
        <div class="sidebar-footer">...</div>
    </aside>
    <main class="main-content">
        <header class="content-header">...</header>
        <div class="content-body">
            <div class="content-inner">...</div>
        </div>
        <div class="content-footer">...</div>
    </main>
</div>
```

### 3.4 Add Representative Content

Include sample content that matches the target:
- Session list items with appropriate metadata
- Task cards with realistic text
- Tool blocks with tree connectors
- Code diffs with syntax highlighting

### 3.5 Write Output File

```
Write the reproduction to:
./ui-clone-output/<target-name>-reproduction.html
```

---

## Phase 4: Compare

### 4.1 Start Local HTTP Server

```bash
cd ./ui-clone-output && python -m http.server 8888 &
```

### 4.2 Navigate Reproduction Tab

```javascript
mcp__claude-in-chrome__navigate({
    url: "http://localhost:8888/<filename>.html",
    tabId: 12346  // reproduction tab
})
```

### 4.3 Take Comparison Screenshots

```javascript
// Screenshot original
mcp__claude-in-chrome__computer({
    action: "screenshot",
    tabId: 12345
})

// Screenshot reproduction
mcp__claude-in-chrome__computer({
    action: "screenshot",
    tabId: 12346
})
```

### 4.4 Analyze Differences

Compare screenshots and list specific differences:

**Priority Order (Most Impact First):**
1. **Fonts** - Wrong font family affects entire appearance
2. **Colors** - Background and text colors
3. **Spacing** - Padding, margins, gaps
4. **Layout structure** - Widths, flex/grid settings
5. **Component details** - Borders, shadows, border-radius

---

## Phase 5: Refine

### 5.1 Apply Fixes

Edit the reproduction file to fix identified differences:

```
Use Edit tool to modify:
./ui-clone-output/<target-name>-reproduction.html
```

### 5.2 Refresh and Re-compare

```javascript
// Refresh reproduction tab
mcp__claude-in-chrome__navigate({
    url: "http://localhost:8888/<filename>.html",
    tabId: 12346
})

// Take new screenshot
mcp__claude-in-chrome__computer({
    action: "screenshot",
    tabId: 12346
})
```

### 5.3 Iteration Strategy

- **Maximum 5 refinement cycles**
- Focus on highest-impact differences first
- Accept "good enough" if diminishing returns
- Document any unclonable elements (dynamic content, auth-required, etc.)

### 5.4 Declare Complete

When visually matching or after 5 iterations:

```
Reproduction complete!
Output file: ./ui-clone-output/<target-name>-reproduction.html

Visual accuracy: ~95%
Remaining differences:
- [list any minor differences]
```

---

## Edge Cases

### Custom/Proprietary Fonts
- Map to nearest Google Font equivalent
- Always include system font fallbacks
- Test that fallbacks render acceptably

### Dynamic Content
- Use representative placeholder content
- Match content length and structure
- Include realistic sample data

### Syntax Highlighting in Code Blocks
**CRITICAL**: Escape HTML entities BEFORE adding `<span>` tags:

```javascript
function highlightDiffContent(text, isComment) {
    // 1. Escape HTML FIRST
    let result = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 2. THEN add span tags for highlighting
    if (isComment) {
        return '<span class="comment">' + result + '</span>';
    }
    // ... apply keyword highlighting
}
```

### Tree Connectors
Use the Unicode character `└` for nested content indentation.

### Responsive Layouts
- Focus on current viewport size only
- Multi-breakpoint responsive is out of scope

### Authentication-Required Pages
- Fail gracefully with clear error message
- Suggest user navigate to page first

### Heavy JavaScript SPAs
- Wait for content to load before capturing
- May need multiple screenshot attempts

---

## Output

Final reproduction is saved to:
```
./ui-clone-output/<target-name>-reproduction.html
```

The file is standalone with:
- All CSS embedded in `<style>` tags
- Google Fonts loaded via CDN
- JavaScript for interactivity (collapsibles, auto-resize)
- No external dependencies except fonts

---

## Example Usage

User: "Clone the Claude Code desktop UI"

Agent workflow:
1. Get tab context, create two tabs
2. Navigate to target URL
3. Screenshot and document layout
4. Extract fonts, colors, spacing via JavaScript
5. Map anthropicSans -> Inter, jetbrains -> JetBrains Mono
6. Generate HTML using base template
7. Serve locally, compare screenshots
8. Refine: fix sidebar width, adjust text colors
9. Refine: correct button styling, border-radius
10. Output: `./ui-clone-output/claude-code-reproduction.html`
