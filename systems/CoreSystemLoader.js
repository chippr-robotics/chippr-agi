var System = require('../core/system');
class CoreSystemLoader extends System {
    constructor(eventEmitter) {
      super(eventEmitter);
      this.interval;
    }
  
    registerEventListeners() {
      //not needed for core system
    }
  
    update() {
      // Implement task execution logic here
    }

    init(){
        let systems = './systems/';
        let components = './components/';
        this.interval = setInterval(() => {
            fs.readdirSync(systems).forEach(file => {  
                let sys = file.split('.')[0];
                if(!CHIPPRAGI.systems.includes(sys)){
                  let s = require(systems+file);
                  //run the init function on a system
                  s.init(CHIPPRAGI.eventEmitter);
                  //register the new system 
                  CHIPPRAGI.registerSystem(sys);
                };
            });  
            fs.readdirSync('./components').forEach(file => { 
                require(components+file);
            });  
        }, 5000);
      }
    
    stop(){
        clearInterval(this.interval);
    } 
  }
  
  module.exports.init = (eventEmitter) => {new CoreSystemLoader(eventEmitter)};