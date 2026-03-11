// Show UI
figma.showUI(__html__, { width: 400, height: 320 });

figma.ui.onmessage = async function (msg) {
  if (msg.type === "export") {
    var template = msg.template || "{Name}-{Size}";
    var format = msg.format || "SVG";
    var selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "error",
        message: "Select a group or frame first.",
      });
      return;
    }

    // Collect direct children of each selected group/frame
    var nodes = [];
    for (var s = 0; s < selection.length; s++) {
      var sel = selection[s];
      if ("children" in sel && sel.children.length > 0) {
        for (var c = 0; c < sel.children.length; c++) {
          nodes.push(sel.children[c]);
        }
      } else {
        nodes.push(sel);
      }
    }

    if (nodes.length === 0) {
      figma.ui.postMessage({
        type: "error",
        message: "No exportable layers found in selection.",
      });
      return;
    }

    // Deduplicate by smallest size if SVG
    if (format === "SVG") {
      nodes = dedupeBySmallestSize(nodes);
    }

    var files = [];

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var filename = buildFilename(node, format === "SVG");
      var ext = format.toLowerCase();
      var settings = {
        format: format,
        constraint: { type: "SCALE", value: 1 },
      };

      try {
        var bytes = await node.exportAsync(settings);

        files.push({ name: filename + "." + ext, bytes: Array.from(bytes) });
      } catch (e) {
        figma.ui.postMessage({
          type: "error",
          message: "Failed to export " + node.name + ": " + e.message,
        });
        return;
      }
    }

    var zipName =
      selection.length === 1 ? sanitize(selection[0].name) : "icons";
    figma.ui.postMessage({ type: "download", files: files, zipName });
  }

  if (msg.type === "cancel" || msg.type === "done") {
    figma.closePlugin();
  }
};

// ----------------------
// Helpers
// ----------------------

function buildFilename(node, isSvg) {
  var name = node.name;

  // Variant format: "Name=Arrow, Size=16"
  if (name.indexOf("=") !== -1) {
    var parts = name.split(",");
    var values = [];
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].trim().split("=");
      if (pair.length === 2) values.push(pair[1].trim());
    }
    if (values.length) {
      var filename = values.join("-");
      // If SVG, strip the last part (assumed to be size)
      if (isSvg) {
        var segments = filename.split("-");
        segments.pop(); // remove last size
        filename = segments.join("-");
      }
      return sanitize(filename).replace(/-$/, ""); // remove trailing dash
    }
  }

  // Plain name — strip leading path segments
  var baseName = name.split("/").pop().trim();
  if (isSvg) {
    // Remove trailing "-<number>" for SVG
    var match = baseName.match(/^(.+?)[-_]\d+$/);
    if (match) baseName = match[1];
  }
  return sanitize(baseName).replace(/-$/, ""); // remove trailing dash
}

function extractNameAndSize(node) {
  var name = node.name;
  var iconName = null;
  var size = Infinity;

  // Variant property format
  if (name.indexOf("=") !== -1) {
    var props = parseVariantName(name);
    iconName = props["Name"] || null;
    var sizeVal = parseInt(props["Size"], 10);
    if (!isNaN(sizeVal)) size = sizeVal;
  }

  // Suffix format: "arrow-16" or plain "arrow"
  if (!iconName) {
    var match = name.match(/^(.+?)[-_](\d+)$/);
    if (match) {
      iconName = match[1].trim();
      size = parseInt(match[2], 10);
    } else {
      iconName = name;
    }
  }

  return { iconName: iconName.toLowerCase(), size: size };
}

function dedupeBySmallestSize(nodes) {
  var best = {}; // iconName → { node, size }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var extracted = extractNameAndSize(node);
    var key = extracted.iconName;
    var size = extracted.size;

    if (!best[key] || size < best[key].size) {
      best[key] = { node: node, size: size };
    }
  }

  var result = [];
  var keys = Object.keys(best);
  for (var k = 0; k < keys.length; k++) {
    result.push(best[keys[k]].node);
  }
  return result;
}

function parseVariantName(name) {
  var props = {};
  var parts = name.split(",");
  for (var i = 0; i < parts.length; i++) {
    var pair = parts[i].trim().split("=");
    if (pair.length === 2) {
      props[pair[0].trim()] = pair[1].trim();
    }
  }
  return props;
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9._()-]/g, "-").replace(/-+/g, "-");
}
