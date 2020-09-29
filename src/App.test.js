import CPU from './chip8/cpu';

test('Code 0x0E0 : Clear the screen', () => {
  let cpu = new CPU();
  cpu.initialize();
  expect(cpu.test0x0e0()).toBe(true)
});

test('Code 0x0EE : return from a subroutine', () => {
  let cpu = new CPU();
  cpu.initialize();
  expect(cpu.test0x0ee()).toBe(true)
});

test('Code 0x1NNN : Jump to address NNN', () => {
  let cpu = new CPU();
  cpu.initialize();
  expect(cpu.test0x1nnn()).toBe(true)
});
