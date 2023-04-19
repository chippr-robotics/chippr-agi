//set the environmental variables
//(todo) have a test env config
require('dotenv').config();

//test core functions
require('./core');

//tests for systems
require('./systems');

//test for components
require('./components');