import path from "node:path";
import { Command } from "commander";
import { merge } from "@mdmerge/core";
import type { OrderStrategy } from "@mdmerge/core";

const program = new Command()
  .name("mdmerge")
  .description("Merge multiple Markdown files into a single document")
  .argument("<directory>", "Directory containing .md files")
  .option("-o, --output <file>", "Output file path")
  .option(
    "--order <strategy>",
    'Order strategy: "filename", "created", or "index"',
    "filename",
  )
  .option("--no-toc", "Disable table of contents")
  .option("--no-recursive", "Do not recurse into subdirectories")
  .option("--separator <string>", "Section separator", "\n---\n\n")
  .option("--heading-offset <n>", "Offset heading levels", "0")
  .option("--ignore <patterns...>", 'Glob patterns to ignore (e.g., "merged.md" "draft-*")')
  .action(
    async (
      directory: string,
      options: {
        output?: string;
        order: string;
        toc: boolean;
        recursive: boolean;
        separator: string;
        headingOffset: string;
        ignore?: string[];
      },
    ) => {
      try {
        const result = await merge({
          inputDir: path.resolve(directory),
          outputPath: options.output
            ? path.resolve(options.output)
            : undefined,
          order: options.order as OrderStrategy,
          toc: options.toc,
          recursive: options.recursive,
          separator: options.separator,
          headingOffset: parseInt(options.headingOffset, 10),
          ignore: options.ignore,
        });

        if (!options.output) {
          process.stdout.write(result);
        } else {
          console.log(`Merged document written to ${options.output}`);
        }
      } catch (error) {
        console.error(
          `Error: ${error instanceof Error ? error.message : error}`,
        );
        process.exit(1);
      }
    },
  );

program.parse();
