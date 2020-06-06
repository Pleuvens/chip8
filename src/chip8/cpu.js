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

export default class CPU {
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

        this.gfx = Array(SCREEN_WIDTH * SCREEN_HEIGHT).fill(0);

        this.stack = Array(STACK_SIZE).fill(0);
        // stack pointer
        this.sp = 0;

        this.key = Array(NB_KEYS).fill(0);

        this.delay_timer = 0;
        this.sound_timer = 0;

        this.skip_instr = false;
    }

    initialize() {
        this.opcode = 0;
        this.pc = 0;
        this.sp = 0;
        this.delay_timer = 0;
        this.sound_timer = 0;

        memory.fill(0);
        V.fill(0);
        gfx.fill(0);
        stack.fill(0);
        key.fill(0);
    }

    emulateCycle() {
       let code = this.fetchOpcode();

       this.decodeAndExecuteOpcode(code);
    }

    fetchOpcode() {
        return this.memory[this.pc] << 8 | this.memory[pc + 1];
    }

    decodeAndExecuteOpcode(code) {
        switch (true) {
            case (code === 0x0e0):
                disp_clear();
                break;
            case (code == 0x0ee):
                //return subroutine
                break;
            case (code < 0x1000):
                let addr = NNN_MASK & code;
                // call (addr)
                break;
            case (code < 0x2000):
                let addr = NNN_MASK & code;
                // jump (addr)
                break;
            case (code < 0x3000):
                let addr = NNN_MASK & code;
                // call subroutine (addr)
                break;
            case (code < 0x4000):
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (x === nn) {
                    this.skip_instr = true;
                }
                break;
            case (code < 0x5000):
                if (N_MASK & code !== 0)
                    break;
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (x !== nn) {
                    this.skip_instr = true;
                }
                break;
            case (code < 0x6000):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                if (x === y) {
                    this.skip_instr = true;
                }
                break;
            case (code < 0x7000):
                let x = (XNN_MASK & code) >> 8;
                let val = NN_MASK & code;
                this.V[x] = val;
                break;
            case (code < 0x8000):
                let x = (XNN_MASK & code) >> 8;
                let val = NN_MASK & code;
                this.V[x] = NN_MASK & (this.V[x] + val);
                break;
            case (code < 0x9000 && (N_MASK & code) === 0):
                let x = (XNN_MASK & code) >> 8;
                let y = XN_MASK & code;
                this.V[x] = this.V[y];
                break;
            case (code < 0x9000 && (N_MASK & code) === 1):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = this.V[x] | this.V[y];
                break;
            case (code < 0x9000 && (N_MASK & code) === 2):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = this.V[x] & this.V[y];
                break;
            case (code < 0x9000 && (N_MASK & code) === 3):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = this.V[x] ^ this.V[y];
                break;
            case (code < 0x9000 && (N_MASK & code) === 4):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] = NN_MASK & (this.V[x] + this.V[y]);
                this.V[CARRY_REGISTER] = (XNN_MASK & (this.V[x] + this.V[y])) >> 8;
                break;
            case (code < 0x9000 && (N_MASK & code) === 5):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] > this.V[y] ? this.V[CARRY_REGISTER] = 1 : this.V[CARRY_REGISTER] = 0; 
                this.V[x] = NN_MASK & (Math.abs(this.V[x] - this.V[y]));
                break;
            case (code < 0x9000 && (N_MASK & code) === 6):
                let x = (XNN_MASK & code) >> 8;
                this.V[CARRY_REGISTER] = 0b00000001 & this.V[x];
                this.V[x] = this.V[x] >> 1;
                break;
            case (code < 0x9000 && (N_MASK & code) === 7):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                this.V[x] > this.V[y] ? this.V[CARRY_REGISTER] = 0 : this.V[CARRY_REGISTER] = 1; 
                this.V[x] = NN_MASK & (Math.abs(this.V[y] - this.V[x]));
                break;
            case (code < 0x9000 && (N_MASK & code) === 14):
                let x = (XNN_MASK & code) >> 8;
                this.V[CARRY_REGISTER] = 0b10000000 & this.V[x];
                this.V[x] = NN_MASK & (this.V[x] << 1);
                break;
            case (code < 0x9000):
                break;
            case (code < 0xa000):
                if (N_MASK & code !== 0)
                    break;
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                if (this.V[x] != this.V[y]) {
                    this.skip_instr = true;
                }
                break;
            case (code < 0xb000):
                let addr = NNN_MASK & code;
                this.I = addr;
                break;
            case (code < 0xc000):
                let addr = NNN_MASK & code;
                this.pc = this.V[0] + addr;
                // ????????????????????????????
                break;
            case (code < 0xd000):
                let x = (XNN_MASK & code) >> 8;
                this.V[x] = Math.floor(Math.random() * Math.floor(256)) & (NN_MASK & code);
                break;
            case (code < 0xe000):
                let x = (XNN_MASK & code) >> 8;
                let y = (XN_MASK & code) >> 4;
                let n = N_MASK & code;
                drawSprite(this.V[x], this.V[y], n);
                break;
            case (code < 0xf000):
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (nn === 0x9e && getKey() === this.V[x]) {
                    this.skip_instr = true;
                } else if (nn === 0xa1 && getKey() !== this.V[x]) {
                    this.skip_instr = true;
                }
                break;
            case (code < 0x10000):
                let x = (XNN_MASK & code) >> 8;
                let nn = NN_MASK & code;
                if (nn === 0x07) {
                    this.V[x] = NN_MASK & this.delay_timer;
                } else if (nn === 0x0a) {
                    this.V[x] = getKey();
                    // blocking operation
                } else if (nn === 0x15) {
                    this.delay_timer = this.V[x];
                } else if (nn === 0x18) {
                    this.sound_timer = this.V[x];
                } else if (nn === 0x1e) {
                    this.V[CARRY_REGISTER] = (0b1111000000000000 & (this.I + this.V[x])) >> 12;
                    this.I = NNN_MASK & (this.I + this.V[x]);
                } else if (nn === 0x29) {
                    this.I = sprite_addr[this.V[x]];
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
                        this.V[i] = thiS.memory[this.I + i];
                    }
                }
                break;
            default:
                console.error('OPCODE value incorrect :' + code);
                break;
        }
    }
}