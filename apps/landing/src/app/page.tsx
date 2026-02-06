"use client";

import { useEffect, useState } from "react";
import StyleOne from "./StyleOne";
import StyleTwo from "./StyleTwo";
import StyleThree from "./StyleThree";

type Skin = 1 | 2 | 3;

const skinLabels: Record<Skin, string> = { 1: "I", 2: "II", 3: "III" };
const skinColors: Record<Skin, string> = {
  1: "from-purple-400 to-pink-400",
  2: "from-cyan-400 to-blue-500",
  3: "from-[#D7FF3B] to-[#6B2B8C]",
};

export default function Home() {
  const [skin, setSkin] = useState<Skin>(1);

  useEffect(() => {
    const saved = localStorage.getItem("vibeaff_skin");
    if (saved === "2") setSkin(2);
    else if (saved === "3") setSkin(3);
  }, []);

  const cycleSkin = () => {
    const next = skin === 3 ? 1 : ((skin + 1) as Skin);
    setSkin(next);
    localStorage.setItem("vibeaff_skin", String(next));
  };

  return (
    <>
      {/* Skin Toggler */}
      <div className="fixed top-4 right-4 z-[200] flex items-center gap-3">
        {([1, 2, 3] as Skin[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSkin(s);
              localStorage.setItem("vibeaff_skin", String(s));
            }}
            className={`text-xs font-mono tracking-wider transition-all px-2.5 py-1 rounded-full border ${
              skin === s
                ? `bg-gradient-to-r ${skinColors[s]} text-white border-white/30 shadow-lg`
                : "text-white/30 border-white/10 hover:text-white/60 hover:border-white/20"
            }`}
          >
            {skinLabels[s]}
          </button>
        ))}
      </div>

      {skin === 1 ? <StyleOne /> : skin === 2 ? <StyleTwo /> : <StyleThree />}
    </>
  );
}
