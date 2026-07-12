import Phaser from "phaser";
import "./style.css";
import { NaveScene } from "./scenes/NaveScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#080706",
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1350 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  scene: [NaveScene],
};

new Phaser.Game(config);
