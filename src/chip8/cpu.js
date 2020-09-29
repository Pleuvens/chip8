const MEMORY_SIZE = 4096;
const NB_REGISTERS = 16;
const SCREEN_WIDTH = 64;
const SCREEN_HEIGHT = 32;
const STACK_SIZE = 16;
const NB_KEYS = 16;

const NNN_MASK = 0b0000111111111111;
const NN_MASK  = 0b0000000011111111;
const N_MASK   = 0b0000000000001111;
const XNN_MASK = 0b0000111100000000;
const XN_MASK  = 0b0000000011110000;

const CARRY_REGISTER = 15;

const fontset = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

const keyboard = [
    49, 50, 51, 52,
    65, 90, 69, 82,
    81, 83, 68, 70,
    87, 88, 67, 86
]

export default class CPU {

    drawFlag = false;
    gfx = Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0);

    constructor() {
        this.opcode = 0;

        // index register
        this.I = 0;

        // program counter (0x0 -> 0xfff)
        this.pc = 0;

        /*  Memory Map:
         *  0x000 - 0x1ff : Chip8 interpreter
         *  0x050 - 0x0A0 : Used for the built in 4x5 pixel font set (0-F)
         *  0x200 - 0xfff : Program ROM and work RAM 
         */ 
        this.memory = Array(MEMORY_SIZE).fill(0);

        // Registers named from V0 to VE, last one for carry flag
        this.V = Array(NB_REGISTERS).fill(0);

        this.stack = [];

        this.key = Array(NB_KEYS).fill(false);

        this.delay_timer = 0;
        this.sound_timer = 0;

        document.addEventListener('onkeydown', this.keyPressed);
        document.addEventListener('onkeyup', this.keyReleased);
    }

    keyPressed(event) {
        for (let i = 0; i < NB_KEYS; i++) {
            if (keyboard[i] === event.keyCode) {
                this.key[i] = true;
            }
        }
    }

    keyReleased(event) {
        for (let i = 0; i < NB_KEYS; i++) {
            if (keyboard[i] === event.keyCode) {
                this.key[i] = false;
            }
        }
    }
    initialize() {
        this.opcode = 0;
        this.pc = 0x200;
        this.sp = 0;
        this.delay_timer = 0;
        this.sound_timer = 0;
        this.drawFlag = false;

        this.V.fill(0);
        this.gfx.fill(0);
        this.stack.fill(0);
        this.key.fill(0);
        this.memory.fill(0);
        for (let i = 0; i < fontset.length; i++)
            this.memory[i] = fontset[i];
    }

    loadGame(game) {
        for (let i = 0; i < game.length; i++) {
            this.memory[i + 0x200] = game[i];
        }
    }

    emulateCycle() {
        let code = this.fetchOpcode();

        this.decodeAndExecuteOpcode(code);

        if (this.delay_timer > 0) {
           this.delay_timer -= 1;
        }

        if (this.sound_timer > 0) {
            this.sound_timer -= 1;
            console.log('bip');
        }
    }

    fetchOpcode() {
        return (this.memory[this.pc] << 8) | (this.memory[this.pc + 1]);
    }

    disp_clear() {
        this.gfx.fill(0);
    }

    decodeAndExecuteOpcode = (code) => {
        switch (true) {
            case (code === 0x0e0): {
                this.disp_clear();
                this.pc += 2;
                break;
            }
            case (code === 0x0ee): {
                if (this.stack.length === 0) {
                    throw 'STACK EMPTY';
                }
                this.pc = this.stack.pop();
                break;
            }
            case (code < 0x1000): {
                this.pc += 2;
                // TODO : 0NNN
                break;
            }
            case (code < 0x2000): {
                let addr = NNN_MASK & code;
                this.pc = addr;
                break;
            }
            case (code < 0x3000): {
                let addr = NNN_MASK & code;
                if (this.stack.length > STACK_SIZE) {
                    console.error('STACK OVERFLOW');
                    this.pc += 2;
                    break;
                }
                this.stack.push(this.pc);
                this.pc = addr;
                break;
            }
            case (code < 0x4000): {
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (x === nn) {
                    this.pc += 2;
                }
                this.pc += 2;
                break;
            }
            case (code < 0x5000): {
                if (N_MASK & code !== 0) {
                    this.pc += 2;
                    break;
                }
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (x !== nn) {
                    this.pc += 2;
                }
                this.pc += 2;
                break;
            }
            case (code < 0x6000): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                if (x === y) {
                    this.pc += 2;
                }
                this.pc += 2;
                break;
            }
            case (code < 0x7000): {
                let x = (XNN_MASK & code) >> 8;
                let val = NN_MASK & code;
                this.V[x] = val;
                this.pc += 2;
                break;
            }
            case (code < 0x8000): {
                let x = (XNN_MASK & code) >> 8;
                let val = NN_MASK & code;
                this.V[x] = NN_MASK & (this.V[x] + val);
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 0): {
                let x = (XNN_MASK & code) >> 8;
                let y = XN_MASK & code;
                this.V[x] = this.V[y];
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 1): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = this.V[x] | this.V[y];
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 2): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = this.V[x] & this.V[y];
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 3): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = this.V[x] ^ this.V[y];
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 4): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = NN_MASK & (this.V[x] + this.V[y]);
                this.V[CARRY_REGISTER] = (XNN_MASK & (this.V[x] + this.V[y])) >> 8;
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 5): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] > this.V[y] ? this.V[CARRY_REGISTER] = 1 : this.V[CARRY_REGISTER] = 0; 
                this.V[x] = NN_MASK & (Math.abs(this.V[x] - this.V[y]));
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 6): {
                let x = (XNN_MASK & code) >> 8;
                this.V[CARRY_REGISTER] = 0b00000001 & this.V[x];
                this.V[x] = this.V[x] >> 1;
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 7): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] > this.V[y] ? this.V[CARRY_REGISTER] = 0 : this.V[CARRY_REGISTER] = 1; 
                this.V[x] = NN_MASK & (Math.abs(this.V[y] - this.V[x]));
                this.pc += 2;
                break;
            }
            case (code < 0x9000 && (N_MASK & code) === 14): {
                let x = (XNN_MASK & code) >> 8;
                this.V[CARRY_REGISTER] = 0b10000000 & this.V[x];
                this.V[x] = NN_MASK & (this.V[x] << 1);
                this.pc += 2;
                break;
            }
            case (code < 0x9000): {
                this.pc += 2;
                break;
            }
            case (code < 0xa000): {
                if (N_MASK & code !== 0) {
                    this.pc += 2;
                    break;
                }
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                if (this.V[x] !== this.V[y]) {
                    this.pc += 2;
                }
                this.pc += 2;
                break;
            }
            case (code < 0xb000): {
                let addr = NNN_MASK & code;
                this.I = addr;
                this.pc += 2;
                break;
            }
            case (code < 0xc000): {
                let addr = NNN_MASK & code;
                this.pc = this.V[0] + addr;
                break;
            }
            case (code < 0xd000): {
                let x = (XNN_MASK & code) >> 8;
                this.V[x] = Math.floor(Math.random() * Math.floor(256)) & (NN_MASK & code);
                this.pc += 2;
                break;
            }
            case (code < 0xe000): {
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                let height = N_MASK & code;

                let pixel = 0;
                this.V[CARRY_REGISTER] = 0;
                for (let j = 0; j < height; j++) {
                    pixel = this.memory[this.I + j];
                    for (let i = 0; i < 8; i++) {
                        if ((pixel & (0x80 >> i)) !== 0) {
                            if (this.gfx[(x + i + ((y + j) * SCREEN_WIDTH))] === 1)
                                this.V[CARRY_REGISTER] = 1;
                            this.gfx[x + i + ((y + j) * SCREEN_WIDTH)] ^= 1;
                        }
                    }
                }

                this.drawFlag = true;
                this.pc += 2;
                break;
            }
            case (code < 0xf000): {
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (nn === 0x9e && this.key[this.V[x]]) {
                    this.pc += 2;
                } else if (nn === 0xa1 && !this.key[this.V[x]]) {
                    this.pc += 2;
                }
                this.pc += 2;
                break;
            }
            case (code < 0x10000): {
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (nn === 0x07) {
                    this.V[x] = NN_MASK & this.delay_timer;
                } else if (nn === 0x0a) {
                    for (let i = 0; i < NB_KEYS; i++) {
                        if (this.key[i]) {
                            this.V[x] = i;
                            break;
                        }
                    }
                } else if (nn === 0x15) {
                    this.delay_timer = this.V[x];
                } else if (nn === 0x18) {
                    this.sound_timer = this.V[x];
                } else if (nn === 0x1e) {
                    this.V[CARRY_REGISTER] = (0b1111000000000000 & (this.I + this.V[x])) >> 12;
                    this.I = NNN_MASK & (this.I + this.V[x]);
                } else if (nn === 0x29) {
                    this.I = NNN_MASK & (this.V[x] * 5);
                } else if (nn === 0x33) {
                    this.memory[this.I] = Math.round(this.V[x] / 100);
                    this.memory[this.I] = Math.round(this.V[x] / 10) % 10;
                    this.memory[this.I] = this.V[x] % 10;
                } else if (nn === 0x55) {
                    for (let i = 0; i <= x; i++) {
                        this.memory[this.I + i] = this.V[i];
                    }
                } else if (nn === 0x65) {
                    for (let i = 0; i <= x; i++ ) {
                        this.V[i] = this.memory[this.I + i];
                    }
                }
                this.pc += 2;
                break;
            }
            default:
                console.error('OPCODE value incorrect :' + code);
                break;
        }
    }

    /* TEST CODE */

    arrayEquals = (a, b) => {
        return Array.isArray(a) &&
                Array.isArray(b) &&
                a.length === b.length &&
                a.every((val, index) => val === b[index]);
    }

    test0x0e0 = () => {
        this.decodeAndExecuteOpcode(0x0e0);
        return this.pc === (0x200 + 2) &&
            this.arrayEquals(this.gfx, Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0));
    }

    test0x0ee = () => {
        let err = false;
        try {
            this.decodeAndExecuteOpcode(0x0ee);
        } catch (e) {
            err = this.pc === (0x200);
        }
        // TODO: Initialize and check pc value
        return err;
    }

    test0x1nnn = () => {
        this.decodeAndExecuteOpcode(0x1000);
        let addr1 = this.pc;
        this.decodeAndExecuteOpcode(0x1fff);
        let addr2 = this.pc;
        this.decodeAndExecuteOpcode(0x12a8);
        let addr3 = this.pc;
        return addr1 === 0x000 && addr2 === 0x1fff
            && addr3 === 0x12a8;
    }
}