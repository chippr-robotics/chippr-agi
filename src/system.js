class System {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.entityIds = new Set();
    this.registerEventListeners();
  }

  registerEventListeners() {
    // Override this method in child classes to register event listeners
  }

  addEntity(entityId) {
    this.entityIds.add(entityId);
  }

  removeEntity(entityId) {
    this.entityIds.delete(entityId);
  }

  update() {
    // Override this method in child classes to implement system-specific logic
  }
}

module.exports =  System ;