
load the core system

var { CHIPPRAGI } = require('./examples/runme.js')

add the core system loader(if you dont want to load everything by hand)

require('./systems/CoreSystemLoader')


emit a task!

CHIPPRAGI.emit('createTask', 'Test yolo!')