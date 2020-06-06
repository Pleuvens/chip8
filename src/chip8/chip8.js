import React, { Component } from "react";

import CPU from './cpu';

import './chip8.css';

import roms from './roms';

export default class Chip8 extends Component {

    constructor(props) {
        super(props);
        this.cpu = new CPU();
        this.canvas = null;
    }

    componentDidMount() {
        this.setupGraphics();

        this.cpu.initialize();
        this.cpu.loadGame(roms.IBM);
        setInterval(this.emulationLoop, 16);
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

    loadGame = (game) => {
        this.cpu.loadGame(game);
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