import { Component } from "react";

import CPU from './cpu';

const MAZE = [
    0xa2, 0x1e, 0xc2, 0x01, 0x32, 0x01, 0xa2, 0x1a,
    0xd0, 0x14, 0x70, 0x04, 0x30, 0x40, 0x12, 0x00,
    0x60, 0x00, 0x71, 0x04, 0x31, 0x20, 0x12, 0x00,
    0x12, 0x18, 0x80, 0x40, 0x20, 0x10, 0x20, 0x40,
    0x80, 0x10
];

export default class Chip8 extends Component {

    constructor(props) {
        super(props);
        this.cpu = new CPU();
        this.canvas = null;
    }

    componentDidMount() {
        this.setupGraphics();

        this.cpu.initialize();
        this.cpu.loadGame();
    }

    setupGraphics() {
        this.canvas = document.getElementById('chip8-screen').getContext("2d");
    }

    drawGraphics() {
        for (let x = 0; x < 64; x++) {
            for (let y = 0; y < 32; y++) {
                if (this.cpu.gfx[x + y * 64] === 0) {
                    this.canvas.fillStyle = "rgba(0, 0, 0, 1)";
                } else {
                    this.canvas.fillStyle = "rgba(255, 255, 255, 1)";
                }
                this.canvas.fillRect(x, y, 1, 1);
            }
        }
    }

    loadGame = () => {
        this.cpu.loadGame(MAZE);
    }

    emulationLoop = () => {
        this.cpu.emulateCycle();

        if (this.cpu.drawFlag)
            this.drawGraphics();
    }

    render() {
        return (
            <canvas id="chip8-screen" width="64" height="32">
            </canvas>
        )
    }
};