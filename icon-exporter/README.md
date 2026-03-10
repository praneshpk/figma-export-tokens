# Icon Exporter

A custom Figma plugin that exports all layers within a selected group or frame as individual files, zipped and named after each layer.

## Setup

### 1. Install Figma Desktop

The plugin API is only available in the Figma desktop app. Download it from [figma.com/downloads](https://www.figma.com/downloads/).

### 2. Clone this repo

```bash
git clone <repo-url>
cd <repo-name>
```

### 3. Load the plugin in Figma

1. Open Figma Desktop and navigate to any project
2. Right-click anywhere on the canvas
3. Go to **Plugins → Development → Import plugin from manifest...**
4. Browse to this repo and select the `manifest.json` file

The plugin will now appear under **Plugins → Development** in any project.

## Usage

1. Select a group or frame that contains your icons in the layers panel
2. Right-click → **Plugins → Development → Icon Exporter**
3. Choose your export format (SVG, PNG, or PDF)
4. Click **Export selected**

A `.zip` file named after your selected group will download, containing one file per child layer.

## Filename conventions

Each exported file is named after its layer:

- Plain layers (e.g. `close`) → `close.svg`
- Variant components (e.g. `Name=Arrow, Size=16`) → `Arrow-16.svg` — the property keys are stripped and only the values are used
