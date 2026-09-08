import { spawn } from "node:child_process";
import { mkdtemp, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

import type { StoredVideo } from "@/server/video/provider";
import { activeVideoProvider } from "@/server/video/registry";

const BACKGROUND = "0x2c455d";
const RESOLUTION = "1280x720";
const DURATION_SECONDS = 8;

function sanitizeForDrawtext(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['":\\]/g, " ");
}

function overlayFilter(name: string, title: string): string {
  return [
    `drawtext=text='${sanitizeForDrawtext(name)}':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2-70`,
    `drawtext=text='${sanitizeForDrawtext(title)}':fontcolor=0xb5d9fd:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+10`,
    `drawtext=text='Presentation video - demonstration':fontcolor=0x8fa9c4:fontsize=22:x=(w-text_w)/2:y=(h-text_h)/2+80`,
  ].join(",");
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg a quitté avec le code ${code}`)),
    );
  });
}

/**
 * Fabrique une video de demonstration et la confie a l'hebergeur actif.
 *
 * Le seed ne connait aucun chemin de stockage : il produit un fichier
 * temporaire, le pousse par `VideoProvider.store()` et rend la reference
 * opaque a inscrire en base — exactement comme le ferait un vrai depot.
 */
export async function generateDemoVideo(name: string, title: string): Promise<StoredVideo> {
  const workspace = await mkdtemp(join(tmpdir(), "profilsactifs-seed-"));
  const scratch = join(workspace, "presentation.mp4");

  try {
    await runFfmpeg([
      "-y",
      "-loglevel", "error",
      "-f", "lavfi", "-i", `color=c=${BACKGROUND}:s=${RESOLUTION}:d=${DURATION_SECONDS}`,
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-vf", overlayFilter(name, title),
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
      "-shortest", "-movflags", "+faststart",
      scratch,
    ]);

    const handle = await open(scratch, "r");
    try {
      return await activeVideoProvider().store({
        body: Readable.toWeb(handle.createReadStream()) as ReadableStream<Uint8Array>,
        mimeType: "video/mp4",
        maxBytes: 100 * 1024 * 1024,
      });
    } finally {
      await handle.close().catch(() => {});
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
