ChipprAGI.registerComponent('foo', {
    schema: {
      bar: {type: 'number'},
      baz: {type: 'string'}
    },
  
    init: function () {
      // Do something when component first attached.
    },
  
    update: function () {
      // Do something when component's data is updated.
    },
  
    remove: function () {
      // Do something when the component or its entity is detached.
    },
  
    tick: function (time, timeDelta) {
      // Do something on every scene tick or frame.
    }
  });