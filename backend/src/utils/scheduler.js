/**
 * Scheduler utility for handling recurring tasks
 */
class Scheduler {
  constructor() {
    this.intervals = {};
  }

  /**
   * Start a scheduled task
   * @param {String} name - Task name
   * @param {Function} fn - Function to run
   * @param {Number} interval - Interval in milliseconds
   */
  startTask(name, fn, interval = 60000 * 60) { // Default: run every hour
    // Clear any existing interval with the same name
    if (this.intervals[name]) {
      clearInterval(this.intervals[name]);
    }

    // Start the new interval
    this.intervals[name] = setInterval(fn, interval);
    
    // Run the task immediately once
    fn();
    
    return this.intervals[name];
  }

  /**
   * Stop a scheduled task
   * @param {String} name - Task name
   */
  stopTask(name) {
    if (this.intervals[name]) {
      clearInterval(this.intervals[name]);
      delete this.intervals[name];
      return true;
    }
    return false;
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    Object.keys(this.intervals).forEach(name => {
      clearInterval(this.intervals[name]);
    });
    this.intervals = {};
  }
}

module.exports = new Scheduler();
