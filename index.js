const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
//mongodb
const { MongoClient, ServerApiVersion  } = require('mongodb');

const port = process.env.PORT ||5000;



//middleware
app.use(cors());
app.use(express.json()); //v 72.3


// from mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.far0qag.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// console.log(uri)

async function run(){
    try{
        await client.connect()
        // console.log('database connected')
        // v 72.3 
        const database =client.db('doctors_portal');
        const appointmentsCollection = database.collection('appointments');

        // v 72.7 
        app.get('/appointments', async(req,res) =>{
          const email = req.query.email;
          const date = new Date(req.query.date).toLocatDateString(); // v 72.9
          const query = {email: email, date: date} // v 72.9
          // console.log(query)
          const cursor = appointmentsCollection.find({query});
          const appointments = await cursor.toArray();
          res.json(appointments);
        })
        // v 72.7 

        app.post('/appointments', async(req, res) => {
          // v 72.5 
          const appointment = req.body;
          const result = await appointmentsCollection.insertOne(appointment);
          console.log(result);
          res.json(result)
          // v 72.5 
        })

        // v 72.3  
    }
    finally{
        await client.close()
    }
}

run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

/*
naming convantion 

app.get('/users')all user k neoya
app.post('/users') specific 1 ta user k neoya
app.get('/users/:id') specific 1 ta user neoya filter kore email or id
app.put('/users/:id') specific 1 ta user k update kora
app.delete('/users/:id')specific 1 ta user delete kora
*/