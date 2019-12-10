import {Compilation, Execution, Runtime} from "@spica-server/function/runtime";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

export class Node extends Runtime {
  name: string = this.constructor.name;

  async compile(compilation: Compilation): Promise<void> {
    await super.prepare(compilation);

    await fs.promises.symlink(
      path.join(compilation.cwd, "node_modules"),
      path.join(compilation.cwd, ".build", "node_modules"),
      "dir"
    );

    const entrypoint = path.resolve(compilation.cwd, compilation.entrypoint);

    const options: ts.CompilerOptions = {
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2018,
      outDir: path.resolve(compilation.cwd, ".build"),
      sourceMap: true,
      allowJs: true,
      skipDefaultLibCheck: true
    };

    const program = ts.createProgram({
      rootNames: [entrypoint],
      options
    });

    program.emit();
  }

  async execute(execution: Execution): Promise<number> {
    return new Promise((resolve, reject) => {
      const worker = child_process.spawn(
        `node`,
        [
          "--experimental-modules",
          "--enable-source-maps",
          "--unhandled-rejections=strict",
          `--experimental-loader=${path.join(__dirname, "runtime", "bootstrap.js")}`
        ],
        {
          stdio: "inherit",
          env: {
            PATH: process.env.PATH,
            EVENT_ID: execution.eventId,
            ENTRYPOINT: "index.js",
            RUNTIME: "node"
          },
          cwd: path.join(execution.cwd, ".build")
        }
      );

      worker.once("error", e => {
        reject(e);
      });

      worker.once("exit", (code, signal) => {
        if (code == 0) {
          resolve(code);
        } else {
          reject(code);
        }
      });
    });
  }

  clear(compilation: Compilation) {
    return super.rimraf(path.join(compilation.cwd, ".build"));
  }
}
