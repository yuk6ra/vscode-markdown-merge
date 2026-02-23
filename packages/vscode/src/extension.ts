import * as vscode from "vscode";
import { merge } from "@mdmerge/core";
import type { OrderStrategy } from "@mdmerge/core";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "mdmerge.mergeFolder",
    async (uri: vscode.Uri) => {
      const folderPath = uri.fsPath;

      // Prompt for ordering strategy
      const order = await vscode.window.showQuickPick(
        [
          {
            label: "filename",
            description: "Sort by filename (alphabetical)",
          },
          {
            label: "created",
            description: "Sort by creation date",
          },
          {
            label: "index",
            description: "Use index.json for custom order",
          },
        ],
        { placeHolder: "Select file ordering strategy" },
      );
      if (!order) return;

      // Prompt for output location
      const outputUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${folderPath}/merged.md`),
        filters: { Markdown: ["md"] },
        title: "Save merged Markdown",
      });

      try {
        const result = await merge({
          inputDir: folderPath,
          outputPath: outputUri?.fsPath,
          order: order.label as OrderStrategy,
          toc: true,
          recursive: true,
        });

        // Open result in editor
        const doc = await vscode.workspace.openTextDocument({
          content: result,
          language: "markdown",
        });
        await vscode.window.showTextDocument(doc);

        if (outputUri) {
          vscode.window.showInformationMessage(
            `Merged document saved to ${outputUri.fsPath}`,
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `mdmerge: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
