/**
 * LS-8 v2.0 emulator skeleton code
 */

const LDI = 0b10011001; // Load R Immediate
const PRN = 0b01000011; // Print numeric register
const HLT = 0b00000001; // Halt the CPU

const ADD = 0b10101000; // ADD R R
const AND = 0b10110011; // AND R R
const CALL = 0b01001000; // CALL R
const DEC = 0b01111001; // DEC R
const DIV = 0b10101011; // DIV R R
const INC = 0b01111000; // INC R
const INT = 0b01001010; // Software interrupt R
const IRET = 0b00001011; // Return from interrupt
const JGT = 0b01010100; // JGT R
const JLT = 0b01010011; // JLT R
const JNE = 0b01010010; // JNE R
const LD = 0b10011000; // Load R,R
const MOD = 0b10101100; // MOD R R
const MUL = 0b10101010; // MUL R,R
const NOP = 0b00000000; // NOP
const NOT = 0b01110000; // NOT R
const OR = 0b10110001; // OR R R
const PRA = 0b01000010; // Print alpha char
const RET = 0b00001001; // Return
const ST = 0b10011010; // Store R,R
const SUB = 0b10101001; // SUB R R
const XOR = 0b10110010; // XOR R R
const POP = 0b01001100; // Pop R
const PUSH = 0b01001101; // Push R

const CMP = 0b10100000; // CMP R R
const JMP = 0b01010000; // JMP R
const JEQ = 0b01010001; // JEQ R

const SP = 7; //variable for register address

// let E = 0; // Equal flag value
// let G = 1; // Greater than flag value
// let L = 2; // Less than flag value

