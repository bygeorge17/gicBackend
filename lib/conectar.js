const mongoose = require('mongoose');
var db=mongoose.connection;
db.on('error',function(err){
  console.log(err);
});
db.once('open',function(){
  console.info('Conectado a mongoDB.');
});
// mongoose.connect("mongodb+srv://SuperGeorge:H4b1bt1.-@cluster0.wn7vm.mongodb.net/loteria", { useNewUrlParser: true,useUnifiedTopology: true });
mongoose.connect("mongodb://localhost:27017/genetic_informed", { useNewUrlParser: true,useUnifiedTopology: true });
