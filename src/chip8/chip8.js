import { Component } from "react";

import CPU from './cpu';

export default class Chip8 extends Component {

    constructor(props) {
        super(props);
        this.cpu = new CPU();
    }

    componentDidMount() {
        setupGraphics();
        setupInput();

        this.cpu.initialize();
    }

    loadGame = (game) => {
        this.cpu.loadGame(game);
    }

    emulationLoop = () => {
        this.cpu.emulateCycle();

        if (this.cpu.drawFlag)
            drawGraphics();

        this.cpu.setKeys();
    }

    render() {
        return (
            <canvas>

            </canvas>
        )
    }
};