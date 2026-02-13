import { useRef, useEffect } from "react";
import { PlayerState, EnemyState, MapBlock } from "@/game/types3d";

interface MinimapProps {
  player: PlayerState;
  enemies: EnemyState[];
  mapBlocks: MapBlock[];
}

const SIZE = 150;
const MAP_RANGE = 25; // world units visible
const SCALE = SIZE / (MAP_RANGE * 2);

function worldToMinimap(wx: number, wz: number): [number, number] {
  return [
    SIZE / 2 + wx * SCALE,
    SIZE / 2 - wz * SCALE, // flip Z for top-down
  ];
}

const Minimap = ({ player, enemies, mapBlocks }: MinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Draw map blocks
      for (const block of mapBlocks) {
        if (block.type === "ground") continue;
        const [bx, bz] = worldToMinimap(block.position.x, block.position.z);
        const w = block.size.x * SCALE;
        const h = block.size.z * SCALE;
        ctx.fillStyle =
          block.type === "wall" ? "rgba(120,120,120,0.7)" :
          block.type === "cover" ? "rgba(160,140,100,0.6)" :
          "rgba(100,100,140,0.5)";
        ctx.fillRect(bx - w / 2, bz - h / 2, w, h);
      }

      // Draw enemies
      for (const e of enemies) {
        if (e.isDead) continue;
        const [ex, ez] = worldToMinimap(e.position.x, e.position.z);
        ctx.fillStyle = "#f44336";
        ctx.beginPath();
        ctx.arc(ex, ez, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw player arrow
      const [px, pz] = worldToMinimap(player.position.x, player.position.z);
      ctx.save();
      ctx.translate(px, pz);
      ctx.rotate(-player.rotation); // rotate to face direction
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-4, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, SIZE, SIZE);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [player, enemies, mapBlocks]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      className="absolute top-14 left-4 rounded-lg pointer-events-none"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default Minimap;
