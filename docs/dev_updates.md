
5/4 - Added huggingface api support. use with caution for now. 

5/2 -
Working to the next release. The system is stable. Core functions like logging, language model, pubsub are all working. The websocket system works for frontend integration. Everything can be run using yarn commands now also.

Haven't had time to work on front end much, @chippr-robotics repo has a template for a vr frontend when I get some cycles...

Updates:
- Add "build" to package.json
- ch default messageBus to to redis
- add task expander
- sss is now generating lists
- Created a ratelimiting queue for language model requests
- add Rate limits type to splash screen
- add error logging to generate calls

4/28
- working logging system
- working docker image
- working docker-compose

4/21 
cleaned up a lot of the formating and schemas
core functionality of ecs is working with redis
need distrubuted message bus
add quick start to readme


4/20 
- [x] v1 >> ecs
- [x] add testing framework (mocha)
- [x] allow distrubuted task handeling(swarm mode)
- [x] functional core system loader
- [ ] All core systems and componens 
- [x] Docker container. 
- [x] Docker compose w/ redis
- [x] Jenkins pipelines 
- [x] Distrubuted message bus system 
- [ ] Better Documentation *I am working on updating documentation friday and saturday.

