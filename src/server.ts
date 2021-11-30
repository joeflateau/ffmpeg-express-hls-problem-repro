import { spawn } from "child_process";
import express from "express";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import inquirer from "inquirer";
import { tmpdir } from "os";
import { join as joinPath, parse } from "path";
import { PassThrough, Readable } from "stream";
import { pipeline } from "stream/promises";

async function main() {
  const app = express();

  const { shouldUsePassthrough }: { shouldUsePassthrough: boolean } =
    await inquirer.prompt([
      {
        type: "list",
        name: "shouldUsePassthrough",
        message: "Pipeline?",
        choices: [
          { value: false, name: "Only use pipe/pipeline (should throw)" },
          ,
          {
            value: true,
            name: "Use on('data')/on('end')/on('error') (should not throw)",
          },
        ],
      },
    ]);

  app.route("/upload/:filePath(*)").post(async (req, res) => {
    const tempFile = joinPath(tmpdir(), parse(req.url).name);
    try {
      await pipeline(
        shouldUsePassthrough ? asPassthrough(req) : req,
        createWriteStream(tempFile)
      );
      res.sendStatus(200);
      console.log(`upload success ${req.url}`);
    } catch (err) {
      console.error(`⛔️ upload failed ${req.url}`);
      console.error(err);
      res.sendStatus(500);
    } finally {
      await unlink(tempFile);
    }
  });

  app.listen(9025, () => console.log(`listening on 9025`));

  spawn(
    "ffmpeg",
    [
      "-re",
      ["-f", "lavfi", "-i", "smptehdbars=rate=30:size=1920x1080"],
      ["-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000"],
      ["-c:v", "libx264", "-b:v", "2000k"],
      ["-c:a", "aac", "-b:a", "128k", "-ar", "48000"],
      ["-map", "0:v"],
      ["-map", "1:a"],
      ["-hls_playlist_type", "event"],
      ["-hls_time", "8"],
      ["-master_pl_name", `master.m3u8`],
      ["-f", "hls"],
      ["-method", "POST"],
      [`http://localhost:9025/upload/v%v/stream.m3u8`],
    ].flat(),
    { stdio: "inherit" }
  );
}

if (module === require.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

function asPassthrough(req: express.Request): Readable {
  const passthrough = new PassThrough();
  req.on("data", (chunk) => passthrough.write(chunk));
  req.on("end", () => passthrough.end());
  req.on("error", (err) => {
    console.error(`⛔️ passthrough error ${err}`);
  });
  return passthrough;
}
