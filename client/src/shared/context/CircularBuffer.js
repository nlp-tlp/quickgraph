/**
 * A circular buffer data structure.
 *
 * @class
 * @param {number} size - The size of the buffer.
 */
export default class CircularBuffer {
  constructor(size) {
    this.buffer = new Array(size);
    this.writeIndex = 0;
    this.readIndex = 0;
  }

  /**
   * Writes a new value to the buffer.
   *
   * @param {*} value - The value to write to the buffer.
   */
  write(value) {
    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
    if (this.writeIndex === this.readIndex) {
      this.readIndex = (this.readIndex + 1) % this.buffer.length;
    }
  }

  /**
   * Reads the oldest value from the buffer.
   *
   * @returns {*} The oldest value in the buffer, or undefined if the buffer is empty.
   */
  read() {
    if (this.readIndex === this.writeIndex) {
      return undefined; // buffer is empty
    }
    const value = this.buffer[this.readIndex];
    this.readIndex = (this.readIndex + 1) % this.buffer.length;
    return value;
  }

  /**
   * Reads the newest value from the buffer.
   *
   * @returns {*} The newest value in the buffer, or undefined if the buffer is empty.
   */
  readNewest() {
    const lastIndex =
      (this.writeIndex + this.buffer.length - 1) % this.buffer.length;
    if (lastIndex === this.writeIndex) {
      return undefined; // buffer is empty
    }
    const value = this.buffer[lastIndex];
    return value;
  }

  /**
   * Returns the number of items currently in the buffer.
   *
   * @returns {number} The number of items in the buffer.
   */
  get size() {
    return (
      (this.writeIndex - this.readIndex + this.buffer.length) %
      this.buffer.length
    );
  }
}
