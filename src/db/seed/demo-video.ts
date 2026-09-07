import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const BACKGROUND = "0x2c455d";
const RESOLUTION = "1280x720";
const DURATION_SECONDS = 8;

function uploadDirectory(): string {
  const dbPath = (process.env.DATABASE_URL ?? "file:./local.db").replace(/^file:/, "");
  return process.env.VIDEO_UPLOAD_DIR?.trim() ?? join(dirname(dbPath), "uploads");
}

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

export async function generateDemoVideo(
  profileId: string,
  name: string,
  title: string,
): Promise<string> {
  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });

  await runFfmpeg([
    "-y",
    "-loglevel", "error",
    "-f", "lavfi", "-i", `color=c=${BACKGROUND}:s=${RESOLUTION}:d=${DURATION_SECONDS}`,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-vf", overlayFilter(name, title),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
    "-shortest", "-movflags", "+faststart",
    join(directory, `${profileId}.mp4`),
  ]);

  return `/api/videos/${profileId}`;
}