/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {
  /**
   * Initialize the CPU
   */
  constructor(ram) {
    this.ram = ram;

    this.reg = new Array(8).fill(0); // General-purpose registers R0-R7

    this.reg[SP] = 0xf4; //sets stack pointer

    // Special-purpose registers
    this.reg.PC = 0; // Program Counter
    this.reg.FL = 0; //flag
  }

  /**
   * Store value in memory address, useful for program loading
   */
  poke(address, value) {
    this.ram.write(address, value);
  }

  /**
   * Starts the clock ticking on the CPU
   */
  startClock() {
    this.clock = setInterval(() => {
      this.tick();
    }, 1); // 1 ms delay == 1 KHz clock == 0.000001 GHz
  }

  /**
   * Stops the clock
   */
  stopClock() {
    clearInterval(this.clock);
  }

  /**
   * ALU functionality
   *
   * The ALU is responsible for math and comparisons.
   *
   * If you have an instruction that does math, i.e. MUL, the CPU would hand
   * it off to it's internal ALU component to do the actual work.
   *
   * op can be: ADD SUB MUL DIV INC DEC CMP
   */

  alu(op, regA, regB) {
    switch (op) {
      case "ADD":
        return this.ram.read(regA) + this.ram.read(regB);
        break;
      case "SUB":
        return this.ram.read(regA) - this.ram.read(regB);
        break;
      case "MUL":
        return this.ram.read(regA) * this.ram.read(regB);
        break;
      case "DIV":
        if (this.ram.read(regB) === 0) {
          process.exit();
          console.error("can NOT divide by 0");
        } else return this.ram.read(regA) / this.ram.read(regB);
        break;
      case "INC":
        return this.ram.read(regA) + 1;
        break;
      case "DEC":
        return this.ram.read(regA) - 1;
        break;
      case "CMP": //Compare the value in two registers
        if (regA === regB) this.FL = 0b00000001;
        if (regA < regB) this.FL = 0b00000100;
        if (regA > regB) this.FL = 0b00000010;
        break;
    }
  }

  /**
   * Advances the CPU one cycle
   */
  tick() {
    // Load the instruction register (IR--can just be a local variable here)
    // from the memory address pointed to by the PC. (I.e. the PC holds the
    // index into memory of the instruction that's about to be executed
    // right now.)
    const IR = this.ram.mem[this.reg.PC];

    // Debugging output
    // Get the two bytes in memory _after_ the PC in case the instruction
    // needs them.

    const operandA = this.ram.read(this.reg.PC + 1);
    const operandB = this.ram.read(this.reg.PC + 2);

    let continueNext = true;

    // Execute the instruction. Perform the actions for the instruction as
    // outlined in the LS-8 spec.
    switch (IR) {
      case ADD:
        this.ram.write(operandA, this.alu("ADD", operandA, operandB));
        break;

      case DEC:
        this.ram.write(operandA, this.alu("DEC", operandA));
        break;

      case DIV:
        this.ram.write(operandA, this.alu("DIV", operandA, operandB));
        break;

      case INC:
        this.ram.write(operandA, this.alu("INC", operandA));
        break;

      case MUL:
        this.ram.write(operandA, this.alu("MUL", operandA, operandB));
        break;

      case CMP:
        this.alu("CMP", this.ram.read(operandA), this.ram.read(operandB));
        break;

      case SUB:
        this.ram.write(operandA, this.alu("SUB", operandA, operandB));
        break;

      case 67:
        console.log(this.ram.read(operandA));
        break;

      case HLT:
        this.stopClock();
        break;

      case LDI:
        this.ram.write(operandA, operandB);
        break;

      case CALL:
        this.reg[7]--;
        this.ram.write(this.reg[7], this.reg.PC + 2);
        this.reg.PC = this.ram.read(operandA);
        continueNext = false;
        break;

      case RET:
        this.reg.PC = this.ram.read(this.reg[7]);
        this.reg[7]++;
        continueNext = false;
        break;

      case 77:
        this.reg[7]--;
        this.ram.write(this.reg[7], this.ram.read(operandA));
        break;

      case 76:
        this.ram.write(operandA, this.ram.read(this.reg[7]));
        this.reg[7]++;
        break;

      case JMP:
        this.reg.PC = this.ram.read(operandA);
        continueNext = false;
        break;

      case JEQ:
        if (this.FL === 1) {
          this.reg.PC = this.ram.read(operandA);
          continueNext = false;
        }
        break;

      case JNE:
        if (this.FL != 1) {
          this.reg.PC = this.ram.read(operandA);
          continueNext = false;
        }
        break;

      case AND:
        this.ram.write(
          operandA,
          this.ram.read(operandA) & this.ram.read(operandB)
        );
        break;

      case JGT:
        if (this.FL === 2) {
          this.reg.PC = this.ram.read(operandA);
          continueNext = false;
        }
        break;

      case JLT:
        if (this.FL === 4) {
          this.reg.PC = this.ram.read(operandA);
          continueNext = false;
        }
        break;

      case LD:
        this.ram.write(operandB, this.ram.read(operandA));
        break;

      case MOD:
        this.ram.write(operandA, this.alu("MOD", operandA, operandB));
        break;

      case NOP:
        break;

      case NOT:
        this.ram.write(operandA, ~this.ram.read(operandA));
        break;

      case OR:
        this.ram.write(
          operandA,
          this.ram.read(operandA) | this.ram.read(operandB)
        );
        break;

      case ST:
        this.ram.write(operandA, this.ram.read(operandB));
        break;

      case XOR:
        this.ram.write(
          operandA,
          this.ram.read(operandA) ^ this.ram.read(operandB)
        );
        break;

      // ### INT

      // `INT register`

      // Issue the interrupt number stored in the given register.

      // This will set the _n_th bit in the `IS` register to the value in the given
      // register.

      // Machine code:
      // ```
      // 01001010 00000rrr
      // ```

      //INT
      case INT:
        this.ram.write(operandA, this.ram.read(this.reg[7]));
        this.reg[7]++;
        break;

      // ### IRET

      // `IRET`
      // Return from an interrupt handler.
      // The following steps are executed:
      // 1. Registers R6-R0 are popped off the stack in that order.
      // 2. The `FL` register is popped off the stack.
      // 3. The return address is popped off the stack and stored in `PC`.
      // 4. Interrupts are re-enabled

      //IRET    00001011
      case IRET:
        this.ram.write(operandA, this.ram.read(this.reg[7]));
        this.reg[7]++;
        break;

      // ### PRA

      // `PRA register` pseudo-instruction

      // Print alpha character value stored in the given register.

      // Print to the console the ASCII character corresponding to the value in the
      // register.

      // Machine code:
      // ```
      // 01000010 00000rrr
      // ```

      //PRA
      case PRA:
        this.ram.write(operandA, this.ram.read(this.reg[7]));
        this.reg[7]++;
        break;

      default:
        console.log("error");
        break;
    }

    // Increment the PC register to go to the next instruction. Instructions
    // can be 1, 2, or 3 bytes long. Hint: the high 2 bits of the
    // instruction byte tells you how many bytes follow the instruction byte
    // for any particular instruction.
    if (continueNext) {
      let increment = IR.toString(2);
      while (increment.length < 8) increment = "0" + increment;
      this.reg.PC = this.reg.PC + 1 + parseInt(increment.slice(0, 2), 2);
    }
  }
}

module.exports = CPU;
